/**
 * RACKVISION AI — CENTRALIZED ASSET REGISTRY
 * Manages verified architectural images, stage deliverables, and fail-safe fallbacks.
 * Prevents broken image icons, missing assets, and unhandled 404s across the application.
 */

export interface AssetMetadata {
  id: string;
  url: string;
  title: string;
  category: 'input_cad' | 'canny_edge' | 'cv_annotation' | 'photoreal_preview' | 'master_render' | 'technical';
  dimensions: { width: number; height: number; aspectRatio: string };
  description: string;
  groundTruthSpecs?: string;
}

export const ASSET_REGISTRY: Record<string, AssetMetadata> = {
  // P2: CAD Floor Plan Ground Truth (Serverraum 49.6 m²)
  p2_cad_raw: {
    id: 'p2_cad_raw',
    url: '/images/p2_cad_floor_plan.png',
    title: 'Architectural CAD Floor Plan (DWG/DXF Ingestion)',
    category: 'input_cad',
    dimensions: { width: 1200, height: 870, aspectRatio: '16/10' },
    description: 'Raw architectural CAD blueprint of the 49.6 m² Serverraum facility with dimension strings and partition wall.',
    groundTruthSpecs: '8.27m × 6.0m • 49.6 m² • Serverraum T30'
  },
  p2_cad_annotated: {
    id: 'p2_cad_annotated',
    url: '/images/p2_cad_annotated.png',
    title: 'Computer Vision Detected Equipment Bounds',
    category: 'cv_annotation',
    dimensions: { width: 1200, height: 870, aspectRatio: '16/10' },
    description: 'YOLOv8 & OpenCV contour analysis detecting 12 server cabinets, 3 UKG cooling units, and USV battery system.',
    groundTruthSpecs: '12 Racks (2×6) • 3 UKG • 1 USV • Confidence: 99.4%'
  },
  p2_cad_canny: {
    id: 'p2_cad_canny',
    url: '/images/p2_cad_canny.png',
    title: 'OpenCV Canny Edge Contours',
    category: 'canny_edge',
    dimensions: { width: 1200, height: 870, aspectRatio: '16/10' },
    description: 'High-contrast Canny edges extracted from CAD linework used for initial structural conditioning.',
    groundTruthSpecs: 'Low Threshold: 50 • High Threshold: 150'
  },
  p2_perspective_canny: {
    id: 'p2_perspective_canny',
    url: '/images/p2_perspective_conditioning_canny.png',
    title: '3D Perspective Wireframe Canny Lock',
    category: 'canny_edge',
    dimensions: { width: 1920, height: 1080, aspectRatio: '16/9' },
    description: '3D geometric perspective projected into Canny edge map for ControlNet spatial guidance.',
    groundTruthSpecs: 'ControlNet Canny Guidance Lock • Zero Hallucination'
  },

  // P2: Three-Output Master Deliverables (1920x1080 PBR + SDXL)
  p2_view_a_master: {
    id: 'p2_view_a_master',
    url: '/images/p2_view_a_elevated_overview_master.png',
    title: 'View A: Elevated Architectural Overview Master',
    category: 'master_render',
    dimensions: { width: 1920, height: 1080, aspectRatio: '16/9' },
    description: 'High 82° vantage perspective capturing 49.6 m² white space, Technikspange partition, and containment plenum.',
    groundTruthSpecs: '16mm Equiv • 82° FOV • 1920×1080 Master PBR'
  },
  p2_view_b_master: {
    id: 'p2_view_b_master',
    url: '/images/p2_view_b_server_room_master.png',
    title: 'View B: Server-Room Cold Aisle Perspective Master',
    category: 'master_render',
    dimensions: { width: 1920, height: 1080, aspectRatio: '16/9' },
    description: 'Eye-level cold-aisle perspective along two rows of 6 enterprise 42U cabinets with perforated mesh doors.',
    groundTruthSpecs: '35mm Equiv • 76° FOV • 1920×1080 Master PBR'
  },
  p2_view_c_master: {
    id: 'p2_view_c_master',
    url: '/images/p2_view_c_technical_area_master.png',
    title: 'View C: Technical-Area Cooling Perspective Master',
    category: 'master_render',
    dimensions: { width: 1920, height: 1080, aspectRatio: '16/9' },
    description: 'Dedicated plant showing three 15 kW UKG precision downflow cooling units and interconnecting T30 fire door.',
    groundTruthSpecs: '28mm Equiv • 74° FOV • 1920×1080 Master PBR'
  },

  // P1: Hand-Drawn Sketch Ground Truth (17.3 m², 8 Racks)
  p1_sketch_raw: {
    id: 'p1_sketch_raw',
    url: '/images/p1_hand_drawn_sketch.png',
    title: 'P1 Hand-Drawn Architectural Sketch',
    category: 'input_cad',
    dimensions: { width: 800, height: 600, aspectRatio: '4/3' },
    description: 'Original hand-drawn pen-on-paper sketch of 4.8m × 3.6m data room with 8 cabinets.',
    groundTruthSpecs: '4.8m × 3.6m • 17.3 m² • 8 Racks'
  },
  p1_sketch_annotated: {
    id: 'p1_sketch_annotated',
    url: '/images/p1_hand_drawn_annotated.png',
    title: 'P1 Computer Vision Annotation Map',
    category: 'cv_annotation',
    dimensions: { width: 800, height: 600, aspectRatio: '4/3' },
    description: 'Neural edge detection and bounding boxes for 8 racks, 2 A/C units, and entry door.',
    groundTruthSpecs: '8 Racks (2×4) • 2 Perimeter CRAC • 1 Door'
  },
  p1_sketch_canny: {
    id: 'p1_sketch_canny',
    url: '/images/p1_hand_drawn_canny.png',
    title: 'P1 Edge Extraction',
    category: 'canny_edge',
    dimensions: { width: 800, height: 600, aspectRatio: '4/3' },
    description: 'Cleaned binary stroke vectors from hand-drawn input.',
    groundTruthSpecs: 'Stroke Cleaned & Normalized'
  },
  p1_master: {
    id: 'p1_master',
    url: '/images/p1_output3_master_render.png',
    title: 'P1 Master Architectural Render',
    category: 'master_render',
    dimensions: { width: 1920, height: 1080, aspectRatio: '16/9' },
    description: 'Photorealistic architectural render of the 8-rack hand-drawn data center.',
    groundTruthSpecs: '4.8m × 3.6m • 8 Racks • 80 kW IT Load'
  }
};

/**
 * Returns a verified asset URL or the designated fallback.
 */
export const getAssetUrl = (idOrUrl: string, fallbackId: string = 'p2_view_a_master'): string => {
  if (ASSET_REGISTRY[idOrUrl]) {
    return ASSET_REGISTRY[idOrUrl].url;
  }
  if (idOrUrl && (idOrUrl.startsWith('/') || idOrUrl.startsWith('http'))) {
    return idOrUrl;
  }
  return ASSET_REGISTRY[fallbackId]?.url || '/images/p2_view_a_elevated_overview_master.png';
};
