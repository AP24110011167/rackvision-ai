import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak, KeepTogether, HRFlowable
)

from app.core.config import settings
from app.database.db import get_connection
from app.services.simulator_service import SimulatorService
from app.services.material_service import MaterialService
from app.services.construction_service import ConstructionService
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger("rackvision.reports")

class ReportService:
    @staticmethod
    def generate_pdf_report(project_id: str) -> str:
        """
        Generates a comprehensive multi-page engineering design PDF report.
        Includes project details, BOM table, construction timeline, analytics, and legal disclaimers.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        proj = cursor.fetchone()
        conn.close()

        if not proj:
            raise ValueError(f"Project with ID {project_id} not found.")

        pdf_filename = f"RackVision_Engineering_Report_{project_id}.pdf"
        pdf_path = settings.REPORTS_DIR / pdf_filename

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom ReportLab Styles
        cyan_accent = colors.HexColor("#0099AA")
        dark_navy = colors.HexColor("#0A0B10")
        slate_text = colors.HexColor("#2D3748")
        light_bg = colors.HexColor("#F8FAFC")
        border_color = colors.HexColor("#CBD5E1")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=24,
            leading=28,
            textColor=dark_navy,
            fontName="Helvetica-Bold",
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=11,
            leading=14,
            textColor=cyan_accent,
            fontName="Helvetica-Bold",
            spaceAfter=15
        )

        h1_style = ParagraphStyle(
            "SectionH1",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=dark_navy,
            fontName="Helvetica-Bold",
            spaceBefore=14,
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=slate_text,
            fontName="Helvetica"
        )

        table_header_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.white,
            fontName="Helvetica-Bold"
        )

        table_cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontSize=7.5,
            leading=9.5,
            textColor=slate_text,
            fontName="Helvetica"
        )

        story = []

        # Header Title
        story.append(Paragraph("RACKVISION AI — ENGINEERING DESIGN PACKAGE", title_style))
        story.append(Paragraph(f"PROJECT: {proj['name']} | TARGET: {proj['target_tier']} | DATE: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=cyan_accent, spaceBefore=0, spaceAfter=12))

        # Project Summary Info Table
        meta_data = [
            [
                Paragraph("<b>Project Identifier:</b>", body_style),
                Paragraph(str(proj["id"]), body_style),
                Paragraph("<b>Client / Operator:</b>", body_style),
                Paragraph(str(proj["client"] or "Internal Cloud Facility"), body_style)
            ],
            [
                Paragraph("<b>Campus Location:</b>", body_style),
                Paragraph(str(proj["location"] or "Pod A / Zone 4"), body_style),
                Paragraph("<b>Uptime Institute Tier:</b>", body_style),
                Paragraph(str(proj["target_tier"] or "Tier III"), body_style)
            ],
            [
                Paragraph("<b>Scope Description:</b>", body_style),
                Paragraph(str(proj["description"] or "AI High-Density Data Center"), body_style),
                Paragraph("<b>Design Verification:</b>", body_style),
                Paragraph("Preliminary AI/ML Heuristic Synthesis", body_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), light_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 14))

        # Section 1: Executive Overview
        story.append(Paragraph("1. EXECUTIVE INFRASTRUCTURE SUMMARY", h1_style))
        metrics = AnalyticsService.calculate_metrics(project_id)
        exec_text = (
            f"This engineering package details the architectural transformation, physical layout, thermal dynamics, "
            f"and electrical procurement schedule for <b>{proj['name']}</b>. The layout provisions <b>{metrics['rack_count']} standard 42U server enclosures</b> "
            f"across <b>{metrics['total_floor_area_sqm']} m²</b> of cleanroom white space. "
            f"Total estimated IT power demand is <b>{metrics['total_it_power_kw']} kW</b> with an average density of "
            f"<b>{metrics['rack_density_kw_per_rack']} kW/rack</b>. The thermal management system incorporates {metrics['cooling_redundancy']} "
            f"perimeter downflow CRAC units delivering <b>{metrics['installed_cooling_kw']} kW</b> of gross cooling capacity "
            f"against a required load of <b>{metrics['required_cooling_kw']} kW ({metrics['cooling_capacity_tons']} Tons)</b>. "
            f"The estimated facility Power Usage Effectiveness (PUE) is <b>{metrics['estimated_pue']}</b> under nominal ASHRAE TC 9.9 recommended envelope conditions."
        )
        story.append(Paragraph(exec_text, body_style))
        story.append(Spacer(1, 10))

        # Metrics KPI Grid Table
        kpi_data = [
            [
                Paragraph("<b>Total Floor Area</b>", table_header_style),
                Paragraph("<b>IT Power Demand</b>", table_header_style),
                Paragraph("<b>Cooling Capacity</b>", table_header_style),
                Paragraph("<b>Heat Load</b>", table_header_style),
                Paragraph("<b>Target PUE</b>", table_header_style)
            ],
            [
                Paragraph(f"{metrics['total_floor_area_sqm']} m²", table_cell_style),
                Paragraph(f"{metrics['total_it_power_kw']} kW", table_cell_style),
                Paragraph(f"{metrics['installed_cooling_kw']} kW", table_cell_style),
                Paragraph(f"{metrics['heat_dissipation_btu_hr']:,.0f} BTU/h", table_cell_style),
                Paragraph(f"{metrics['estimated_pue']} (Class A1)", table_cell_style)
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[108, 108, 108, 108, 108])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
            ("BACKGROUND", (0, 1), (-1, 1), light_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # Section 2: Bill of Materials (BOM) Table
        story.append(Paragraph("2. INFRASTRUCTURE BILL OF MATERIALS (BOM) & ESTIMATED COSTS", h1_style))
        materials = MaterialService.get_materials(project_id)
        
        bom_rows = [
            [
                Paragraph("<b>Category</b>", table_header_style),
                Paragraph("<b>Component Name</b>", table_header_style),
                Paragraph("<b>Technical Specification</b>", table_header_style),
                Paragraph("<b>Qty</b>", table_header_style),
                Paragraph("<b>Unit Price</b>", table_header_style),
                Paragraph("<b>Ext. Total</b>", table_header_style)
            ]
        ]

        total_cost = 0.0
        for m in materials:
            total_cost += m["total_price"]
            bom_rows.append([
                Paragraph(m["category"][:16], table_cell_style),
                Paragraph(m["name"][:32], table_cell_style),
                Paragraph(m["specification"][:45], table_cell_style),
                Paragraph(f"{m['quantity']} {m['unit'][:6]}", table_cell_style),
                Paragraph(f"${m['unit_price']:,.2f}", table_cell_style),
                Paragraph(f"${m['total_price']:,.2f}", table_cell_style)
            ])

        # Summary Row
        bom_rows.append([
            Paragraph("<b>TOTAL</b>", table_cell_style),
            Paragraph("<b>Estimated Equipment & Materials</b>", table_cell_style),
            Paragraph("", table_cell_style),
            Paragraph(f"<b>{len(materials)} Items</b>", table_cell_style),
            Paragraph("", table_cell_style),
            Paragraph(f"<b>${total_cost:,.2f}</b>", table_cell_style)
        ])

        bom_table = Table(bom_rows, colWidths=[80, 115, 160, 55, 65, 65])
        bom_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, light_bg]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(bom_table)
        story.append(Spacer(1, 14))

        # Page break before Construction Stages
        story.append(PageBreak())

        # Section 3: 10-Stage Sequential Construction Plan
        story.append(Paragraph("3. 10-STAGE SEQUENTIAL CONSTRUCTION PLAN & TIMELINE", h1_style))
        plan = ConstructionService.get_plan(project_id)
        if plan and plan.get("stages"):
            stages = plan["stages"]
            const_rows = [
                [
                    Paragraph("<b>#</b>", table_header_style),
                    Paragraph("<b>Construction Milestone Phase</b>", table_header_style),
                    Paragraph("<b>Duration</b>", table_header_style),
                    Paragraph("<b>Status</b>", table_header_style),
                    Paragraph("<b>Key Safety Precaution</b>", table_header_style)
                ]
            ]
            for s in stages:
                safety = s["safety_precautions"][0] if s.get("safety_precautions") else "Standard site PPE"
                const_rows.append([
                    Paragraph(str(s["stage_num"]), table_cell_style),
                    Paragraph(f"<b>{s['title']}</b><br/><font color='#64748B'>{s['description'][:90]}...</font>", table_cell_style),
                    Paragraph(f"{s['duration_days']} Days", table_cell_style),
                    Paragraph(s['status'], table_cell_style),
                    Paragraph(safety[:55], table_cell_style)
                ])

            const_table = Table(const_rows, colWidths=[24, 230, 60, 70, 156])
            const_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
                ("BOX", (0, 0), (-1, -1), 0.5, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(const_table)

        story.append(Spacer(1, 14))

        # Section 4: Engineering Assumptions and Limitations
        story.append(Paragraph("4. ENGINEERING ASSUMPTIONS, STANDARDS & LEGAL DISCLAIMER", h1_style))
        disclaimer_text = (
            "<b>Applicable Design Standards Referenced:</b><br/>"
            "• ASHRAE TC 9.9 (2021): Thermal Guidelines for Data Processing Environments (Recommended Envelope: 18°C–27°C, 5.5°C DP to 60% RH).<br/>"
            "• ANSI/TIA-942-B: Telecommunications Infrastructure Standard for Data Centers (Tier III Concurrently Maintainable criteria).<br/>"
            "• NFPA 75 & NFPA 76: Standard for the Fire Protection of Information Technology Equipment & Telecommunications Facilities.<br/>"
            "• NFPA 70 (NEC Article 645): Information Technology Equipment electrical requirements and selective coordination.<br/><br/>"
            "<b>Engineering Limitations Notice:</b><br/>"
            "This document is an academic and preliminary computational planning aid generated by RackVision AI. "
            "All physical quantities, thermal heat loads, electrical circuit ratings, and equipment costs represent heuristic estimations. "
            "This report <b>DOES NOT</b> constitute a certified or stamped engineering drawing. "
            "A licensed Professional Engineer (PE) in structural, electrical, mechanical (HVAC), and fire protection engineering "
            "must independently review, perform site-specific calculations, and stamp all construction plans prior to permit submission or field procurement."
        )
        story.append(Paragraph(disclaimer_text, body_style))

        # Build document
        doc.build(story)
        logger.info("Generated PDF engineering report at %s", pdf_path)
        return str(pdf_path)
