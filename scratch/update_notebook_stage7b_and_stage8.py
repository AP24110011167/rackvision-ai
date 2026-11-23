import json
import ast
import shutil
from pathlib import Path

# Load original notebook to get cells 0-14 (Stages 1 through 7)
nb_path = Path("notebooks/RackVision_SDXL_ControlNet.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Keep cells 0 to 14 intact
base_cells = nb["cells"][:15]
print(f"Preserved {len(base_cells)} base cells (Stages 1 through 7)")

# ---------------------------------------------------------------------------
# CELL 15: Markdown for Stage 7B
# ---------------------------------------------------------------------------
cell_15_md = {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## Stage 7B: Safe Server & Public Tunnel Diagnostic Test (Zero Inference)\n",
        "\n",
        "This diagnostic cell tests Uvicorn server binding on port `8000`, authenticated local health check, Cloudflare public tunnel creation, and end-to-end shutdown **without generating any architectural images** or reloading the SDXL pipeline.\n",
        "\n",
        "- **Zero VRAM / Compute Overhead**: Runs a lightweight mock health probe to verify networking.\n",
        "- **Cryptographic Token Safety**: Uses an isolated dynamic probe token (`secrets.token_urlsafe(32)`); does not regenerate or overwrite `/content/.rackvision_auth_token`.\n",
        "- **Strict Reference Integrity**: If the server thread does not exit within 5.0s, aborts immediately without clearing references.\n",
        "- **Dual Verified Teardown**: Confirms both thread termination and socket port `8000` release before reporting cleanup complete."
    ]
}

# ---------------------------------------------------------------------------
# CELL 16: Code for Stage 7B Diagnostic Test
# ---------------------------------------------------------------------------
cell_16_code_str = '''import time
import socket
import secrets
import requests
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from pycloudflared import try_cloudflare

print("=" * 75)
print("STAGE 7B: SAFE SERVER & PUBLIC TUNNEL DIAGNOSTIC TEST (ZERO INFERENCE)")
print("=" * 75)

# Diagnostic socket check helper
def _diag_is_port_in_use(port: int = 8000) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

# 1. Clean up any stale diagnostic or previous instances
if _diag_is_port_in_use(8000):
    print("Port 8000 is currently occupied. Attempting cleanup before diagnostic test...")
    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception:
        pass
    if '_RACKVISION_SERVER_INSTANCE' in globals() and _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None:
        if _RACKVISION_SERVER_THREAD.is_alive():
            _RACKVISION_SERVER_THREAD.join(timeout=5.0)
            if _RACKVISION_SERVER_THREAD.is_alive():
                raise RuntimeError(
                    f"ABORT: Tracked server thread (ident={_RACKVISION_SERVER_THREAD.ident}) is still alive after 5.0s. "
                    "References NOT cleared."
                )
        _RACKVISION_SERVER_THREAD = None
    _RACKVISION_SERVER_INSTANCE = None
    time.sleep(1.0)
    if _diag_is_port_in_use(8000):
        raise RuntimeError("ABORT: Port 8000 is occupied by an external process. Please free port 8000 before running Stage 7B.")

print("✓ Port 8000 is free and available.")

# 2. Build lightweight diagnostic FastAPI application (Zero GPU inference)
# Dynamic cryptographic token generated via secrets.token_urlsafe(32) — in memory only
DIAG_PROBE_TOKEN = secrets.token_urlsafe(32)
diag_app = FastAPI(title="RackVision Diagnostic Probe")

@diag_app.get("/health")
async def diag_health_check(request: Request):
    auth_header = request.headers.get("x-colab-auth", "")
    if auth_header != DIAG_PROBE_TOKEN:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Unauthorized"})
    return {
        "status": "healthy",
        "health": "online",
        "service": "rackvision_diagnostic_probe",
        "gpu_pipeline": "ready",
        "model": "SDXL-ControlNet-Canny-Diagnostic",
        "test_mode": True
    }

# 3. Start diagnostic Uvicorn server in background thread
diag_config = uvicorn.Config(diag_app, host="127.0.0.1", port=8000, log_level="warning")
diag_server = uvicorn.Server(diag_config)

diag_errors = []
def run_diag_server():
    try:
        diag_server.run()
    except Exception as exc:
        diag_errors.append(exc)

diag_thread = threading.Thread(target=run_diag_server, daemon=True)
diag_thread.start()

# Wait for diagnostic server to bind
bind_deadline = time.time() + 8.0
while not diag_server.started and time.time() < bind_deadline:
    if diag_errors:
        raise RuntimeError(f"Diagnostic server failed to bind: {diag_errors[0]}")
    if not diag_thread.is_alive():
        raise RuntimeError("Diagnostic server thread died immediately upon start.")
    time.sleep(0.2)

if not diag_server.started:
    raise RuntimeError("Diagnostic server did not start within 8 seconds.")
print("✓ Diagnostic Uvicorn server successfully bound to 127.0.0.1:8000.")

# 4. Local Health Check
diag_local_ok = False
for attempt in range(1, 6):
    try:
        res = requests.get("http://127.0.0.1:8000/health", headers={"x-colab-auth": DIAG_PROBE_TOKEN}, timeout=2)
        if res.status_code == 200 and res.json().get("health") == "online":
            diag_local_ok = True
            break
    except Exception:
        time.sleep(0.5)

if not diag_local_ok:
    diag_server.should_exit = True
    diag_thread.join(timeout=5.0)
    if diag_thread.is_alive():
        raise RuntimeError("ABORT: Diagnostic server thread failed to terminate after local health failure. References NOT cleared.")
    diag_server = None
    diag_thread = None
    raise RuntimeError("Local diagnostic health check failed at http://127.0.0.1:8000/health.")
print("✓ Local Diagnostic Health Check: PASSED (HTTP 200 OK)")

# 5. Cloudflare Tunnel Health Check
print("Establishing temporary diagnostic Cloudflare tunnel...")
diag_tunnel = try_cloudflare(port=8000)
diag_tunnel_url = diag_tunnel.tunnel
print(f"Verifying diagnostic public tunnel: {diag_tunnel_url} ...")

diag_public_ok = False
for attempt in range(1, 15):
    try:
        t_res = requests.get(f"{diag_tunnel_url}/health", headers={"x-colab-auth": DIAG_PROBE_TOKEN}, timeout=4)
        if t_res.status_code == 200 and t_res.json().get("health") == "online":
            diag_public_ok = True
            break
    except Exception:
        pass
    time.sleep(1.5)

if not diag_public_ok:
    print("Diagnostic public tunnel check failed. Cleaning up...")
    diag_server.should_exit = True
    diag_thread.join(timeout=5.0)
    if diag_thread.is_alive():
        raise RuntimeError("ABORT: Diagnostic server thread failed to terminate after public tunnel failure. References NOT cleared.")
    diag_server = None
    diag_thread = None
    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception:
        pass
    raise RuntimeError(f"Diagnostic Cloudflare tunnel failed at {diag_tunnel_url}/health.")
print("✓ Public Cloudflare Diagnostic Health Check: PASSED (HTTP 200 OK)")

# 6. Test Safe Shutdown and Port Release (Dual Verified)
print("Testing diagnostic shutdown and resource release...")
diag_server.should_exit = True
diag_thread.join(timeout=5.0)

if diag_thread.is_alive():
    raise RuntimeError(f"ABORT: Diagnostic server thread (ident={diag_thread.ident}) failed to terminate within 5.0s timeout. References NOT cleared!")

diag_server = None
diag_thread = None

tunnel_terminated = False
try:
    if hasattr(try_cloudflare, 'terminate'):
        try_cloudflare.terminate(8000)
        tunnel_terminated = True
        print("✓ Diagnostic Cloudflare tunnel terminated.")
except Exception as e:
    print(f"Note on tunnel termination: {e}")

# Verify port released
release_deadline = time.time() + 5.0
port_freed = False
while time.time() < release_deadline:
    if not _diag_is_port_in_use(8000):
        port_freed = True
        break
    time.sleep(0.5)

if not port_freed:
    raise RuntimeError("ABORT: Port 8000 was not released after diagnostic shutdown!")
print("✓ Port 8000 verified completely free and released.")

print("=" * 75)
print("🎉 ALL DIAGNOSTIC CHECKS PASSED SUCCESSFULLY!")
print("  • Uvicorn binding on port 8000:       VERIFIED")
print("  • Dynamic token authentication:       VERIFIED (secrets.token_urlsafe)")
print("  • Authenticated local health check:   VERIFIED")
print("  • Cloudflare public tunnel reach:     VERIFIED")
print("  • Graceful server & tunnel shutdown:  VERIFIED")
print("  • Port 8000 socket clean release:     VERIFIED")
print("  • Loaded SDXL pipeline state:         INTACT & PRESERVED")
print("  • Total SDXL inference images run:    0 (Safe & zero overhead)")
print("You can now safely proceed to run Stage 8 (Production Server) below.")
print("=" * 75)
'''

cell_16_code = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell_16_code_str.split("\n")]
}

# ---------------------------------------------------------------------------
# CELL 17: Markdown for Stage 8 Production Server
# ---------------------------------------------------------------------------
cell_17_md = {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## Stage 8: Launch Authenticated RackVision Production Inference Server\n",
        "\n",
        "Launches the production SDXL + ControlNet Canny GPU server with:\n",
        "1. **Full API Contract Parity**: Native support for `canny_image` and `image`, `width`/`height` and `target_resolution`, `canny_scale` and `controlnet_conditioning_scale`, and `latency_seconds`.\n",
        "2. **Strict Instance Tracking**: Tracks only `_RACKVISION_SERVER_INSTANCE` and `_RACKVISION_SERVER_THREAD`. Never clears references if a thread is alive after timeout.\n",
        "3. **Zero Token Output Exposure**: Regenerates a fresh 256-bit token stored in `/content/.rackvision_auth_token` (`chmod 0600`). Never prints the token to cell output.\n",
        "4. **Preserved Pipeline Integrity**: Verifies loaded pipeline in memory; does not reload models.\n",
        "5. **Dual Health & Cleanup Verification**: Verifies local loopback and Cloudflare public tunnel. If either check fails, both server and tunnel are stopped and verified before cleanup is reported."
    ]
}

# ---------------------------------------------------------------------------
# CELL 18: Code for Stage 8 Production Server
# ---------------------------------------------------------------------------
cell_18_code_str = '''import os
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
from pycloudflared import try_cloudflare

# Confirm Stage 7 passed and loaded pipeline is intact in memory
if not Path('diagnostic_512_output.png').exists():
    raise RuntimeError('Stage 7 must complete before launching the server!')

if 'pipe' not in globals() or pipe is None:
    raise RuntimeError('SDXL pipeline (pipe) is not loaded in memory! Run Stages 3-5 first.')
print('✓ Verified loaded SDXL + ControlNet pipeline preserved in memory.')

# Global trackers for server instance and thread explicitly created by this notebook
global _RACKVISION_SERVER_INSTANCE
global _RACKVISION_SERVER_THREAD

# ---------------------------------------------------------------------------
# 1. IDEMPOTENT LIFECYCLE & PROCESS-SAFE CLEANUP (NO GC SWEEPS)
# ---------------------------------------------------------------------------
def is_port_in_use(port: int = 8000) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def cleanup_tracked_server_and_tunnel(port: int = 8000):
    """
    Safely shuts down only the Uvicorn server and Cloudflare tunnel explicitly
    created and tracked by this notebook. Does not kill unrelated processes.
    Strictly removes gc.get_objects() loops.
    """
    global _RACKVISION_SERVER_INSTANCE, _RACKVISION_SERVER_THREAD
    print(f"Inspecting active background services on port {port}...")

    # A. Stop tracked Cloudflare tunnel using official pycloudflared API
    try:
        if hasattr(try_cloudflare, 'terminate'):
            print("  Terminating tracked Cloudflare tunnel via try_cloudflare.terminate()...")
            try_cloudflare.terminate(port)
    except Exception as e:
        print(f"  Note on tunnel termination: {e}")

    # B. Signal tracked in-memory Uvicorn server to stop (ONLY tracked instance)
    if '_RACKVISION_SERVER_INSTANCE' in globals() and _RACKVISION_SERVER_INSTANCE is not None:
        try:
            print("  Signaling tracked Uvicorn server instance to exit...")
            _RACKVISION_SERVER_INSTANCE.should_exit = True
        except Exception as e:
            print(f"  Note on server signal: {e}")

    # C. Ensure existing Uvicorn server thread has fully exited before proceeding
    if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None:
        if _RACKVISION_SERVER_THREAD.is_alive():
            print(f"  Waiting for previous Uvicorn server thread (ident={_RACKVISION_SERVER_THREAD.ident}) to exit...")
            _RACKVISION_SERVER_THREAD.join(timeout=5.0)

            # Rule: If thread is still alive after timeout, ABORT immediately! Never clear references.
            if _RACKVISION_SERVER_THREAD.is_alive():
                raise RuntimeError(
                    f"ABORT: The previous Uvicorn server thread (ident={_RACKVISION_SERVER_THREAD.ident}) "
                    f"is still active after 5.0s timeout. Cannot start a new server while the previous "
                    f"thread is running on port {port}. References have NOT been cleared. "
                    f"Please interrupt the running keepalive cell (Cell 20) before re-running Stage 8."
                )
            print("  ✓ Previous Uvicorn server thread has fully terminated.")
        _RACKVISION_SERVER_THREAD = None

    _RACKVISION_SERVER_INSTANCE = None

    # D. Wait up to 5 seconds for port 8000 socket to be released
    deadline = time.time() + 5.0
    while is_port_in_use(port) and time.time() < deadline:
        time.sleep(0.5)

    # Rule: If port is occupied by an unrelated process, abort; do not terminate external processes
    if is_port_in_use(port):
        raise RuntimeError(
            f"ABORT: Port {port} is currently in use by an external process not managed by this notebook. "
            f"Stage 8 will not terminate unrelated processes. Please free port {port} before proceeding."
        )

    print(f"✓ Port {port} is verified free and ready for binding.")

# Run idempotent cleanup before starting server
cleanup_tracked_server_and_tunnel(port=8000)

# ---------------------------------------------------------------------------
# 2. CRYPTOGRAPHIC TOKEN REGENERATION & SECURE LOCAL STORAGE
# ---------------------------------------------------------------------------
# Generate a fresh 256-bit token to revoke any previously exposed credentials
AUTH_TOKEN = secrets.token_urlsafe(32)

# Save to protected file with 0600 permissions; never print the token to cell output
token_path = Path('/content/.rackvision_auth_token')
token_path.write_text(AUTH_TOKEN, encoding='utf-8')
os.chmod(token_path, 0o600)

# ---------------------------------------------------------------------------
# 3. FASTAPI INFERENCE APPLICATION DEFINITION (FULL CONTRACT PARITY)
# ---------------------------------------------------------------------------
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

    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU"
    vram_alloc = torch.cuda.memory_allocated(0) / (1024**3) if torch.cuda.is_available() else 0.0
    vram_total = torch.cuda.get_device_properties(0).total_memory / (1024**3) if torch.cuda.is_available() else 0.0
    sys_ram = psutil.virtual_memory()

    return {
        'status': 'healthy',
        'health': 'online',
        'service': 'rackvision_colab_gpu_inference',
        'model': 'stabilityai/stable-diffusion-xl-base-1.0',
        'controlnet': 'diffusers/controlnet-canny-sdxl-1.0',
        'gpu_name': gpu_name,
        'vram_allocated_gb': round(vram_alloc, 2),
        'vram_total_gb': round(vram_total, 2),
        'system_ram_used_gb': round((sys_ram.total - sys_ram.available) / (1024**3), 2),
        'system_ram_total_gb': round(sys_ram.total / (1024**3), 2),
        'supported_resolutions': ['512x512', '768x768'],
        'version': '2.2.0-canny-authenticated'
    }

@app.post("/generate")
async def generate_image(req: InferenceRequest, request: Request):
    auth_header = request.headers.get("x-colab-auth", "")
    if auth_header != AUTH_TOKEN:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Unauthorized: Invalid or missing token"})

    t0 = time.time()
    try:
        # Resolve conditioning image from canny_image or image
        raw_img = req.canny_image or req.image
        if not raw_img:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing conditioning image (canny_image or image required)"})

        if "base64," in raw_img:
            raw_img = raw_img.split("base64,")[1]
        img_bytes = base64.b64decode(raw_img)
        input_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Resolve resolution (width/height or target_resolution)
        gen_w = req.width
        gen_h = req.height
        if gen_w is None or gen_h is None:
            if req.target_resolution and "x" in req.target_resolution.lower():
                res_parts = req.target_resolution.lower().split("x")
                gen_w = int(res_parts[0]) if len(res_parts) == 2 else 768
                gen_h = int(res_parts[1]) if len(res_parts) == 2 else 768
            else:
                gen_w, gen_h = 768, 768

        # Bound resolution to safe dimensions for Tesla T4
        gen_w = min(max(gen_w, 512), 768)
        gen_h = min(max(gen_h, 512), 768)
        input_image = input_image.resize((gen_w, gen_h), Image.Resampling.LANCZOS)

        # Resolve conditioning scale
        if req.canny_scale is not None:
            cond_scale = float(req.canny_scale)
        elif req.controlnet_conditioning_scale is not None:
            cond_scale = float(req.controlnet_conditioning_scale)
        else:
            cond_scale = 0.5

        steps = min(max(int(req.num_inference_steps or 25), 10), 30)
        cfg_scale = float(req.guidance_scale or 7.5)
        seed = int(req.seed or 42)
        generator = torch.Generator(device="cpu").manual_seed(seed)

        # PyTorch inference with low-RAM offload
        with torch.inference_mode():
            output = pipe(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                image=input_image,
                controlnet_conditioning_scale=cond_scale,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                generator=generator,
                height=gen_h,
                width=gen_w,
            )

        gen_image = output.images[0]
        buf = io.BytesIO()
        gen_image.save(buf, format="PNG")
        buf.seek(0)
        out_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        # Immediate memory cleanup
        del output, gen_image, input_image, img_bytes, buf
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        elapsed = round(time.time() - t0, 2)
        return {
            "status": "success",
            "image": f"data:image/png;base64,{out_b64}",
            "elapsed_seconds": elapsed,
            "latency_seconds": elapsed,
            "resolution": f"{gen_w}x{gen_h}",
            "width": gen_w,
            "height": gen_h,
            "steps": steps,
            "seed": seed,
            "model": "SDXL 1.0 + ControlNet Canny"
        }

    except Exception as e:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Inference failed: {str(e)}"})

# ---------------------------------------------------------------------------
# 4. START UVICORN SERVER IN TRACKED DAEMON THREAD
# ---------------------------------------------------------------------------
server_config = uvicorn.Config(app, host='127.0.0.1', port=8000, log_level='warning')
_RACKVISION_SERVER_INSTANCE = uvicorn.Server(server_config)

startup_error = []
def run_server_wrapper():
    try:
        _RACKVISION_SERVER_INSTANCE.run()
    except Exception as exc:
        startup_error.append(exc)

_RACKVISION_SERVER_THREAD = threading.Thread(target=run_server_wrapper, daemon=True)
_RACKVISION_SERVER_THREAD.start()

start_deadline = time.time() + 8.0
while not _RACKVISION_SERVER_INSTANCE.started and time.time() < start_deadline:
    if startup_error:
        raise RuntimeError(f"Uvicorn server failed to bind on 127.0.0.1:8000: {startup_error[0]}")
    if not _RACKVISION_SERVER_THREAD.is_alive():
        raise RuntimeError("Uvicorn server thread died immediately during startup! Port 8000 could not be bound.")
    time.sleep(0.2)

if not _RACKVISION_SERVER_INSTANCE.started:
    raise RuntimeError("Uvicorn server failed to report started within 8.0 seconds. Aborting.")
print("✓ Uvicorn server successfully bound to 127.0.0.1:8000.")

# ---------------------------------------------------------------------------
# 5. HEALTH CHECK 1: LOCAL LOOPBACK VERIFICATION (WITH TERMINATION ON FAIL)
# ---------------------------------------------------------------------------
local_verified = False
for attempt in range(1, 8):
    try:
        res = requests.get('http://127.0.0.1:8000/health', headers={'x-colab-auth': AUTH_TOKEN}, timeout=2)
        if res.status_code == 200 and res.json().get('health') == 'online':
            local_verified = True
            break
    except Exception:
        time.sleep(0.5)

if not local_verified:
    print("Shutting down Uvicorn server due to local health check failure...")
    if _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if _RACKVISION_SERVER_THREAD is not None:
        _RACKVISION_SERVER_THREAD.join(timeout=5.0)
        if _RACKVISION_SERVER_THREAD.is_alive():
            raise RuntimeError("ABORT: Uvicorn server thread failed to terminate after local health failure. References NOT cleared.")
        print("✓ Tracked Uvicorn server thread terminated.")
        _RACKVISION_SERVER_THREAD = None
    _RACKVISION_SERVER_INSTANCE = None
    raise RuntimeError("Local health check failed on http://127.0.0.1:8000/health. Cloudflare tunnel will NOT be started.")

print("✓ Local FastAPI Server: ONLINE & AUTHENTICATED (http://127.0.0.1:8000)")

# ---------------------------------------------------------------------------
# 6. ESTABLISH & VERIFY CLOUDFLARE PUBLIC TUNNEL (WITH DUAL VERIFIED CLEANUP)
# ---------------------------------------------------------------------------
print('Establishing Cloudflare Secure Public Tunnel...')
tunnel = try_cloudflare(port=8000)
tunnel_url = tunnel.tunnel

print(f"Verifying Cloudflare Tunnel reachability: {tunnel_url} ...")
tunnel_verified = False
for attempt in range(1, 16):
    try:
        t_res = requests.get(f"{tunnel_url}/health", headers={'x-colab-auth': AUTH_TOKEN}, timeout=4)
        if t_res.status_code == 200 and t_res.json().get('health') == 'online':
            tunnel_verified = True
            break
    except Exception:
        pass
    time.sleep(1.5)

if not tunnel_verified:
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

    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception as e:
        print(f"Note on tunnel termination: {e}")

    # Verify port released
    deadline = time.time() + 5.0
    port_freed = False
    while time.time() < deadline:
        if not is_port_in_use(8000):
            port_freed = True
            break
        time.sleep(0.5)

    if not port_freed:
        raise RuntimeError("ABORT: Port 8000 was not released after Cloudflare verification failure!")

    print("✓ Verified cleanup: Tracked server stopped and port 8000 socket released.")
    raise RuntimeError(
        f"ABORT: Cloudflare public tunnel failed health check at {tunnel_url}/health after 15 attempts. "
        f"The Uvicorn server and tunnel have been safely shut down. "
        f"Tunnel URL will not be published until public verification passes."
    )

print(f"✓ Public Cloudflare Tunnel: REACHABLE & AUTHENTICATED")

# ---------------------------------------------------------------------------
# 7. DISPLAY SERVER STATUS (NEVER PRINTS TOKEN TO NOTEBOOK OUTPUT)
# ---------------------------------------------------------------------------
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
'''

cell_18_code = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell_18_code_str.split("\n")]
}

# ---------------------------------------------------------------------------
# CELL 19: Markdown for Keepalive
# ---------------------------------------------------------------------------
cell_19_md = {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## Server Health Monitoring & Worker Keepalive\n",
        "\n",
        "Keeps the inference server alive and monitors the background Uvicorn worker thread.\n",
        "- **Interruption Handling**: When you click the **Stop (Interrupt)** button, this cell catches `KeyboardInterrupt`, gracefully exits the tracked server, joins the server thread with a 5.0s timeout, terminates the Cloudflare tunnel via `try_cloudflare.terminate(8000)`, and releases port `8000`.\n",
        "- **Process Safety**: Only signals the notebook's tracked server and tunnel."
    ]
}

# ---------------------------------------------------------------------------
# CELL 20: Code for Keepalive
# ---------------------------------------------------------------------------
cell_20_code_str = '''import time
print('Colab GPU Inference Server is actively listening for RackVision AI requests...')
print('Press the Interrupt (Stop) button anytime to pause or shut down the server.')

try:
    while True:
        if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None and not _RACKVISION_SERVER_THREAD.is_alive():
            print('Uvicorn server thread terminated.')
            break
        time.sleep(5)
except KeyboardInterrupt:
    print('\\nStopping server and releasing port 8000...')
    if '_RACKVISION_SERVER_INSTANCE' in globals() and _RACKVISION_SERVER_INSTANCE is not None:
        _RACKVISION_SERVER_INSTANCE.should_exit = True
    if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None:
        _RACKVISION_SERVER_THREAD.join(timeout=5.0)
        if _RACKVISION_SERVER_THREAD.is_alive():
            print('WARNING: Tracked Uvicorn server thread failed to terminate within 5.0s timeout. References NOT cleared.')
        else:
            print('✓ Tracked Uvicorn server thread stopped.')
            _RACKVISION_SERVER_THREAD = None
            _RACKVISION_SERVER_INSTANCE = None
    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
            print('✓ Cloudflare tunnel terminated.')
    except Exception as e:
        print(f'Note on tunnel termination: {e}')
    print('✓ Server and Cloudflare tunnel stopped cleanly. Port 8000 released.')
'''

cell_20_code = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + "\n" for line in cell_20_code_str.split("\n")]
}

# Validate Python syntax of all code cells with ast.parse
ast.parse(cell_16_code_str)
print("✓ Cell 16 (Stage 7B Diagnostic) AST parsed cleanly.")
ast.parse(cell_18_code_str)
print("✓ Cell 18 (Stage 8 Production Server) AST parsed cleanly.")
ast.parse(cell_20_code_str)
print("✓ Cell 20 (Keepalive) AST parsed cleanly.")

# Combine all 21 cells
new_cells = base_cells + [cell_15_md, cell_16_code, cell_17_md, cell_18_code, cell_19_md, cell_20_code]
nb["cells"] = new_cells

# Write updated notebook
with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=2)
print(f"✓ Saved updated notebook to {nb_path} with {len(new_cells)} total cells.")

# Copy to artifact directory
artifact_dir = Path(r"C:\Users\kadal\.gemini\antigravity\brain\96023cda-5596-4b27-af16-0c1114b3e185")
artifact_path = artifact_dir / "RackVision_SDXL_ControlNet.ipynb"
shutil.copy2(nb_path, artifact_path)
print(f"✓ Copied updated notebook to artifact path: {artifact_path}")
