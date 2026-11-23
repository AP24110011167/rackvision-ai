import time
import socket
import secrets
import requests
import threading
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import pycloudflared
from pycloudflared import try_cloudflare
from pycloudflared.try_cloudflare import Urls

print("=" * 75)
print("STAGE 7B: SAFE SERVER & PUBLIC TUNNEL DIAGNOSTIC TEST (ZERO INFERENCE)")
print("=" * 75)

# 0. Runtime Verification of pycloudflared API (detects actual version or reports unknown)
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

def _diag_is_port_in_use(port: int = 8000) -> bool:
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
                if js.get("status") == "healthy":
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
                if js.get("status") == "healthy":
                    return "SUCCESS", "HTTP 200 OK (status='healthy')", body_snip
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

# 1. Refuse to run if an active production server is already running
if '_RACKVISION_SERVER_THREAD' in globals() and _RACKVISION_SERVER_THREAD is not None:
    if _RACKVISION_SERVER_THREAD.is_alive():
        raise RuntimeError(
            f"REFUSING TO RUN STAGE 7B: An active RackVision production server is currently running "
            f"(thread ident={_RACKVISION_SERVER_THREAD.ident})!\n"
            "Stage 7B is an initial diagnostic probe. To run Stage 7B, first stop the active production "
            "server by interrupting Cell 20, or proceed directly to Stage 8."
        )

# 2. Check if port 8000 is in use by an external service
if _diag_is_port_in_use(8000):
    raise RuntimeError(
        "REFUSING TO RUN STAGE 7B: Port 8000 is currently occupied by an external service.\n"
        "Stage 7B will not terminate external processes. Please free port 8000 before running."
    )

print("✓ Port 8000 is free and available.")

# 3. Build lightweight diagnostic FastAPI application (Zero GPU inference)
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
        'controlnet': 'diffusers/controlnet-canny-sdxl-1.0',
        "test_mode": True
    }

# 4. Start diagnostic Uvicorn server in background thread
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

# 5. Local Health Check
diag_local_ok = False
for attempt in range(1, 6):
    try:
        res = requests.get("http://127.0.0.1:8000/health", headers={"x-colab-auth": DIAG_PROBE_TOKEN}, timeout=2)
        if res.status_code == 200 and res.json().get("status") == "healthy":
            diag_local_ok = True
            break
    except Exception:
        pass
    time.sleep(0.5)

if not diag_local_ok:
    diag_server.should_exit = True
    diag_thread.join(timeout=5.0)
    deadline = time.time() + 5.0
    while time.time() < deadline:
        if not _diag_is_port_in_use(8000):
            break
        time.sleep(0.5)
    raise RuntimeError("Diagnostic local health check failed on 127.0.0.1:8000.")
print("✓ Local Diagnostic Health Check: PASSED (HTTP 200 OK)")

# 6. Cloudflare Tunnel Creation & Process Tracking via Verified pycloudflared API
print("Establishing temporary diagnostic Cloudflare tunnel...")
diag_tunnel = try_cloudflare(port=8000)
diag_tunnel_url = getattr(diag_tunnel, 'tunnel', None) or getattr(diag_tunnel, 'url', None) or str(diag_tunnel)

# Extract and validate exact process handle via verified API
diag_tunnel_proc = _extract_tunnel_process(diag_tunnel, port=8000)

# Fail-safe abort if process handle is unidentifiable or does not support required methods:
# Do not report cleanup as complete merely because Uvicorn thread stopped!
# Verify tunnel termination and port release independently. Report incomplete and retain available references.
if not _is_valid_process_handle(diag_tunnel_proc):
    print("WARNING: Could not identify or validate process handle supporting required methods (terminate, wait, kill, poll, pid).")
    print("Attempting safe diagnostic teardown and independent verification...")

    # Step A: Signal diagnostic server to exit and join thread
    server_stopped = False
    diag_server.should_exit = True
    diag_thread.join(timeout=5.0)
    server_stopped = not diag_thread.is_alive()

    # Step B: Attempt tunnel termination via try_cloudflare.terminate(8000)
    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception as e:
        print(f"Note on try_cloudflare.terminate: {e}")

    # Independently verify tunnel termination:
    # Since diag_tunnel_proc was untracked/unvalidated, process exit CANNOT be confirmed!
    tunnel_confirmed = False

    # Step C: Independently verify socket port 8000 release
    port_freed = False
    deadline = time.time() + 5.0
    while time.time() < deadline:
        if not _diag_is_port_in_use(8000):
            port_freed = True
            break
        time.sleep(0.5)

    # Step D: Report cleanup as incomplete and retain available references
    print(f"Teardown verification incomplete: server_stopped={server_stopped}, tunnel_confirmed={tunnel_confirmed}, port_freed={port_freed}.")
    print("Retaining available references (diag_tunnel, diag_server, diag_thread) for diagnosis.")

    global _RACKVISION_DIAG_UNTRACKED_TUNNEL, _RACKVISION_DIAG_SERVER, _RACKVISION_DIAG_THREAD
    _RACKVISION_DIAG_UNTRACKED_TUNNEL = diag_tunnel
    _RACKVISION_DIAG_SERVER = diag_server
    _RACKVISION_DIAG_THREAD = diag_thread

    raise RuntimeError(
        f"ABORT: Cleanup is INCOMPLETE! Cloudflare tunnel was created but a valid process handle supporting "
        f"required methods (terminate, wait, kill, poll, pid) could not be identified from pycloudflared "
        f"(attributes on tunnel: {dir(diag_tunnel)}).\n"
        f"Verification results: server_stopped={server_stopped}, tunnel_confirmed={tunnel_confirmed}, port_freed={port_freed}.\n"
        "Tunnel termination could not be confirmed. Cleanup is incomplete and available references have been retained."
    )

print(f"✓ Exact Cloudflare tunnel process identified and validated: pid={diag_tunnel_proc.pid}")
print(f"Tunnel URL provisioned: {diag_tunnel_url}")
print("Allowing initial Cloudflare edge DNS/tunnel propagation window (5.0s)...")
time.sleep(5.0)

print(f"Beginning public tunnel diagnostic health check at {diag_tunnel_url}/health ...")

diag_public_ok = False
diag_attempts_log = []
max_attempts = 25
retry_delay = 2.0
t_start = time.time()

for attempt in range(1, max_attempts + 1):
    elapsed = time.time() - t_start

    # 1. Test local /health immediately before public probe
    local_pre_ok, local_pre_msg = _probe_local_health(DIAG_PROBE_TOKEN, port=8000)
    local_pre_tag = "OK" if local_pre_ok else f"FAIL({local_pre_msg})"

    # 2. Public health check probe
    res = None
    captured_exc = None
    try:
        res = requests.get(
            f"{diag_tunnel_url}/health",
            headers={"x-colab-auth": DIAG_PROBE_TOKEN},
            timeout=4.0
        )
    except Exception as exc:
        captured_exc = exc

    # 3. Test local /health immediately after public probe
    local_post_ok, local_post_msg = _probe_local_health(DIAG_PROBE_TOKEN, port=8000)
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
    diag_attempts_log.append(log_entry)

    snip_display = f" | Body: '{snippet}'" if snippet else ""
    print(f"  [Attempt {attempt:2d}/{max_attempts}] (+{elapsed:4.1f}s) | Local Pre: {local_pre_tag} | Public: [{category}] {desc}{snip_display} | Local Post: {local_post_tag}")

    if category == "SUCCESS":
        diag_public_ok = True
        break

    time.sleep(retry_delay)

if not diag_public_ok:
    total_time = round(time.time() - t_start, 1)
    print("\n" + "=" * 75)
    print("❌ DIAGNOSTIC PUBLIC HEALTH CHECK FAILED: TELEMETRY ANALYSIS")
    print("=" * 75)
    print(f"Total Probing Duration: {total_time}s across {len(diag_attempts_log)} attempts.")
    cat_counts = {}
    for entry in diag_attempts_log:
        cat_counts[entry['category']] = cat_counts.get(entry['category'], 0) + 1
    print(f"Category Breakdown: {cat_counts}")
    if diag_attempts_log:
        print(f"Last Attempt Result: [{diag_attempts_log[-1]['category']}] {diag_attempts_log[-1]['description']}")
        print(f"Local Pre-Check on Last Attempt: {diag_attempts_log[-1]['local_pre']}")
        print(f"Local Post-Check on Last Attempt: {diag_attempts_log[-1]['local_post']}")
    print("=" * 75)

    print("Cleaning up diagnostic server and tunnel...")
    diag_server.should_exit = True
    diag_thread.join(timeout=5.0)
    if diag_thread.is_alive():
        raise RuntimeError("ABORT: Diagnostic server thread failed to terminate after public tunnel failure. References NOT cleared.")
    diag_server = None
    diag_thread = None

    if diag_tunnel_proc is not None:
        try:
            diag_tunnel_proc.terminate()
            try:
                if hasattr(diag_tunnel_proc, 'wait'):
                    diag_tunnel_proc.wait(timeout=3.0)
            except Exception:
                if hasattr(diag_tunnel_proc, 'kill'):
                    diag_tunnel_proc.kill()
                    diag_tunnel_proc.wait(timeout=2.0)
        except Exception:
            pass

        # Requirement: Exception during is_running() is UNKNOWN/UNVERIFIED, not dead!
        is_dead = False
        if hasattr(diag_tunnel_proc, 'poll'):
            is_dead = diag_tunnel_proc.poll() is not None
        if not is_dead and hasattr(diag_tunnel_proc, 'is_running'):
            try:
                is_dead = not diag_tunnel_proc.is_running()
            except Exception:
                is_dead = False

        if not is_dead:
            raise RuntimeError(f"ABORT: Diagnostic tunnel process (pid={diag_tunnel_proc.pid}) failed to terminate! References NOT cleared.")
        diag_tunnel_proc = None

    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception:
        pass

    deadline = time.time() + 5.0
    port_freed = False
    while time.time() < deadline:
        if not _diag_is_port_in_use(8000):
            port_freed = True
            break
        time.sleep(0.5)

    if not port_freed:
        raise RuntimeError("ABORT: Port 8000 was not released after diagnostic public tunnel failure!")

    raise RuntimeError(
        f"Diagnostic Cloudflare tunnel failed at {diag_tunnel_url}/health after {total_time}s "
        f"({cat_counts}). Safe cleanup completed successfully (server stopped, tunnel terminated, port 8000 freed)."
    )

print("✓ Public Cloudflare Diagnostic Health Check: PASSED (HTTP 200 OK)")

# 7. Safe Shutdown and Independent Triple-Verification (server_stopped, tunnel_stopped, port_freed)
print("Testing diagnostic shutdown and independent resource release...")

# Step A: Stop Uvicorn server and join thread
diag_server.should_exit = True
diag_thread.join(timeout=5.0)
if diag_thread.is_alive():
    raise RuntimeError(f"ABORT: Diagnostic server thread (ident={diag_thread.ident}) failed to terminate within 5.0s. References NOT cleared!")
server_stopped = True
diag_server = None
diag_thread = None

# Step B: Terminate and independently verify tracked Cloudflare tunnel process
tunnel_stopped = False
if diag_tunnel_proc is not None:
    try:
        print(f"  Terminating tracked diagnostic tunnel process (pid={diag_tunnel_proc.pid})...")
        diag_tunnel_proc.terminate()
        try:
            if hasattr(diag_tunnel_proc, 'wait'):
                diag_tunnel_proc.wait(timeout=3.0)
        except Exception:
            if hasattr(diag_tunnel_proc, 'kill'):
                diag_tunnel_proc.kill()
                diag_tunnel_proc.wait(timeout=2.0)
    except Exception as e:
        print(f"  Note on diagnostic tunnel process: {e}")

    try:
        if hasattr(try_cloudflare, 'terminate'):
            try_cloudflare.terminate(8000)
    except Exception:
        pass

    # Requirement: Verify process has exited independently. Exception means UNKNOWN/UNVERIFIED!
    proc_exited = False
    if hasattr(diag_tunnel_proc, 'poll'):
        proc_exited = diag_tunnel_proc.poll() is not None
    if not proc_exited and hasattr(diag_tunnel_proc, 'is_running'):
        try:
            proc_exited = not diag_tunnel_proc.is_running()
        except Exception:
            proc_exited = False

    if not proc_exited:
        raise RuntimeError(f"ABORT: Diagnostic tunnel process (pid={diag_tunnel_proc.pid}) failed to terminate! References NOT cleared.")

    tunnel_stopped = True
    diag_tunnel_proc = None
else:
    # An unknown process state must be treated as unverified, NOT successful cleanup!
    tunnel_stopped = False

# Step C: Verify socket port 8000 is released
release_deadline = time.time() + 5.0
port_freed = False
while time.time() < release_deadline:
    if not _diag_is_port_in_use(8000):
        port_freed = True
        break
    time.sleep(0.5)

if not port_freed:
    raise RuntimeError("ABORT: Port 8000 was not released after diagnostic server shutdown!")

# Step D: Require all three independent confirmations
if not (server_stopped and tunnel_stopped and port_freed):
    raise RuntimeError(
        f"ABORT: Diagnostic teardown verification incomplete! All three must pass: "
        f"server_stopped={server_stopped}, tunnel_stopped={tunnel_stopped}, port_freed={port_freed}."
    )

print("=" * 75)
print("✓ STAGE 7B COMPLETE: SERVER BINDING, LOCAL HEALTH, PUBLIC TUNNEL & CLEAN TEARDOWN VERIFIED")
print("=" * 75)
