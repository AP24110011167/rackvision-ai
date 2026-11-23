import os
import time
from pathlib import Path

now = time.time()
two_days_ago = now - 2 * 86400

recent_files = []
for p in Path(".").rglob("*"):
    if p.is_file():
        parts = p.parts
        if any(x in parts for x in ["node_modules", ".git", "dist", "venv", "__pycache__", ".system_generated"]):
            continue
        try:
            mtime = p.stat().st_mtime
            if mtime > two_days_ago:
                recent_files.append((mtime, p, p.stat().st_size))
        except Exception:
            pass

recent_files.sort(key=lambda x: x[0], reverse=True)
print(f"Total recent files: {len(recent_files)}")
for mtime, p, sz in recent_files[:30]:
    tstr = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
    print(f"{tstr}  {sz:>10}  {p}")
