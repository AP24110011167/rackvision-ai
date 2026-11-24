from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str = Field(..., example="Helios Cloud Hyperscale DC-1")
    description: Optional[str] = "High-density enterprise datacenter layout"
    client: Optional[str] = "Enterprise Cloud Services"
    location: Optional[str] = "Zone 4, Building B"
    target_tier: Optional[str] = "Tier III"

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    client: Optional[str]
    location: Optional[str]
    target_tier: Optional[str]
    status: str
    created_at: str
    updated_at: str

class PreprocessRequest(BaseModel):
    sketch_id: Optional[str] = None
    grayscale: bool = True
    blur_radius: int = 3
    contrast_alpha: float = 1.3
    brightness_beta: int = 10
    canny_low_thresh: int = 50
    canny_high_thresh: int = 150
    invert: bool = False
    rotation: int = 0
    crop_x: Optional[int] = None
    crop_y: Optional[int] = None
    crop_w: Optional[int] = None
    crop_h: Optional[int] = None

class PreprocessResponse(BaseModel):
    sketch_id: str
    original_url: str
    preprocessed_url: str
    canny_url: str
    params: Dict[str, Any]

class GenerationRequest(BaseModel):
    project_id: str
    sketch_id: Optional[str] = None
    style: str = "Modern Enterprise Data Center"
    rack_count: int = 24
    lighting: str = "Neon Blue & Cool White Cleanroom"
    interior: str = "Cold Aisle Containment with Raised Floor"
    cooling: str = "CRAC Perimeter Precision"
    resolution: str = "768x768"
    guidance_scale: float = 7.5
    inference_steps: int = 30
    seed: Optional[int] = 42
    num_variations: int = 1

class PhotorealisticGenerationRequest(BaseModel):
    project_id: str
    sketch_id: Optional[str] = None
    style: str = "Modern Enterprise Data Center"
    camera_viewpoint: str = "front_symmetrical"
    lighting: str = "Bright White Daylight (5000K)"
    resolution: str = "1024x768"
    guidance_scale: float = 7.5
    inference_steps: int = 35
    seed: Optional[int] = 42
    num_variations: int = 1
    user_prompt: Optional[str] = None

class FinalRenderGenerationRequest(BaseModel):
    project_id: str
    sketch_id: Optional[str] = None
    style: str = "Modern Enterprise Data Center"
    camera_viewpoint: str = "cinematic_central_aisle"
    lighting: str = "Professional White Lighting"
    resolution: str = "1920x1080"
    model_provider: Optional[str] = "auto"
    enable_upscaling: bool = True
    seed: Optional[int] = 42
    guidance_scale: float = 7.5
    inference_steps: int = 40
    user_prompt: Optional[str] = None
    use_style_reference: bool = True

class GeneratedDesignItem(BaseModel):
    id: str
    project_id: str
    sketch_id: Optional[str] = None
    prompt: str
    negative_prompt: str
    style: str
    rack_count: Optional[int] = 12
    cooling_type: Optional[str] = "CRAC Perimeter"
    image_url: str
    seed: Optional[int] = 42
    guidance_scale: Optional[float] = 7.5
    steps: Optional[int] = 30
    resolution: Optional[str] = "1024x768"
    mode: Optional[str] = "procedural_synthesis"
    created_at: str
    output_type: Optional[str] = "technical"
    camera_viewpoint: Optional[str] = "front_symmetrical"
    viewpoint_label: Optional[str] = None
    model_name: Optional[str] = None
    layout_version: Optional[str] = "v1.0"
    upscaled: Optional[bool] = False
    generation_status: Optional[str] = "completed"
    inference_latency_ms: Optional[float] = None

    class Config:
        # Allow extra fields from the service layer without failing validation
        extra = "ignore"

class RackItem(BaseModel):
    id: str
    name: str
    row: str
    x: float
    y: float
    z: float
    width: float = 0.8
    height: float = 2.2
    depth: float = 1.0
    type: str = "AI Compute"
    power_kw: float = 12.0
    status: str = "Online"
    servers_count: int = 18

class CoolingItem(BaseModel):
    id: str
    name: str
    x: float
    y: float
    z: float
    width: float = 1.8
    height: float = 2.5
    depth: float = 1.0
    capacity_kw: float = 95.0

class PDUItem(BaseModel):
    id: str
    name: str
    x: float
    y: float
    z: float
    width: float = 1.0
    height: float = 2.0
    depth: float = 0.9
    rating_kva: float = 250.0

class CableTrayItem(BaseModel):
    id: str
    x: float
    y: float
    z: float
    length: float
    width: float
    orientation: str = "along_row"

class Scene3DData(BaseModel):
    id: Optional[str] = None
    project_id: str
    room_dims: Dict[str, float]
    racks: List[RackItem]
    cooling_units: List[CoolingItem]
    pdus: List[PDUItem]
    cable_trays: List[CableTrayItem]
    updated_at: Optional[str] = None

class MaterialItem(BaseModel):
    id: str
    project_id: str
    category: str
    name: str
    purpose: str
    specification: str
    quantity: float
    unit: str
    selection_criteria: str
    location: str
    unit_price: float
    total_price: float

class UpdateMaterialRequest(BaseModel):
    quantity: Optional[float] = None
    specification: Optional[str] = None
    unit_price: Optional[float] = None

class ConstructionStage(BaseModel):
    stage_num: int
    title: str
    duration_days: int
    status: str
    progress_percent: int
    dependencies: List[str]
    description: str
    tools_equipment: List[str]
    safety_precautions: List[str]
    inspection_checklist: List[str]

class ConstructionPlanResponse(BaseModel):
    id: str
    project_id: str
    stages: List[ConstructionStage]
    total_duration_days: int
    target_completion_date: Optional[str]
    updated_at: str

class AnalyticsResponse(BaseModel):
    project_id: str
    rack_count: int
    room_dimensions: Dict[str, float]
    total_floor_area_sqm: float
    usable_it_area_sqm: float
    space_utilization_percent: float
    rack_density_kw_per_rack: float
    total_it_power_kw: float
    facility_total_power_kw: float = 0.0
    required_cooling_kw: float = 0.0
    installed_cooling_kw: float = 0.0
    cooling_capacity_kw: float = 0.0
    cooling_capacity_tons: float = 0.0
    cooling_redundancy: str = "N+1 Redundant"
    heat_dissipation_btu_hr: float = 0.0
    annual_energy_consumption_mwh: float = 0.0
    cable_requirements_meters: Dict[str, float] = Field(default_factory=dict)
    estimated_pue: float = 1.22
    pue_breakdown: Dict[str, float] = Field(default_factory=dict)
    carbon_footprint_tonnes_yr: float = 0.0

class OptimizationSuggestion(BaseModel):
    id: str
    category: str
    severity: str  # "high" | "medium" | "low"
    title: str
    current_state: str
    recommended_action: str
    expected_gain: str
    ashrae_standard: str

class OptimizationResponse(BaseModel):
    project_id: str
    efficiency_score: int
    thermal_balance_score: int
    compliance_score: int
    suggestions: List[OptimizationSuggestion]
    layout_diff_summary: Dict[str, Any]
