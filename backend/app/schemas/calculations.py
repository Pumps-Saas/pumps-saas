from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict

class FluidProperties(BaseModel):
    name: str
    rho: float = Field(..., description="Density in kg/m³")
    nu: float = Field(..., description="Kinematic viscosity in m²/s")
    pv_kpa: float = Field(..., description="Vapor pressure in kPa")

    @field_validator('rho')
    def rho_positive(cls, v):
        if v <= 0: raise ValueError('Density must be positive')
        return v

    @field_validator('nu')
    def nu_non_negative(cls, v):
        if v < 0: raise ValueError('Viscosity must be non-negative')
        return v

class PipeFitting(BaseModel):
    name: str
    k: float
    quantity: int = 1

class PipeSection(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = "Pipe Section"
    length_m: float = Field(..., gt=0, description="Length in meters")
    diameter_mm: float = Field(..., gt=0, description="Internal diameter in millimeters")
    material: str
    roughness_mm: float = Field(..., ge=0, description="Absolute roughness in millimeters")
    equipment_loss_m: float = Field(0.0, ge=0, description="Fixed head loss from equipment in meters")
    fittings: List[PipeFitting] = []

class HeadLossResult(BaseModel):
    section_id: Optional[str]
    total_loss_m: float
    major_loss_m: float
    minor_loss_m: float
    velocity_m_s: float
    reynolds: float
    friction_factor: float

class SystemHeadCurveRequest(BaseModel):
    suction_sections: List[PipeSection]
    discharge_sections_before: List[PipeSection]
    discharge_parallel_sections: Dict[str, List[PipeSection]] = {}
    discharge_sections_after: List[PipeSection]
    fluid: FluidProperties
    
    static_head_m: float
    
    # Pressure Params (Phase 3)
    pressure_suction_bar_g: float = Field(0.0, description="Pressure at suction tank surface (Gauge) in bar")
    pressure_discharge_bar_g: float = Field(0.0, description="Pressure at discharge tank surface (Gauge) in bar")
    atmospheric_pressure_bar: float = Field(1.01325, description="Local atmospheric pressure in bar")

    flow_min_m3h: float = 0.0
    flow_max_m3h: float = 100.0
    steps: int = 50

class OperatingPointRequest(BaseModel):
    suction_sections: List[PipeSection]
    discharge_sections_before: List[PipeSection]
    discharge_parallel_sections: Dict[str, List[PipeSection]] = {}
    discharge_sections_after: List[PipeSection]
    fluid: FluidProperties
    
    static_head_m: float
    
    # Pressure Params (Phase 3)
    pressure_suction_bar_g: float = Field(0.0, description="Pressure at suction tank surface (Gauge) in bar")
    pressure_discharge_bar_g: float = Field(0.0, description="Pressure at discharge tank surface (Gauge) in bar")
    atmospheric_pressure_bar: float = Field(1.01325, description="Local atmospheric pressure in bar")

    pump_curve_points: List[Dict[str, float]] # [{'flow': x, 'head': y, 'efficiency': z}, ...]
    
    # Financial / Operational Params 
    efficiency_motor: float = 0.90
    hours_per_day: float = 8.0
    energy_cost_per_kwh: float = 0.75

class OperatingPointResponse(BaseModel):
    flow_op: float
    head_op: float
    efficiency_op: Optional[float] = None
    power_kw: Optional[float] = None
    cost_per_year: Optional[float] = None
    npsh_available: Optional[float] = None
    npsh_required: Optional[float] = None
    cavitation_risk: bool = False
    details: List[HeadLossResult] = []

    # Phase 6: Advanced Analysis
    natural_flow_m3h: Optional[float] = None
    head_breakdown: Optional[Dict[str, float]] = None
    is_extrapolated: bool = False
