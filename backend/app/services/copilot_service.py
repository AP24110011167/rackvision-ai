"""
CopilotService — NLP-driven layout command processor with undo/redo.

Parses natural-language commands using simple keyword matching (no external LLM)
and applies structured operations to the project layout via LayoutService.
"""

import re
import copy
import logging
from collections import deque
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("rackvision.copilot")

# ---------------------------------------------------------------------------
# In-memory undo/redo stacks  {project_id: {"undo": deque, "redo": deque}}
# Each entry in the deque is a deep-copy of the full layout dict (snapshot).
# Maximum 10 snapshots per stack per project.
# ---------------------------------------------------------------------------
_MAX_SNAPSHOTS = 10
_history: Dict[str, Dict[str, deque]] = {}


def _get_stacks(project_id: str) -> Tuple[deque, deque]:
    if project_id not in _history:
        _history[project_id] = {
            "undo": deque(maxlen=_MAX_SNAPSHOTS),
            "redo": deque(maxlen=_MAX_SNAPSHOTS),
        }
    return _history[project_id]["undo"], _history[project_id]["redo"]


def _push_undo(project_id: str, snapshot: Dict[str, Any]) -> None:
    undo_stack, redo_stack = _get_stacks(project_id)
    undo_stack.append(copy.deepcopy(snapshot))
    redo_stack.clear()   # new command invalidates redo history


# ---------------------------------------------------------------------------
# Default layout used when none exists yet
# ---------------------------------------------------------------------------
_DEFAULT_LAYOUT: Dict[str, Any] = {
    "room": {"width_m": 16.0, "length_m": 22.0, "height_m": 3.6},
    "components": [],
    "equipment_summary": {},
    "style": "modern_enterprise",
    "rack_spacing_m": 1.5,
}


# ---------------------------------------------------------------------------
# NLP parser  → (operation, params, human_description)
# ---------------------------------------------------------------------------
_NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}


def _extract_number(text: str, default: Optional[float] = None) -> Optional[float]:
    """Return the first numeric value found in *text* (int or float)."""
    # Try digit literal first
    m = re.search(r"\b(\d+(?:\.\d+)?)\b", text)
    if m:
        return float(m.group(1))
    # Try word numbers
    for word, val in _NUMBER_WORDS.items():
        if re.search(r"\b" + word + r"\b", text, re.IGNORECASE):
            return float(val)
    return default


def _extract_id(text: str) -> Optional[str]:
    """Extract an identifier like rack-01, crac-02, pdu-01 from *text*."""
    m = re.search(r"\b([a-zA-Z]+-\d+)\b", text)
    return m.group(1) if m else None


def parse_command(text: str) -> Tuple[str, Dict[str, Any], str]:
    """
    Map a natural-language *text* to (operation, params, description).

    Returns ("unknown", {}, description) when no pattern matches.
    """
    t = text.lower().strip()

    # --- add N racks --------------------------------------------------------
    if re.search(r"\badd\b.*\bracks?\b", t) or re.search(r"\bracks?\b.*\badd\b", t):
        count = int(_extract_number(t, default=1))
        return "add_racks", {"count": count}, f"Add {count} rack(s)"

    # --- remove rack <id> ---------------------------------------------------
    if re.search(r"\bremove\b.*\bracks?\b", t) or re.search(r"\bdelete\b.*\bracks?\b", t):
        rack_id = _extract_id(t) or "rack-01"
        return "remove_rack", {"id": rack_id}, f"Remove rack {rack_id}"

    # --- set room width -----------------------------------------------------
    if re.search(r"\b(set|change|update)\b.*\b(width|wide)\b", t):
        val = _extract_number(t, default=16.0)
        return "set_room_width", {"meters": val}, f"Set room width to {val} m"

    # --- set room length / depth -------------------------------------------
    if re.search(r"\b(set|change|update)\b.*\b(length|depth|long)\b", t):
        val = _extract_number(t, default=22.0)
        return "set_room_length", {"meters": val}, f"Set room length to {val} m"

    # --- add N UPS ----------------------------------------------------------
    if re.search(r"\badd\b.*\bups\b", t) or re.search(r"\bups\b.*\badd\b", t):
        count = int(_extract_number(t, default=1))
        return "add_ups", {"count": count}, f"Add {count} UPS unit(s)"

    # --- add N cooling units -----------------------------------------------
    if re.search(r"\badd\b.*\b(cooling|crac|crah|ac)\b", t):
        count = int(_extract_number(t, default=1))
        return "add_cooling", {"count": count}, f"Add {count} cooling unit(s)"

    # --- change style -------------------------------------------------------
    if re.search(r"\b(change|set|switch)\b.*\b(style|layout|theme)\b", t):
        # Extract the style name: last word(s) after "to"
        m = re.search(r"\bto\b\s+([a-z_\- ]+)$", t)
        style = m.group(1).strip().replace(" ", "_") if m else "modern_enterprise"
        return "change_style", {"style": style}, f"Change style to {style}"

    # --- increase / set rack spacing ----------------------------------------
    if re.search(r"\b(increase|wider|more space)\b.*\b(rack\s*spacing|spacing)\b", t) or \
       re.search(r"\b(rack\s*spacing|spacing)\b.*\b(increase|wider|more space)\b", t):
        return "set_rack_spacing", {"meters": 1.8}, "Increase rack spacing to 1.8 m"

    if re.search(r"\b(set|change|update)\b.*\b(rack\s*spacing|spacing)\b", t):
        val = _extract_number(t, default=1.5)
        return "set_rack_spacing", {"meters": val}, f"Set rack spacing to {val} m"

    # --- move component -----------------------------------------------------
    if re.search(r"\bmove\b", t):
        comp_id = _extract_id(t) or "rack-01"
        # Try to find x,y,z coordinates in the text
        nums = re.findall(r"-?\d+(?:\.\d+)?", t)
        pos = {"x": float(nums[0]) if len(nums) > 0 else 0.0,
               "y": float(nums[1]) if len(nums) > 1 else 1.1,
               "z": float(nums[2]) if len(nums) > 2 else 0.0}
        return "move_component", {"id": comp_id, "position": pos}, \
               f"Move {comp_id} to ({pos['x']}, {pos['y']}, {pos['z']})"

    # --- add cable tray -----------------------------------------------------
    if re.search(r"\badd\b.*\b(cable\s*tray|tray)\b", t):
        return "add_cable_tray", {}, "Add cable tray"

    return "unknown", {}, f"Command not recognised: \"{text}\""


# ---------------------------------------------------------------------------
# Operations  — each returns (modified_layout, list[str] of change_description)
# ---------------------------------------------------------------------------

def _next_rack_id(layout: Dict[str, Any]) -> str:
    """Generate the next sequential rack id."""
    existing = {c["id"] for c in layout.get("components", []) if c.get("id", "").startswith("rack-")}
    for i in range(1, 1000):
        candidate = f"rack-{i:02d}"
        if candidate not in existing:
            return candidate
    return f"rack-{len(existing)+1:02d}"


def _apply_add_racks(layout: Dict[str, Any], count: int) -> Tuple[Dict[str, Any], List[str]]:
    changes: List[str] = []
    for _ in range(count):
        rid = _next_rack_id(layout)
        idx = len([c for c in layout["components"] if "rack" in c.get("id", "")])
        rack = {
            "id": rid,
            "type": "server_rack",
            "category": "server_infrastructure",
            "label": f"Rack {rid.upper()}",
            "x": float(idx) * 1.5,
            "y": 1.1,
            "z": 0.0,
            "width_m": 0.8,
            "height_m": 2.2,
            "depth_m": 1.0,
            "power_kw": 10.0,
            "status": "Online",
            "servers_count": 18,
        }
        layout["components"].append(rack)
        changes.append(f"Added rack {rid}")
    return layout, changes


def _apply_remove_rack(layout: Dict[str, Any], rack_id: str) -> Tuple[Dict[str, Any], List[str]]:
    before = len(layout["components"])
    layout["components"] = [c for c in layout["components"] if c.get("id") != rack_id]
    removed = before - len(layout["components"])
    changes = [f"Removed rack {rack_id}"] if removed else [f"Rack {rack_id} not found — no change"]
    return layout, changes


def _apply_set_room_width(layout: Dict[str, Any], meters: float) -> Tuple[Dict[str, Any], List[str]]:
    old = layout["room"].get("width_m", 16.0)
    layout["room"]["width_m"] = meters
    return layout, [f"Room width changed from {old} m to {meters} m"]


def _apply_set_room_length(layout: Dict[str, Any], meters: float) -> Tuple[Dict[str, Any], List[str]]:
    old = layout["room"].get("length_m", 22.0)
    layout["room"]["length_m"] = meters
    return layout, [f"Room length changed from {old} m to {meters} m"]


def _apply_add_ups(layout: Dict[str, Any], count: int) -> Tuple[Dict[str, Any], List[str]]:
    changes: List[str] = []
    existing_ups = [c for c in layout["components"] if c.get("type") == "ups_unit"]
    for i in range(count):
        uid = f"ups-{len(existing_ups) + i + 1:02d}"
        layout["components"].append({
            "id": uid,
            "type": "ups_unit",
            "category": "electrical_infrastructure",
            "label": f"UPS {uid.upper()}",
            "x": -8.0 + i * 2.0,
            "y": 1.0,
            "z": 10.0,
            "width_m": 0.8,
            "height_m": 1.8,
            "depth_m": 0.6,
            "capacity_kva": 100,
        })
        changes.append(f"Added UPS unit {uid}")
    return layout, changes


def _apply_add_cooling(layout: Dict[str, Any], count: int) -> Tuple[Dict[str, Any], List[str]]:
    changes: List[str] = []
    existing = [c for c in layout["components"] if c.get("type") == "cooling_unit"]
    for i in range(count):
        cid = f"crac-{len(existing) + i + 1:02d}"
        layout["components"].append({
            "id": cid,
            "type": "cooling_unit",
            "category": "cooling_infrastructure",
            "label": f"CRAC {cid.upper()}",
            "x": -6.0 + i * 4.0,
            "y": 1.25,
            "z": -9.0,
            "width_m": 1.8,
            "height_m": 2.5,
            "depth_m": 1.0,
            "capacity_kw": 95,
        })
        changes.append(f"Added cooling unit {cid}")
    return layout, changes


def _apply_change_style(layout: Dict[str, Any], style: str) -> Tuple[Dict[str, Any], List[str]]:
    old = layout.get("style", "modern_enterprise")
    layout["style"] = style
    return layout, [f"Layout style changed from '{old}' to '{style}'"]


def _apply_set_rack_spacing(layout: Dict[str, Any], meters: float) -> Tuple[Dict[str, Any], List[str]]:
    old = layout.get("rack_spacing_m", 1.5)
    layout["rack_spacing_m"] = meters
    # Reposition racks along x-axis using new spacing
    racks = [c for c in layout["components"] if c.get("type") == "server_rack"]
    for idx, rack in enumerate(racks):
        rack["x"] = float(idx) * meters
    return layout, [f"Rack spacing changed from {old} m to {meters} m; {len(racks)} rack(s) repositioned"]


def _apply_move_component(layout: Dict[str, Any], comp_id: str, position: Dict) -> Tuple[Dict[str, Any], List[str]]:
    for c in layout["components"]:
        if c.get("id") == comp_id:
            c["x"] = position.get("x", c.get("x", 0.0))
            c["y"] = position.get("y", c.get("y", 1.1))
            c["z"] = position.get("z", c.get("z", 0.0))
            return layout, [f"Moved {comp_id} to ({c['x']}, {c['y']}, {c['z']})"]
    return layout, [f"Component {comp_id} not found — no change"]


def _apply_add_cable_tray(layout: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    existing = [c for c in layout["components"] if c.get("type") == "cable_tray"]
    tid = f"tray-{len(existing) + 1:02d}"
    layout["components"].append({
        "id": tid,
        "type": "cable_tray",
        "label": f"Cable Tray {tid.upper()}",
        "x": 0.0,
        "y": 2.8,
        "z": 0.0,
        "length": 15.0,
        "width_m": 0.6,
        "orientation": "along_row",
    })
    return layout, [f"Added cable tray {tid}"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class CopilotService:
    """
    Processes natural-language layout commands with undo/redo support.

    All state (undo/redo stacks) is kept in-process memory and is reset on
    server restart — this is intentional for a demo/educational application.
    """

    @staticmethod
    def _load_layout(project_id: str) -> Dict[str, Any]:
        """Return the current layout for *project_id*, creating a default if none exists."""
        from app.services.layout_service import LayoutService
        layout = LayoutService.get_layout(project_id)
        if layout is None:
            layout = copy.deepcopy(_DEFAULT_LAYOUT)
        return layout

    @staticmethod
    def process_command(project_id: str, text: str) -> Dict[str, Any]:
        """
        Parse *text* into a structured operation, apply it to the layout,
        persist the result, and return a rich result dict.
        """
        from app.services.layout_service import LayoutService

        # Load current layout and save a snapshot for undo BEFORE modifying
        current_layout = CopilotService._load_layout(project_id)
        _push_undo(project_id, current_layout)

        operation, params, description = parse_command(text)
        layout = copy.deepcopy(current_layout)
        changes: List[str] = []
        layout_updated = False

        if operation == "add_racks":
            layout, changes = _apply_add_racks(layout, params["count"])
            layout_updated = True
        elif operation == "remove_rack":
            layout, changes = _apply_remove_rack(layout, params["id"])
            layout_updated = True
        elif operation == "set_room_width":
            layout, changes = _apply_set_room_width(layout, params["meters"])
            layout_updated = True
        elif operation == "set_room_length":
            layout, changes = _apply_set_room_length(layout, params["meters"])
            layout_updated = True
        elif operation == "add_ups":
            layout, changes = _apply_add_ups(layout, params["count"])
            layout_updated = True
        elif operation == "add_cooling":
            layout, changes = _apply_add_cooling(layout, params["count"])
            layout_updated = True
        elif operation == "change_style":
            layout, changes = _apply_change_style(layout, params["style"])
            layout_updated = True
        elif operation == "set_rack_spacing":
            layout, changes = _apply_set_rack_spacing(layout, params["meters"])
            layout_updated = True
        elif operation == "move_component":
            layout, changes = _apply_move_component(layout, params["id"], params["position"])
            layout_updated = True
        elif operation == "add_cable_tray":
            layout, changes = _apply_add_cable_tray(layout)
            layout_updated = True
        else:
            changes = ["Command not recognised — no changes applied"]
            # Roll back the undo snapshot we pushed (nothing changed)
            undo_stack, _ = _get_stacks(project_id)
            if undo_stack:
                undo_stack.pop()

        # Persist and sync 3D/BOM only when something actually changed
        if layout_updated:
            LayoutService.save_layout(project_id, layout)
            confirmation_text = f"Done: {description}. {'; '.join(changes)}."
        else:
            confirmation_text = changes[0] if changes else "Nothing to do."

        undo_stack, redo_stack = _get_stacks(project_id)
        return {
            "command_text": text,
            "operation": operation,
            "params": params,
            "changes_made": changes,
            "confirmation_text": confirmation_text,
            "layout_updated": layout_updated,
            "undo_available": len(undo_stack) > 0,
            "redo_available": len(redo_stack) > 0,
        }

    @staticmethod
    def undo(project_id: str) -> Dict[str, Any]:
        """Restore the previous layout snapshot for *project_id*."""
        from app.services.layout_service import LayoutService

        undo_stack, redo_stack = _get_stacks(project_id)
        if not undo_stack:
            return {"status": "no_undo", "message": "Nothing to undo.", "layout": None,
                    "undo_available": False, "redo_available": len(redo_stack) > 0}

        # Save current state to redo before restoring
        current = CopilotService._load_layout(project_id)
        redo_stack.append(copy.deepcopy(current))

        previous = undo_stack.pop()
        LayoutService.save_layout(project_id, previous)
        logger.info("Undo applied for project %s", project_id)
        return {
            "status": "undo_applied",
            "message": "Previous state restored.",
            "layout": previous,
            "undo_available": len(undo_stack) > 0,
            "redo_available": len(redo_stack) > 0,
        }

    @staticmethod
    def redo(project_id: str) -> Dict[str, Any]:
        """Restore the next layout snapshot (after an undo) for *project_id*."""
        from app.services.layout_service import LayoutService

        undo_stack, redo_stack = _get_stacks(project_id)
        if not redo_stack:
            return {"status": "no_redo", "message": "Nothing to redo.", "layout": None,
                    "undo_available": len(undo_stack) > 0, "redo_available": False}

        # Save current state to undo before restoring
        current = CopilotService._load_layout(project_id)
        undo_stack.append(copy.deepcopy(current))

        next_state = redo_stack.pop()
        LayoutService.save_layout(project_id, next_state)
        logger.info("Redo applied for project %s", project_id)
        return {
            "status": "redo_applied",
            "message": "Next state restored.",
            "layout": next_state,
            "undo_available": len(undo_stack) > 0,
            "redo_available": len(redo_stack) > 0,
        }
