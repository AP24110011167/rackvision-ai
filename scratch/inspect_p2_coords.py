import json

with open("outputs/verified_p2_layout.json", "r") as f:
    layout = json.load(f)

print("Room:", layout["room"])
print("Technical Area:", layout.get("technical_area"))
print("Aisles:", layout.get("aisles"))
print("\nComponents:")
for c in layout["components"]:
    cat = c.get("category")
    cid = c.get("id")
    x, y, z = c.get("x"), c.get("y"), c.get("z")
    w, d, h = c.get("width_m"), c.get("depth_m"), c.get("height_m")
    row = c.get("row", "")
    print(f"[{cat}] {cid} ({row}): pos=({x}, {y}, {z}), size=({w}x{d}x{h})")
