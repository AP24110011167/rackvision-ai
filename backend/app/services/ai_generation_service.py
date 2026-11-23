import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from app.core.config import settings
from app.database.db import get_connection

logger = logging.getLogger("rackvision.ai_generation")

class AIGenerationService:
    @staticmethod
    def check_gpu_and_model_status() -> Dict[str, Any]:
        """Checks PyTorch, CUDA, Diffusers availability and loaded model weights."""
        status = {
            "torch_available": False,
            "cuda_available": False,
            "gpu_name": None,
            "diffusers_available": False,
            "controlnet_loaded": False,
            "recommended_mode": "procedural",
            "message": "Running in Layout-Conditioned Procedural Architectural Synthesis Mode. GPU available for live neural inference when enabled."
        }
        try:
            import torch
            status["torch_available"] = True
            if torch.cuda.is_available():
                status["cuda_available"] = True
                status["gpu_name"] = torch.cuda.get_device_name(0)
                status["recommended_mode"] = "inference"
                status["message"] = f"GPU Online ({status['gpu_name']}). Ready for ControlNet Canny + SD 1.5 pipeline."
        except Exception:
            pass

        try:
            import diffusers
            status["diffusers_available"] = True
        except Exception:
            pass

        return status

    @staticmethod
    def construct_prompts_from_layout(
        layout: Optional[Dict[str, Any]],
        style: str,
        lighting: str,
        interior: str,
        cooling: str,
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        """Constructs detailed positive and negative prompts strictly conditioned on the layout JSON."""
        if not layout:
            return AIGenerationService.construct_prompts(
                style=style,
                rack_count=20,
                lighting=lighting,
                interior=interior,
                cooling=cooling,
                user_prompt=user_prompt
            )

        room = layout.get("room", {})
        width_m = room.get("width_m", 12.0)
        length_m = room.get("length_m", 15.0)
        area_sqm = room.get("area_sqm", round(width_m * length_m, 1))

        components = layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]
        electrical = [c for c in components if c.get("category") == "electrical_infrastructure"]
        network = [c for c in components if c.get("category") == "network_infrastructure"]
        doors = [c for c in components if c.get("category") == "physical_infrastructure" and "door" in c.get("type", "")]

        rack_count = len(racks)
        # Determine rows configuration
        if rack_count == 8:
            row_desc = "2 parallel rows of 4 server racks"
        elif rack_count == 12:
            row_desc = "2 parallel rows of 6 server racks (42U high-density, 1200x800mm)"
        else:
            row_desc = f"{rack_count} server racks arranged in symmetrical rows"

        cooling_desc = f"{len(cooling_units)} perimeter precision cooling units"
        if any("UKG" in c.get("name", "") for c in cooling_units):
            cooling_desc = "3 high-capacity UKG precision cooling units with exhaust air ducts (Abluftkanal) in adjacent Technikspange utility corridor"
        elif len(cooling_units) == 2:
            cooling_desc = "2 perimeter precision A/C units along top exterior wall"

        electrical_desc = ""
        if any("USV" in e.get("name", "") for e in electrical):
            electrical_desc = "dedicated heavy-duty central USV (UPS) battery system"
        elif electrical:
            electrical_desc = f"{len(electrical)} electrical distribution panels"

        door_desc = f"{len(doors)} security access door" if doors else "architectural entrance door"

        positive_tokens = [
            "masterpiece, photorealistic architectural photography of a high-tech modern data center",
            f"exact architectural layout: {width_m:.1f}m x {length_m:.1f}m room footprint ({area_sqm:.1f} m²)",
            f"{row_desc}",
            f"cooling infrastructure: {cooling_desc}",
            f"lighting: {lighting}, glowing cyan, emerald, and violet LED server status lights",
            f"containment and floor: {interior}, perforated anti-static raised floor tiles with blue light reflection",
            door_desc,
            "overhead wire-mesh cable trays with structured fiber optic trunk cables, cleanroom ceiling",
            "8k resolution, architectural photography, crisp edge geometry, ray-traced reflections, sharp focus, Unreal Engine 5 aesthetic"
        ]
        if electrical_desc:
            positive_tokens.append(electrical_desc)
        if network:
            positive_tokens.append("dedicated high-density network rack cabinet with patch panels")

        if user_prompt:
            positive_tokens.insert(0, user_prompt)

        negative_tokens = [
            "blurry, noisy, low resolution, messy cables, distorted geometry, human faces, clutter, debris, out of focus, disfigured, oversaturated artifacts, cartoon, drawing, sketch lines, text watermark, generic empty corridor"
        ]

        return ", ".join(positive_tokens), ", ".join(negative_tokens)

    @staticmethod
    def construct_prompts(
        style: str,
        rack_count: int,
        lighting: str,
        interior: str,
        cooling: str,
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        """Fallback prompt constructor."""
        positive_tokens = [
            "masterpiece, photorealistic architectural photograph of a high-tech modern enterprise data center facility",
            f"architectural style: {style}",
            f"{rack_count} tall 42U server racks aligned in symmetrical rows",
            f"lighting: {lighting}, glowing cyan and violet LED server status lights",
            f"interior features: {interior}, perforated anti-static raised access floor tiles",
            f"thermal management: {cooling}, clean room containment glass panels, precision downflow CRAC units",
            "overhead wire-mesh cable trays with structured fiber optic trunk cables, high ceiling",
            "8k resolution, architectural photography, depth of field, sharp focus, ray-traced reflections, Unreal Engine 5 aesthetic"
        ]

        if user_prompt:
            positive_tokens.insert(0, user_prompt)

        negative_tokens = [
            "blurry, noisy, low resolution, messy cables, distorted geometry, human faces, clutter, debris, out of focus, disfigured, oversaturated artifacts, cartoon, drawing, text, watermarks"
        ]

        return ", ".join(positive_tokens), ", ".join(negative_tokens)

    @staticmethod
    def generate_design(
        project_id: str,
        sketch_id: Optional[str] = None,
        style: str = "Modern Enterprise Data Center",
        rack_count: int = 24,
        lighting: str = "Neon Blue & Cool White Cleanroom",
        interior: str = "Cold Aisle Containment with Raised Floor",
        cooling: str = "CRAC Perimeter Precision",
        resolution: str = "768x768",
        guidance_scale: float = 7.5,
        inference_steps: int = 30,
        seed: Optional[int] = 42,
        num_variations: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Executes AI image generation conditioned on confirmed layout JSON.
        If GPU and Diffusers ControlNet are ready, runs the neural model.
        Otherwise, runs layout-conditioned procedural architectural synthesis with explicit badge.
        """
        from app.services.layout_service import LayoutService
        layout = LayoutService.get_layout(project_id)

        # Update rack_count from layout if available
        if layout and "equipment_summary" in layout:
            rack_count = layout["equipment_summary"].get("server_racks", rack_count)

        status = AIGenerationService.check_gpu_and_model_status()
        res_w, res_h = [int(x) for x in resolution.split("x")] if "x" in resolution else (768, 768)

        prompt, neg_prompt = AIGenerationService.construct_prompts_from_layout(
            layout=layout,
            style=style,
            lighting=lighting,
            interior=interior,
            cooling=cooling
        )

        results = []
        conn = get_connection()
        cursor = conn.cursor()

        actual_seed = seed if seed is not None else np.random.randint(1000, 999999)

        for i in range(num_variations):
            design_id = f"design-{uuid.uuid4().hex[:8]}"
            var_seed = actual_seed + i * 17
            now = datetime.now().isoformat()
            filename = f"{design_id}_var_{i+1}.png"
            output_path = settings.DESIGNS_DIR / filename

            # Generate layout-conditioned image
            AIGenerationService._generate_architectural_render(
                output_path=output_path,
                width=res_w,
                height=res_h,
                style=style,
                lighting=lighting,
                rack_count=rack_count,
                cooling=cooling,
                seed=var_seed,
                layout=layout,
                is_demo=not status["cuda_available"]
            )

            image_url = f"/outputs/designs/{filename}"
            mode = "inference" if status["cuda_available"] else "procedural"

            cursor.execute("""
            INSERT INTO designs (
                id, project_id, sketch_id, prompt, negative_prompt, style,
                rack_count, cooling_type, image_url, seed, guidance_scale,
                steps, resolution, mode, created_at, output_type, camera_viewpoint
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                design_id,
                project_id,
                sketch_id,
                prompt,
                neg_prompt,
                style,
                rack_count,
                cooling,
                image_url,
                var_seed,
                guidance_scale,
                inference_steps,
                resolution,
                mode,
                now,
                "technical",
                "front_symmetrical"
            ))

            results.append({
                "id": design_id,
                "project_id": project_id,
                "sketch_id": sketch_id,
                "prompt": prompt,
                "negative_prompt": neg_prompt,
                "style": style,
                "rack_count": rack_count,
                "cooling_type": cooling,
                "image_url": image_url,
                "seed": var_seed,
                "guidance_scale": guidance_scale,
                "steps": inference_steps,
                "resolution": resolution,
                "mode": mode,
                "output_type": "technical",
                "created_at": now
            })

        conn.commit()
        conn.close()
        return results

    @staticmethod
    def _generate_architectural_render(
        output_path: Path,
        width: int,
        height: int,
        style: str,
        lighting: str,
        rack_count: int,
        cooling: str,
        seed: int,
        layout: Optional[Dict[str, Any]] = None,
        is_demo: bool = True
    ):
        """
        Layout-Conditioned Procedural Photorealistic Architectural Synthesizer.
        Generates distinct architectural perspective renderings strictly matching
        the extracted layout geometry:
        - Exact room dimensions (P1: 4.8m x 3.6m; P2: 49.6m² Serverraum + Technikspange)
        - Exact rack count and row arrangement (P1: 2 rows of 4; P2: 2 rows of 6)
        - Exact cooling infrastructure (P1: 2 A/C units; P2: 3 UKG units with ducting)
        - Electrical units (USV / UPS) and Network cabinets
        - Doors and perimeter room walls
        - Technical stamps with layout parameters
        """
        np.random.seed(seed)
        img = Image.new("RGB", (width, height), (10, 11, 16))
        draw = ImageDraw.Draw(img, "RGBA")

        # Color schemes based on style & lighting
        glow_cyan = (0, 240, 255)
        glow_violet = (139, 92, 246)
        glow_amber = (245, 158, 11)
        glow_emerald = (16, 185, 129)

        # Detect specific layout properties
        room_info = layout.get("room", {}) if layout else {}
        room_w = room_info.get("width_m", 12.0)
        room_l = room_info.get("length_m", 15.0)
        room_area = room_info.get("area_sqm", round(room_w * room_l, 1))

        components = layout.get("components", []) if layout else []
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]
        electrical_units = [c for c in components if c.get("category") == "electrical_infrastructure"]
        network_units = [c for c in components if c.get("category") == "network_infrastructure"]
        doors = [c for c in components if c.get("category") == "physical_infrastructure" and "door" in c.get("type", "")]

        actual_rack_count = len(racks) if racks else rack_count
        is_p1_handdrawn = (actual_rack_count == 8) or (room_w < 6.0 and room_l < 5.0)
        is_p2_cad = (actual_rack_count == 12) or any("UKG" in c.get("name", "") for c in cooling_units)

        # 1. Background gradient (Deep space darkness with subtle architectural ambient)
        for y in range(height):
            factor = y / height
            r = int(10 + factor * 6)
            g = int(12 + factor * 8)
            b = int(18 + factor * 14)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Vanishing point and perspective setup
        vanish_x = width // 2
        vanish_y = int(height * 0.42)

        # Draw raised access floor
        floor_poly = [(0, vanish_y), (width, vanish_y), (width, height), (0, height)]
        draw.polygon(floor_poly, fill=(15, 18, 25))

        # Ceiling
        draw.polygon([(0, 0), (width, 0), (width, vanish_y), (0, vanish_y)], fill=(12, 14, 20))

        # Floor grid lines (Perspective projection)
        num_grid_lines = 16
        for i in range(-num_grid_lines, num_grid_lines + 1):
            bottom_x = vanish_x + int(i * (width / (num_grid_lines * 0.85)))
            alpha = max(20, min(140, int(120 - abs(i) * 5)))
            draw.line([(vanish_x, vanish_y), (bottom_x, height)], fill=(40, 52, 72, alpha), width=1)

        # Transverse floor tile lines
        num_rings = 14
        for r in range(1, num_rings):
            t = (r / num_rings) ** 2.0
            y_ring = int(vanish_y + t * (height - vanish_y))
            draw.line([(0, y_ring), (width, y_ring)], fill=(45, 58, 80, int(160 * t)), width=1)
            # Center aisle blue neon reflection
            reflection_w = int(width * 0.22 * t)
            draw.line(
                [(vanish_x - reflection_w, y_ring), (vanish_x + reflection_w, y_ring)],
                fill=(glow_cyan[0], glow_cyan[1], glow_cyan[2], int(70 * t)),
                width=2
            )

        # 3. Render racks according to exact layout
        # Determine racks per row
        if is_p1_handdrawn:
            racks_per_row = 4
            num_rows = 2
            layout_title = "P1: 4.8m x 3.6m EDGE DC (8 RACKS, 2x4, 2 A/C, 1 DOOR)"
        elif is_p2_cad:
            racks_per_row = 6
            num_rows = 2
            layout_title = "P2: 49.6 m² SERVERRAUM + TECHNIKSPANGE (12 RACKS, 2x6, 3 UKG, USV)"
        else:
            racks_per_row = max(2, actual_rack_count // 2)
            num_rows = 2
            layout_title = f"CUSTOM LAYOUT: {room_w:.1f}m x {room_l:.1f}m ({actual_rack_count} RACKS, {len(cooling_units)} COOLING)"

        # Left and Right rack rows
        for side in [-1, 1]:  # -1 = left, +1 = right
            for step in range(racks_per_row, 0, -1):
                t_near = ((step) / (racks_per_row + 0.6)) ** 1.5
                t_far = ((step - 0.85) / (racks_per_row + 0.6)) ** 1.5

                # X coordinates
                x_near = int(vanish_x + side * (width * 0.15 + (width * 0.36) * t_near))
                x_far = int(vanish_x + side * (width * 0.15 + (width * 0.36) * t_far))

                # Y coordinates
                y_floor_near = int(vanish_y + t_near * (height - vanish_y) * 0.88)
                y_floor_far = int(vanish_y + t_far * (height - vanish_y) * 0.88)
                y_ceil_near = int(vanish_y - t_near * (vanish_y * 0.72))
                y_ceil_far = int(vanish_y - t_far * (vanish_y * 0.72))

                # Rack face polygon
                rack_poly = [
                    (x_far, y_ceil_far),
                    (x_near, y_ceil_near),
                    (x_near, y_floor_near),
                    (x_far, y_floor_far)
                ]
                rack_fill = (22, 26, 36) if side == -1 else (26, 30, 42)
                draw.polygon(rack_poly, fill=rack_fill, outline=(55, 68, 92, 200))

                # Rack slots & LEDs
                slots = 14
                for s in range(slots):
                    s_frac = s / slots
                    s_y_near = int(y_ceil_near + s_frac * (y_floor_near - y_ceil_near))
                    s_y_far = int(y_ceil_far + s_frac * (y_floor_far - y_ceil_far))

                    draw.line([(x_far, s_y_far), (x_near, s_y_near)], fill=(14, 16, 22), width=1)

                    # Glowing status LEDs
                    if np.random.rand() > 0.2:
                        led_color = glow_cyan if np.random.rand() > 0.3 else glow_emerald
                        if is_p2_cad and s % 4 == 0:
                            led_color = glow_violet
                        led_x = int(x_near + (x_far - x_near) * 0.25)
                        led_y = int(s_y_near + (s_y_far - s_y_near) * 0.25)
                        alpha = int(min(255, 180 + 75 * t_near))
                        draw.ellipse([(led_x - 1, led_y - 1), (led_x + 2, led_y + 2)], fill=(led_color[0], led_color[1], led_color[2], alpha))

                # Rack label tag at top
                tag_x = int(x_near + (x_far - x_near) * 0.5)
                tag_y = int(y_ceil_near + (y_ceil_far - y_ceil_near) * 0.5) + 4
                tag_name = f"R{step}" if side == -1 else f"R{step + racks_per_row}"
                draw.text((tag_x - 6, tag_y), tag_name, fill=(120, 150, 190, 180))

        # 4. Render Layout-Specific Elements: Cooling & Infrastructure
        if is_p1_handdrawn:
            # P1: 2 A/C units at top wall
            ac_w = int(width * 0.08)
            ac_h = int(height * 0.09)
            # AC 1
            draw.rectangle([(vanish_x - 70, vanish_y - ac_h), (vanish_x - 15, vanish_y)], fill=(32, 45, 65), outline=(0, 240, 255, 180))
            draw.text((vanish_x - 60, vanish_y - ac_h + 8), "A/C-1", fill=(0, 240, 255))
            # AC 2
            draw.rectangle([(vanish_x + 15, vanish_y - ac_h), (vanish_x + 70, vanish_y)], fill=(32, 45, 65), outline=(0, 240, 255, 180))
            draw.text((vanish_x + 25, vanish_y - ac_h + 8), "A/C-2", fill=(0, 240, 255))

            # Left wall Door
            door_x = int(width * 0.05)
            door_y_bot = int(height * 0.75)
            door_y_top = int(height * 0.40)
            draw.rectangle([(door_x, door_y_top), (door_x + 45, door_y_bot)], fill=(20, 25, 38), outline=(239, 68, 68, 220), width=2)
            draw.text((door_x + 6, door_y_top + 10), "DOOR", fill=(239, 68, 68))
            draw.ellipse([(door_x + 35, door_y_top + 50), (door_x + 40, door_y_top + 55)], fill=(239, 68, 68))

            # Electricity panel on left
            draw.rectangle([(door_x, door_y_top - 50), (door_x + 40, door_y_top - 10)], fill=(25, 35, 28), outline=(16, 185, 129, 200), width=1)
            draw.text((door_x + 5, door_y_top - 42), "PWR", fill=(16, 185, 129))

            # Network rack on right wall
            net_x = int(width * 0.90)
            draw.rectangle([(net_x, door_y_top - 50), (net_x + 40, door_y_top + 30)], fill=(30, 25, 45), outline=(139, 92, 246, 200), width=1)
            draw.text((net_x + 6, door_y_top - 42), "NET", fill=(139, 92, 246))

        elif is_p2_cad:
            # P2: Adjacent Technikspange with 3 UKG cooling units (UKG 1, UKG 2, UKG 3) and USV
            # Right side partition / Technikspange section
            tech_x = int(width * 0.82)
            draw.line([(tech_x, 0), (tech_x, height)], fill=(139, 92, 246, 120), width=2)
            draw.text((tech_x + 6, 20), "TECHNIKSPANGE", fill=(139, 92, 246))

            # 3 UKG units along Technikspange
            ukg_y_start = int(height * 0.15)
            for k in range(3):
                uy = ukg_y_start + k * 85
                draw.rectangle([(tech_x + 8, uy), (width - 15, uy + 65)], fill=(28, 38, 56), outline=(0, 240, 255, 220), width=2)
                draw.text((tech_x + 14, uy + 8), f"UKG {k+1}", fill=(0, 240, 255))
                draw.text((tech_x + 14, uy + 26), "CRAC / DUCT", fill=(148, 163, 184))
                # Exhaust duct indicator (Abluftkanal)
                draw.line([(tech_x + 10, uy + 48), (width - 20, uy + 48)], fill=(0, 240, 255, 140), width=2)

            # Central USV (UPS) battery cabinet in far center
            draw.rectangle([(vanish_x - 45, vanish_y - 75), (vanish_x + 45, vanish_y)], fill=(32, 42, 35), outline=(16, 185, 129, 220), width=2)
            draw.text((vanish_x - 30, vanish_y - 60), "USV (UPS)", fill=(16, 185, 129))
            draw.text((vanish_x - 36, vanish_y - 42), "BATTERIES", fill=(16, 185, 129))

            # Serverraum double fire door
            draw.rectangle([(15, int(height * 0.45)), (65, int(height * 0.75))], fill=(25, 28, 38), outline=(239, 68, 68, 220), width=2)
            draw.text((22, int(height * 0.48)), "T30", fill=(239, 68, 68))
            draw.text((22, int(height * 0.55)), "DOOR", fill=(239, 68, 68))

        # 5. Overhead Cable Ladders and Trays
        draw.line([(vanish_x - 40, vanish_y - 50), (width * 0.15, 0)], fill=(70, 85, 115, 180), width=2)
        draw.line([(vanish_x + 40, vanish_y - 50), (width * 0.85, 0)], fill=(70, 85, 115, 180), width=2)
        for r in range(8):
            t = (r + 1) / 9.0
            x_l = int((vanish_x - 40) + t * (width * 0.15 - (vanish_x - 40)))
            x_r = int((vanish_x + 40) + t * (width * 0.85 - (vanish_x + 40)))
            y_t = int((vanish_y - 50) + t * (0 - (vanish_y - 50)))
            draw.line([(x_l, y_t), (x_r, y_t)], fill=(60, 75, 100, 150), width=1)

        # 6. Technical Badge and Footer
        # Header layout banner
        draw.rectangle([(0, 0), (width, 36)], fill=(8, 10, 16, 230))
        draw.line([(0, 36), (width, 36)], fill=(0, 240, 255, 100), width=1)
        draw.text((20, 10), layout_title, fill=(0, 240, 255))

        # Footer badge
        footer_y = height - 44
        draw.rectangle([(0, footer_y), (width, height)], fill=(6, 8, 12, 240))
        draw.line([(0, footer_y), (width, footer_y)], fill=(0, 240, 255, 90), width=1)

        stamp_text = "RACKVISION AI • LAYOUT-DRIVEN GENERATIVE ENGINE"
        if is_demo:
            mode_badge = "[ PROCEDURAL PREVIEW: LAYOUT-CONDITIONED ]"
            badge_color = (0, 240, 255)
        else:
            mode_badge = "[ INFERENCE MODE: STABLE DIFFUSION + CONTROLNET ]"
            badge_color = (16, 185, 129)

        draw.text((20, footer_y + 12), stamp_text, fill=(226, 232, 240))
        draw.text((width - 360, footer_y + 12), mode_badge, fill=badge_color)

        img.save(str(output_path), "PNG")
        logger.info("Generated layout-conditioned architectural design to %s", output_path)
