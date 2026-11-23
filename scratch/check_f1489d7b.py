import json
from pathlib import Path

p = Path(r"C:\Users\kadal\.gemini\antigravity\brain\72ff01ae-8d42-49a2-8382-58d0140f7ece\.system_generated\logs\transcript.jsonl")
if p.exists():
    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            if "design-master-f1489d7b" in line:
                d = json.loads(line)
                print(f"Step {d.get('step_index')}: {d.get('type')}")
                if d.get("tool_calls"):
                    print("Tool calls:", d["tool_calls"])
                if d.get("content"):
                    print("Content preview:", d["content"][:300])
