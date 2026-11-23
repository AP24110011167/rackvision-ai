import os
import io
import gc
import socket
import psutil
import time
import base64
import secrets
import requests
import threading
from pathlib import Path
from PIL import Image
import torch
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import pycloudflared
from pycloudflared import try_cloudflare
from pycloudflared.try_cloudflare import Urls

# Confirm Stage 7 passed and pipeline is loaded
if not Path('diagnostic_512_output.png').exists():
    raise RuntimeError('Stage 7 must complete before launching the server!')

if 'pipe' not in globals() or pipe is None:
    raise RuntimeError('SDXL pipeline (pipe) is not loaded in memory! Run Stages 3-5 first.')
print('✓ Verified loaded SDXL + ControlNet pipeline preserved in memory.')

# Runtime Verification of pycloudflared API (detects actual version or reports unknown)
def _get_pycloudflared_version() -> str:
    ver = getattr(pycloudflared, '__version__', None)
    if ver and str(ver) not in ("0.0.0", "unknown"):
        return str(ver)
    try:
        from importlib.metadata import version
        return version("pycloudflared")
    except Exception:
        pass
    return "unknown"

_pycloudflared_ver = _get_pycloudflared_version()
_ver_display = f"v{_pycloudflared_ver}" if _pycloudflared_ver != "unknown" else "(version: unknown)"

assert hasattr(Urls, '_fields') and Urls._fields == ('tunnel', 'metrics', 'process'), (
    f"Unexpected Urls fields: {getattr(Urls, '_fields', None)}"
)
assert hasattr(try_cloudflare, 'running') and isinstance(try_cloudflare.running, dict), (
    "try_cloudflare missing running dict registry"
)
assert hasattr(try_cloudflare, 'terminate') and callable(try_cloudflare.terminate), (
    "try_cloudflare missing terminate method"
)
print(f"✓ Verified pycloudflared {_ver_display} API: Urls fields={Urls._fields}, registry=try_cloudflare.running")

global _RACKVISION_SERVER_INSTANCE
global _RACKVISION_SERVER_THREAD
global _RACKVISION_TUNNEL_PROC

def is_port_in_use(port: int = 8000) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def _is_valid_process_handle(proc) -> bool:
    """
    Validates that a process handle object supports all required termination
    and verification methods (terminate, wait, kill, poll) and exposes an integer pid.
    A pid or poll attribute alone is insufficient.
    """
    if proc is None:
        return False
    required_methods = ('terminate', 'wait', 'kill', 'poll')
    for method in required_methods:
        if not (hasattr(proc, method) and callable(getattr(proc, method))):
            return False
    if not hasattr(proc, 'pid') or not isinstance(getattr(proc, 'pid'), int):
        return False
    return True

def _extract_tunnel_process(tunnel_obj, port: int = 8000):
    """
    Extracts and validates the underlying process handle for the Cloudflare tunnel
    using the verified pycloudflared API:
      1. Direct attribute: `tunnel_obj.process` (Urls namedtuple member)
      2. Registry lookup: `try_cloudflare.running[port].process`
    Validates that the returned process handle supports all required termination
    and verification methods (terminate, wait, kill, poll) and exposes an integer pid.
    A pid or poll attribute alone is insufficient.
    Returns None if the validated process handle cannot be identified.
    """
    # 1. Primary: Direct attribute on the returned Urls namedtuple
    if hasattr(tunnel_obj, 'process'):
        p = getattr(tunnel_obj, 'process')
        if _is_valid_process_handle(p):
            return p

    # 2. Package Registry: try_cloudflare.running dict keyed by port
    if hasattr(try_cloudflare, 'running') and isinstance(try_cloudflare.running, dict):
        if port in try_cloudflare.running:
            entry = try_cloudflare.running[port]
            if hasattr(entry, 'process'):
                p = getattr(entry, 'process')
                if _is_valid_process_handle(p):
                    return p
            elif _is_valid_process_handle(entry):
                return entry

    return None

def _probe_local_health(token: str, port: int = 8000) -> tuple:
    """
    Probes the local health endpoint directly on loopback 127.0.0.1:port.
    Returns (is_healthy: bool, detail_string: str).
    """
    try:
        r = requests.get(
            f"http://127.0.0.1:{port}/health",
            headers={"x-colab-auth": token},
            timeout=2.0
        )
        if r.status_code == 200:
            try:
                js = r.json()
                if js.get("status") == "healthy" or js.get("health") == "online":
                    return True, "HTTP 200 OK"
                return False, f"HTTP 200 (unexpected: {js})"
            except Exception:
                return False, "HTTP 200 (invalid JSON)"
        return False, f"HTTP {r.status_code} ({r.text[:40].strip()})"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"

def _classify_probe_result(res=None, exc=None) -> tuple:
    """
    Distinguishes and classifies public tunnel health check results into:
      - SUCCESS
      - DNS_RESOLUTION_FAILURE (pending edge propagation)
      - CONNECTION_TIMEOUT
      - CLOUDFLARE_TUNNEL_ERROR (HTTP 502/530/52x)
      - HTTP_AUTH_ERROR (HTTP 401/403)
      - HTTP_ERROR (other HTTP status)
      - NETWORK_ERROR (connection refused / reset)
    Returns (category: str, summary_description: str, body_snippet: str).
    """
    if res is not None:
        status = res.status_code
        body_snip = res.text[:120].replace('\n', ' ').strip()
        if status == 200:
            try:
                js = res.json()
                if js.get("status") == "healthy" or js.get("health") == "online":
                    return "SUCCESS", "HTTP 200 OK (online & healthy)", body_snip
                return "UNEXPECTED_BODY", f"HTTP 200 OK (unexpected payload: {js})", body_snip
            except Exception:
                return "INVALID_JSON", "HTTP 200 OK (non-JSON body)", body_snip
        elif status in (401, 403):
            return "HTTP_AUTH_ERROR", f"HTTP {status} Unauthorized (x-colab-auth header rejected)", body_snip
        elif status in (502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530):
            cf_map = {
                502: "Bad Gateway (Cloudflare edge cannot reach tunnel daemon or origin port 8000)",
                530: "Origin DNS/Routing Error (Tunnel registering/propagating at Cloudflare edge PoP)",
                521: "Web Server Is Down",
                522: "Connection Timed Out",
                524: "A Timeout Occurred"
            }
            desc = cf_map.get(status, "Cloudflare Edge/Tunnel Error")
            return "CLOUDFLARE_TUNNEL_ERROR", f"HTTP {status} {desc}", body_snip
        else:
            return "HTTP_ERROR", f"HTTP {status} {res.reason}", body_snip

    if exc is not None:
        exc_name = type(exc).__name__
        exc_str = str(exc)
        if isinstance(exc, requests.exceptions.Timeout):
            return "CONNECTION_TIMEOUT", f"{exc_name}: Request timed out connecting to Cloudflare edge", exc_str[:120]
        if isinstance(exc, requests.exceptions.SSLError):
            return "SSL_ERROR", f"{exc_name}: SSL certificate verification failed", exc_str[:120]
        if isinstance(exc, requests.exceptions.ConnectionError):
            lower_str = exc_str.lower()
            if any(term in lower_str for term in ("nameresolutionerror", "getaddrinfo failed", "nodename nor servname", "dns")):
                return "DNS_RESOLUTION_FAILURE", f"{exc_name}: DNS resolution failed (Cloudflare edge hostname propagating)", exc_str[:120]
            if "connection refused" in lower_str:
                return "CONNECTION_REFUSED", f"{exc_name}: Connection refused by edge endpoint", exc_str[:120]
            return "NETWORK_ERROR", f"{exc_name}: Connection failed", exc_str[:120]
        return "REQUEST_EXCEPTION", f"{exc_name}: {exc_str[:80]}", exc_str[:120]

    return "UNKNOWN", "No response or exception captured", ""

def cleanup_tracked_server_and_tunnel(port: int = 8000):
    """
    Safely shuts down only the Uvicorn server and Cloudflare tunnel explicitly
    created and tracked by this notebook. Does not kill unrelated processes.
    Verifies thread termination, tunnel termination, and port release independently.
    Never marks tunnel_terminated=True if process state is unknown.
    Retains references if verification fails.
    """
    global _RACKVISION_SERVER_INSTANCE, _RACKVISION_SERVER_THREAD, _RACKVISION_TUNNEL_PROC
    print(f"Inspecting active background services on port {port}...")

    # Check if any tracked resources from this notebook currently exist
    has_tracked_server = (
        ('_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None) or
        ('_RACKVISION_SERVER_INSTANCE' in globals() and _RACKVISION_SERVER_INSTANCE is not None)
    )
    has_tracked_tunnel = ('_RACKVISION_TUNNEL_PROC' in globals() and _RACKVISION_TUNNEL_PROC is not None)

    # Initial start condition: No tracked resources from this notebook
    if not has_tracked_server and not has_tracked_tunnel:
        if not is_port_in_use(port):
            print(f"✓ No previous RackVision server or tunnel tracked in this session. Port {port} is free and ready.")
            return
        else:
            raise RuntimeError(
                f"ABORT: Port {port} is currently occupied by an external process not managed by this notebook. "
                f"Stage 8 will not terminate external processes. Please free port {port} before proceeding."
            )

    # A. Stop and independently verify tracked Cloudflare tunnel process
    tunnel_terminated = False
    if '_RACKVISION_TUNNEL_PROC' in globals() and _RACKVISION_TUNNEL_PROC is not None:
        proc = _RACKVISION_TUNNEL_PROC
        print(f"  Terminating tracked Cloudflare process (pid={proc.pid})...")
        try:
            proc.terminate()
            try:
                if hasattr(proc, 'wait'):
                    proc.wait(timeout=3.0)
            except Exception:
                if hasattr(proc, 'kill'):
                    proc.kill()
                    proc.wait(timeout=2.0)
        except Exception as e:
            print(f"  Note on process termination: {e}")

        try:
            if hasattr(try_cloudflare, 'terminate'):
                try_cloudflare.terminate(port)
        except Exception as e:
            print(f"  Note on try_cloudflare.terminate: {e}")

        # Requirement: Independently verify process exit. Exception is UNKNOWN/UNVERIFIED, not dead!
        is_dead = False
        if hasattr(proc, 'poll'):
            is_dead = proc.poll() is not None
        if not is_dead and hasattr(proc, 'is_running'):
            try:
                is_dead = not proc.is_running()
            except Exception:
                is_dead = False

        if not is_dead:
            raise RuntimeError(
                f"ABORT: Tracked Cloudflare tunnel process (pid={proc.pid}) failed to terminate! "
                "Process is still active. References NOT cleared. Port cleanup aborted."
            )

        print(f"  ✓ Tracked Cloudflare process (pid={proc.pid}) verified terminated.")
        tunnel_terminated = True
        _RACKVISION_TUNNEL_PROC = None
    else:
        try:
            if hasattr(try_cloudflare, 'terminate'):
                try_cloudflare.terminate(port)
        except Exception:
            pass
        # Requirement: When _RACKVISION_TUNNEL_PROC is missing, a free local port does NOT
        # prove that the Cloudflare process has exited. Treat this state as unverified and fail safely!
        tunnel_terminated = False
        print("WARNING: Tracked Cloudflare process handle was missing. Tunnel exit state is UNVERIFIED.")

    # B. Signal tracked in-memory Uvicorn server to stop
    if '_RACKVISION_SERVER_INSTANCE' in globals() and _RACKVISION_SERVER_INSTANCE is not None:
        try:
            print("  Signaling tracked Uvicorn server instance to exit...")
            _RACKVISION_SERVER_INSTANCE.should_exit = True
        except Exception as e:
            print(f"  Note on server signal: {e}")

    # C. Ensure existing Uvicorn server thread has fully exited before proceeding
    thread_terminated = False
    if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None:
        if _RACKVISION_SERVER_THREAD.is_alive():
            print(f"  Waiting for previous Uvicorn server thread (ident={_RACKVISION_SERVER_THREAD.ident}) to exit...")
            _RACKVISION_SERVER_THREAD.join(timeout=5.0)

            if _RACKVISION_SERVER_THREAD.is_alive():
                raise RuntimeError(
                    f"ABORT: The previous Uvicorn server thread (ident={_RACKVISION_SERVER_THREAD.ident}) "
                    f"is still active after 5.0s timeout. Cannot start a new server while the previous "
                    f"thread is running on port {port}. References have NOT been cleared. "
                    f"Please interrupt the running keepalive cell (Cell 20) before re-running Stage 8."
                )
            print("  ✓ Previous Uvicorn server thread has fully terminated.")
        thread_terminated = True
        _RACKVISION_SERVER_THREAD = None
    else:
        thread_terminated = True

    _RACKVISION_SERVER_INSTANCE = None

    # D. Wait up to 5 seconds for port 8000 socket to be released
    deadline = time.time() + 5.0
    port_freed = False
    while time.time() < deadline:
        if not is_port_in_use(port):
            port_freed = True
            break
        time.sleep(0.5)

    if is_port_in_use(port):
        raise RuntimeError(
            f"ABORT: Port {port} is currently in use by an external process not managed by this notebook. "
            f"Stage 8 will not terminate unrelated processes. Please free port {port} before proceeding."
        )

    # Fail safely if any resource is unverified
    if not (thread_terminated and port_freed and tunnel_terminated):
        raise RuntimeError(
            f"FAIL-SAFE ABORT: Cleanup could not be verified! All resources must be confirmed: "
            f"thread_terminated={thread_terminated}, port_freed={port_freed}, tunnel_terminated={tunnel_terminated}. "
            f"Stage 8 will not start a new server while background tunnel or server state is unverified."
        )

    print(f"✓ Port {port} is verified free and ready for binding.")

cleanup_tracked_server_and_tunnel(port=8000)

AUTH_TOKEN = secrets.token_urlsafe(32)
token_path = Path('/content/.rackvision_auth_token')
token_path.write_text(AUTH_TOKEN, encoding='utf-8')
os.chmod(token_path, 0o600)

app = FastAPI(title="RackVision AI Colab Inference Engine")

class InferenceRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = (
        "blurry, low quality, distorted, deformed, text, watermark, bad architecture, unrealistic proportions, messy"
    )
    canny_image: Optional[str] = None
    image: Optional[str] = None
    depth_image: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    target_resolution: Optional[str] = "768x768"
    seed: Optional[int] = 42
    num_inference_steps: Optional[int] = 25
    guidance_scale: Optional[float] = 7.5
    canny_scale: Optional[float] = None
    controlnet_conditioning_scale: Optional[float] = 0.5
    depth_scale: Optional[float] = None

@app.get("/health")
async def health_check(request: Request):
    auth_header = request.headers.get("x-colab-auth", "")
    if auth_header != AUTH_TOKEN:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Unauthorized: Invalid or missing token"})

    gpu_allocated = torch.cuda.memory_allocated() / (1024 ** 2) if torch.cuda.is_available() else 0.0
    gpu_reserved = torch.cuda.memory_reserved() / (1024 ** 2) if torch.cuda.is_available() else 0.0
    vram_free = 0.0
    if torch.cuda.is_available():
        free_b, total_b = torch.cuda.mem_get_info()
        vram_free = free_b / (1024 ** 2)

    return {
        "status": "healthy",
        "health": "online",
        "service": "rackvision_colab_sdxl_controlnet",
        "model": "SDXL-ControlNet-Canny",
        "pipeline": "StableDiffusionXLControlNetPipeline",
        'controlnet': 'diffusers/controlnet-canny-sdxl-1.0',
        "base_model": "stabilityai/stable-diffusion-xl-base-1.0",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None",
        "vram_allocated_mb": round(gpu_allocated, 1),
        "vram_reserved_mb": round(gpu_reserved, 1),
        "vram_free_mb": round(vram_free, 1),
        "ram_used_percent": psutil.virtual_memory().percent
    }

@app.post("/generate")
async def generate(req: InferenceRequest, request: Request):
    auth_header = request.headers.get("x-colab-auth", "")
    if auth_header != AUTH_TOKEN:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Unauthorized: Invalid or missing token"})

    t0 = time.time()
    try:
        raw_b64 = req.canny_image or req.image
        if not raw_b64:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing conditioning image (canny_image or image)"})

        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        cond_bytes = base64.b64decode(raw_b64)
        cond_pil = Image.open(io.BytesIO(cond_bytes)).convert("RGB")

        w, h = 768, 768
        if req.width and req.height:
            w, h = req.width, req.height
        elif req.target_resolution:
            parts = req.target_resolution.lower().split("x")
            if len(parts) == 2:
                try:
                    w, h = int(parts[0]), int(parts[1])
                except ValueError:
                    w, h = 768, 768

        w = (w // 8) * 8
        h = (h // 8) * 8
        cond_pil = cond_pil.resize((w, h), Image.Resampling.LANCZOS)

        scale = req.canny_scale if req.canny_scale is not None else req.controlnet_conditioning_scale
        if scale is None:
            scale = 0.5

        steps = req.num_inference_steps or 25
        guidance = req.guidance_scale or 7.5
        seed = req.seed if req.seed is not None else 42
        generator = torch.Generator(device="cuda" if torch.cuda.is_available() else "cpu").manual_seed(seed)

        with torch.inference_mode():
            result = pipe(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                image=cond_pil,
                controlnet_conditioning_scale=scale,
                num_inference_steps=steps,
                guidance_scale=guidance,
                generator=generator,
                width=w,
                height=h
            )

        out_img = result.images[0]
        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        out_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        latency = round(time.time() - t0, 3)

        return {
            "status": "success",
            "image": f"data:image/png;base64,{out_b64}",
            "latency_seconds": latency,
            "width": w,
            "height": h,
            "steps": steps,
            'controlnet': 'diffusers/controlnet-canny-sdxl-1.0',
            "model": "SDXL-ControlNet-Canny"
        }

    except Exception as exc:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(exc)})

config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
_RACKVISION_SERVER_INSTANCE = uvicorn.Server(config)

server_errors = []
def run_uvicorn_server():
    try:
        _RACKVISION_SERVER_INSTANCE.run()
    except Exception as exc:
        server_errors.append(exc)

_RACKVISION_SERVER_THREAD = threading.Thread(target=run_uvicorn_server, daemon=True)
_RACKVISION_SERVER_THREAD.start()

start_deadline = time.time() + 8.0
while not _RACKVISION_SERVER_INSTANCE.started and time.time() < start_deadline:
    if server_errors:
        raise RuntimeError(f"Uvicorn server failed during startup: {server_errors[0]}")
    if not _RACKVISION_SERVER_THREAD.is_alive():
        raise RuntimeError("Uvicorn server thread died immediately upon start.")
    time.sleep(0.2)

if not _RACKVISION_SERVER_INSTANCE.started:
    raise RuntimeError("Uvicorn server did not reach started state within 8 seconds.")

print(f"✓ Uvicorn server successfully bound to 127.0.0.1:8000 (thread ident={_RACKVISION_SERVER_THREAD.ident})")

# 5. Local Authenticated Health Check
print("Verifying local FastAPI health on 127.0.0.1:8000...")
local_verified, local_msg = _probe_local_health(AUTH_TOKEN, port=8000)

if not local_verified:
    print(f"Local health check failed ({local_msg}). Shutting down server safely...")
    if _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if _RACKVISION_SERVER_THREAD is not None:
        _RACKVISION_SERVER_THREAD.join(timeout=5.0)
        if _RACKVISION_SERVER_THREAD.is_alive():
            raise RuntimeError("ABORT: Uvicorn server thread failed to terminate after local health failure. References NOT cleared.")
        _RACKVISION_SERVER_THREAD = None
    _RACKVISION_SERVER_INSTANCE = None
    deadline = time.time() + 5.0
    while time.time() < deadline:
        if not is_port_in_use(8000):
            break
        time.sleep(0.5)
    raise RuntimeError(f"Local FastAPI health check failed on 127.0.0.1:8000: {local_msg}")

print("✓ Local FastAPI health check: PASSED (HTTP 200 OK)")

# 6. Establish Cloudflare Tunnel & Extract Verified Process Handle
print("Establishing secure Cloudflare tunnel via pycloudflared...")
tunnel = try_cloudflare(port=8000)
tunnel_url = getattr(tunnel, 'tunnel', None) or getattr(tunnel, 'url', None) or str(tunnel)

# Extract and validate exact process handle via verified API
_RACKVISION_TUNNEL_PROC = _extract_tunnel_process(tunnel, port=8000)

# Fail-safe abort if process handle is unidentifiable or does not support required methods:
# Do not report cleanup as complete merely because Uvicorn thread stopped!
# Verify tunnel termination and port release independently. Report incomplete and retain available references.
if not _is_valid_process_handle(_RACKVISION_TUNNEL_PROC):
    print("WARNING: Could not identify or validate process handle supporting required methods (terminate, wait, kill, poll, pid).")
    print("Attempting safe server teardown and independent verification...")

    # Step A: Signal tracked server to exit and join thread
    server_stopped = False
    if _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if _RACKVISION_SERVER_THREAD is not None:
        _RACKVISION_SERVER_THREAD.join(timeout=5.0)
        server_stopped = not _RACKVISION_SERVER_THREAD.is_alive()

    # Step B: Attempt tunnel termination via try_cloudflare.terminate(8000)
    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception as e:
        print(f"Note on try_cloudflare.terminate: {e}")

    # Independently verify tunnel termination: unconfirmed without process handle
    tunnel_confirmed = False

    # Step C: Independently verify socket port 8000 release
    port_freed = False
    deadline = time.time() + 5.0
    while time.time() < deadline:
        if not is_port_in_use(8000):
            port_freed = True
            break
        time.sleep(0.5)

    # Step D: Report cleanup as incomplete and retain available references
    print(f"Teardown verification incomplete: server_stopped={server_stopped}, tunnel_confirmed={tunnel_confirmed}, port_freed={port_freed}.")
    print("Retaining available references for diagnosis.")

    global _RACKVISION_UNTRACKED_TUNNEL
    _RACKVISION_UNTRACKED_TUNNEL = tunnel

    raise RuntimeError(
        f"FAIL-SAFE ABORT: Cleanup is INCOMPLETE! Cloudflare tunnel was created but a valid process handle supporting "
        f"required methods (terminate, wait, kill, poll, pid) could not be identified from pycloudflared "
        f"(attributes on tunnel: {dir(tunnel)}).\n"
        f"Verification results: server_stopped={server_stopped}, tunnel_confirmed={tunnel_confirmed}, port_freed={port_freed}.\n"
        "Tunnel termination could not be confirmed. Cleanup is incomplete and available references have been retained."
    )

print(f"✓ Exact Cloudflare tunnel process identified and validated: pid={_RACKVISION_TUNNEL_PROC.pid}")
print(f"Production Tunnel URL provisioned: {tunnel_url}")
print("Allowing initial Cloudflare edge DNS/tunnel propagation window (5.0s)...")
time.sleep(5.0)

print(f"Beginning production public tunnel health check at {tunnel_url}/health ...")

tunnel_verified = False
prod_attempts_log = []
max_attempts = 25
retry_delay = 2.0
t_start = time.time()

for attempt in range(1, max_attempts + 1):
    elapsed = time.time() - t_start

    # 1. Test local /health immediately before public probe
    local_pre_ok, local_pre_msg = _probe_local_health(AUTH_TOKEN, port=8000)
    local_pre_tag = "OK" if local_pre_ok else f"FAIL({local_pre_msg})"

    # 2. Public health check probe
    res = None
    captured_exc = None
    try:
        res = requests.get(
            f"{tunnel_url}/health",
            headers={"x-colab-auth": AUTH_TOKEN},
            timeout=4.0
        )
    except Exception as exc:
        captured_exc = exc

    # 3. Test local /health immediately after public probe
    local_post_ok, local_post_msg = _probe_local_health(AUTH_TOKEN, port=8000)
    local_post_tag = "OK" if local_post_ok else f"FAIL({local_post_msg})"

    # 4. Classify and log
    category, desc, snippet = _classify_probe_result(res=res, exc=captured_exc)
    log_entry = {
        "attempt": attempt,
        "elapsed_s": round(elapsed, 1),
        "category": category,
        "description": desc,
        "body_snippet": snippet,
        "local_pre": local_pre_msg,
        "local_post": local_post_msg
    }
    prod_attempts_log.append(log_entry)

    snip_display = f" | Body: '{snippet}'" if snippet else ""
    print(f"  [Attempt {attempt:2d}/{max_attempts}] (+{elapsed:4.1f}s) | Local Pre: {local_pre_tag} | Public: [{category}] {desc}{snip_display} | Local Post: {local_post_tag}")

    if category == "SUCCESS":
        tunnel_verified = True
        break

    time.sleep(retry_delay)

if not tunnel_verified:
    total_time = round(time.time() - t_start, 1)
    print("\n" + "=" * 75)
    print("❌ PRODUCTION PUBLIC HEALTH CHECK FAILED: TELEMETRY ANALYSIS")
    print("=" * 75)
    print(f"Total Probing Duration: {total_time}s across {len(prod_attempts_log)} attempts.")
    cat_counts = {}
    for entry in prod_attempts_log:
        cat_counts[entry['category']] = cat_counts.get(entry['category'], 0) + 1
    print(f"Category Breakdown: {cat_counts}")
    if prod_attempts_log:
        print(f"Last Attempt Result: [{prod_attempts_log[-1]['category']}] {prod_attempts_log[-1]['description']}")
        print(f"Local Pre-Check on Last Attempt: {prod_attempts_log[-1]['local_pre']}")
        print(f"Local Post-Check on Last Attempt: {prod_attempts_log[-1]['local_post']}")
    print("=" * 75)

    print("Shutting down Uvicorn server and Cloudflare tunnel due to verification failure...")
    if _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if _RACKVISION_SERVER_THREAD is not None:
        _RACKVISION_SERVER_THREAD.join(timeout=5.0)
        if _RACKVISION_SERVER_THREAD.is_alive():
            raise RuntimeError("ABORT: Uvicorn server thread failed to terminate after Cloudflare tunnel failure. References NOT cleared.")
        print("✓ Tracked Uvicorn server thread terminated.")
        _RACKVISION_SERVER_THREAD = None
    _RACKVISION_SERVER_INSTANCE = None

    if _RACKVISION_TUNNEL_PROC is not None:
        try:
            _RACKVISION_TUNNEL_PROC.terminate()
            try:
                if hasattr(_RACKVISION_TUNNEL_PROC, 'wait'):
                    _RACKVISION_TUNNEL_PROC.wait(timeout=3.0)
            except Exception:
                if hasattr(_RACKVISION_TUNNEL_PROC, 'kill'):
                    _RACKVISION_TUNNEL_PROC.kill()
                    _RACKVISION_TUNNEL_PROC.wait(timeout=2.0)
        except Exception as e:
            print(f"Note on tunnel termination: {e}")

        # Requirement: Exception during is_running() is UNKNOWN/UNVERIFIED, not dead!
        is_dead = False
        if hasattr(_RACKVISION_TUNNEL_PROC, 'poll'):
            is_dead = _RACKVISION_TUNNEL_PROC.poll() is not None
        if not is_dead and hasattr(_RACKVISION_TUNNEL_PROC, 'is_running'):
            try:
                is_dead = not _RACKVISION_TUNNEL_PROC.is_running()
            except Exception:
                is_dead = False

        if not is_dead:
            raise RuntimeError(f"ABORT: Cloudflare process (pid={_RACKVISION_TUNNEL_PROC.pid}) failed to terminate! References NOT cleared.")
        _RACKVISION_TUNNEL_PROC = None

    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception as e:
        print(f"Note on try_cloudflare.terminate: {e}")

    deadline = time.time() + 5.0
    port_freed = False
    while time.time() < deadline:
        if not is_port_in_use(8000):
            port_freed = True
            break
        time.sleep(0.5)

    if not port_freed:
        raise RuntimeError("ABORT: Port 8000 was not released after Cloudflare verification failure!")

    print("✓ Verified cleanup: Tracked server stopped, tunnel terminated, and port 8000 socket released.")
    raise RuntimeError(
        f"ABORT: Cloudflare public tunnel failed health check at {tunnel_url}/health after {total_time}s "
        f"({cat_counts}). The Uvicorn server and tunnel have been safely shut down. "
        f"Tunnel URL will not be published until public verification passes."
    )

print("✓ Public Cloudflare Tunnel: REACHABLE & AUTHENTICATED (HTTP 200 OK)")

# 7. Display Server Status (Never Prints Token)
print('=' * 75)
print('RACKVISION AI COLAB INFERENCE SERVER IS ONLINE & VERIFIED!')
print(f'PUBLIC TUNNEL URL: {tunnel_url}')
print('AUTHENTICATION:   ENABLED (Session Token Regenerated & Protected)')
print('AUTH TOKEN:       [PROTECTED - Stored securely in /content/.rackvision_auth_token]')
print('ACTIVE PIPELINE:  SDXL 1.0 (FP16 Low-RAM) + ControlNet Canny')
print('BASE RESOLUTION:  512x512 / 768x768 Conditioning')
print('=' * 75)
print('HOW TO ENTER TOKEN INTO RACKVISION AI (Zero Output Exposure):')
print('  1. In Google Colab left sidebar, click the Files icon (folder icon).')
print('  2. Double-click ".rackvision_auth_token" to view your token in the Colab editor pane.')
print('  3. Copy your token from the editor pane.')
print('  4. In RackVision AI -> Settings -> Google Colab GPU Inference Adapter:')
print(f'     • Colab Server URL:    {tunnel_url}')
print('     • Authentication Token: [Paste token from .rackvision_auth_token]')
print('     • Click: CONNECT TO COLAB')
print('=' * 75)
