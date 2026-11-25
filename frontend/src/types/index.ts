export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  location?: string;
  target_tier?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SketchData {
  id: string;
  project_id: string;
  filename: string;
  original_url: string;
  preprocessed_url: string;
  canny_url: string;
  binary_url?: string;
  annotated_overlay_url?: string;
  params: {
    grayscale: boolean;
    blur_radius: number;
    contrast_alpha: number;
    brightness_beta: number;
    canny_low_thresh: number;
    canny_high_thresh: number;
    invert: boolean;
    rotation: number;
    crop_x?: number;
    crop_y?: number;
    crop_w?: number;
    crop_h?: number;
  };
  created_at?: string;
}

export interface LayoutComponent {
  id: string;
  name: string;
  category: 'server_infrastructure' | 'cooling_infrastructure' | 'electrical_infrastructure' | 'physical_infrastructure' | 'network_infrastructure' | string;
  type: string;
  location: { x: number; y: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  orientation_deg: number;
  confidence: number;
  source_bbox: [number, number, number, number];
  properties: Record<string, any>;
}

export interface StructuredLayout {
  schema_version: string;
  project_id: string;
  timestamp: string;
  source_sketch?: string;
  room: {
    width_m: number;
    length_m: number;
    height_m: number;
    area_sqm: number;
    shape: string;
    boundaries: number[][];
  };
  aisles: Array<{
    id: string;
    type: string;
    width_m: number;
    orientation: string;
  }>;
  components: LayoutComponent[];
  equipment_summary: {
    server_racks: number;
    cooling_units: number;
    electrical_units: number;
    network_units: number;
    doors: number;
  };
  confidence_overall: number;
  calibration: {
    pixels_per_meter: number;
    is_estimated: boolean;
    detected_texts?: Array<{ text: string; confidence: number; bbox: number[] }>;
  };
}

export interface SketchIntelligenceResult {
  project_id: string;
  original_url: string;
  preprocessed_url: string;
  binary_url: string;
  canny_url: string;
  annotated_overlay_url: string;
  layout: StructuredLayout;
}

export interface GeneratedDesign {
  id: string;
  project_id: string;
  sketch_id?: string;
  prompt: string;
  negative_prompt: string;
  style: string;
  rack_count: number;
  cooling_type: string;
  image_url: string;
  seed: number;
  guidance_scale: number;
  steps: number;
  resolution: string;
  mode: 'inference' | 'demo' | 'photorealistic_synthesis' | 'colab_diffusion' | 'flux_1.1_pro' | 'flux_1_schnell' | 'neural_master_v2.5' | string;
  is_favorite?: boolean;
  created_at: string;
  output_type?: 'technical' | 'photorealistic' | 'master_render';
  camera_viewpoint?: string;
  viewpoint_label?: string;
  model_name?: string;
  layout_version?: string;
  upscaled?: boolean;
  canny_url?: string;
  comparison_url?: string;
  generation_status?: string;
  inference_latency_ms?: number;
}

export interface DesignOutputsResponse {
  project_id: string;
  technical: GeneratedDesign | null;
  photorealistic: GeneratedDesign | null;
  master_render: GeneratedDesign | null;
  history: GeneratedDesign[];
}

export interface FinalRenderRequest {
  project_id: string;
  sketch_id?: string;
  style?: string;
  camera_viewpoint?: string;
  lighting?: string;
  resolution?: string;
  model_provider?: string;
  enable_upscaling?: boolean;
  seed?: number;
  user_prompt?: string;
  use_style_reference?: boolean;
}

export interface RackComponent {
  id: string;
  name: string;
  row: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  type: string;
  power_kw: number;
  status: string;
  servers_count: number;
}

export interface CoolingUnit {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  capacity_kw: number;
}

export interface PDUComponent {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rating_kva: number;
}

export interface CableTray {
  id: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  orientation: string;
}

export interface Scene3DConfig {
  id?: string;
  project_id: string;
  room_dims: {
    width: number;
    length: number;
    height: number;
  };
  racks: RackComponent[];
  cooling_units: CoolingUnit[];
  pdus: PDUComponent[];
  cable_trays: CableTray[];
  updated_at?: string;
}

export interface MaterialItem {
  id: string;
  project_id: string;
  category: string;
  name: string;
  purpose: string;
  specification: string;
  quantity: number;
  unit: string;
  selection_criteria: string;
  location: string;
  unit_price: number;
  total_price: number;
}

export interface ConstructionStage {
  stage_num: number;
  title: string;
  duration_days: number;
  status: string;
  progress_percent: number;
  dependencies: string[];
  description: string;
  tools_equipment: string[];
  safety_precautions: string[];
  inspection_checklist: string[];
}

export interface ConstructionPlan {
  id: string;
  project_id: string;
  stages: ConstructionStage[];
  total_duration_days: number;
  target_completion_date?: string;
  completed_stages_count: number;
  in_progress_stages_count: number;
  overall_progress_percent: number;
  updated_at: string;
  engineering_disclaimer: string;
}

export interface AnalyticsData {
  project_id: string;
  rack_count: number;
  room_dimensions: { width: number; length: number; height: number };
  total_floor_area_sqm: number;
  usable_it_area_sqm: number;
  space_utilization_percent: number;
  rack_density_kw_per_rack: number;
  total_it_power_kw: number;
  facility_total_power_kw: number;
  required_cooling_kw: number;
  installed_cooling_kw: number;
  cooling_capacity_kw?: number;
  cooling_capacity_tons: number;
  cooling_redundancy: string;
  heat_dissipation_btu_hr: number;
  annual_energy_consumption_mwh: number;
  carbon_footprint_tonnes_yr: number;
  estimated_pue: number;
  pue_breakdown: {
    it_equipment_percent: number;
    cooling_systems_percent: number;
    power_distribution_losses_percent: number;
    lighting_and_building_auxiliary_percent: number;
  };
  cable_requirements_meters: {
    cat6a_copper_horizontal_meters: number;
    om4_multimode_fiber_meters: number;
    os2_singlemode_spine_fiber_meters: number;
    grounding_copper_busbar_meters: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  current_state: string;
  recommended_action: string;
  expected_gain: string;
  ashrae_standard: string;
}

export interface OptimizationData {
  project_id: string;
  efficiency_score: number;
  thermal_balance_score: number;
  compliance_score: number;
  suggestions: OptimizationSuggestion[];
  layout_diff_summary: {
    current_rack_count: number;
    optimized_rack_capacity: number;
    current_pue: number;
    optimized_pue: number;
    potential_annual_power_savings_kwh: number;
    cooling_redundancy_level: string;
    thermal_headroom_margin_c: number;
  };
  disclaimer: string;
}
