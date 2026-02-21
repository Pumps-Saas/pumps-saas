from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- Basic Entities ---

class Fluid(BaseModel):
    name: str
    density: float = Field(..., gt=0, description="Density in kg/m3")
    viscosity: float = Field(..., gt=0, description="Kinematic viscosity in m2/s")
    vapor_pressure: float = Field(0.0, ge=0, description="Vapor pressure in Pa (for NPSH)")

class Material(BaseModel):
    name: str
    roughness: float = Field(..., ge=0, description="Roughness in mm")

class Fitting(BaseModel):
    name: str
    k: float = Field(..., ge=0, description="Loss coefficient")
    quantity: int = Field(1, ge=1)

# --- Network Components ---

class PipeSegmentDefinition(BaseModel):
    id: str
    name: str
    length: float = Field(..., gt=0, description="Length in meters")
    diameter: float = Field(..., gt=0, description="Internal diameter in mm")
    roughness: float = Field(..., ge=0, description="Roughness in mm")
    fittings: List[Fitting] = []
    equipment_loss: float = Field(0.0, ge=0, description="Additional fixed head loss in meters")

class PumpCurvePoint(BaseModel):
    flow: float = Field(..., ge=0, description="Flow rate in m3/h")
    head: float = Field(..., ge=0, description="Head in meters")
    efficiency: float = Field(0.0, ge=0, le=100, description="Efficiency in %")
    npshr: Optional[float] = Field(None, ge=0, description="NPSH Required in meters")

# --- System Configuration ---

class SystemState(BaseModel):
    fluid: Fluid
    suction_segments: List[PipeSegmentDefinition]
    discharge_segments: List[PipeSegmentDefinition] # Simple series for now, will expand for parallel
    static_head: float = Field(..., description="Total static head (Z2 - Z1 + Pressure Diff)")
    pump_curve: List[PumpCurvePoint]

# --- Calculation Results ---

class SegmentResult(BaseModel):
    segment_id: str
    flow_rate: float
    velocity: float
    reynolds: float
    friction_factor: float
    head_loss_major: float
    head_loss_minor: float
    head_loss_total: float

class MeasurementPoint(BaseModel):
    flow: float
    head: float
    efficiency: Optional[float] = None
    power: Optional[float] = None
    npsh_required: Optional[float] = None

class OperatingPointResult(BaseModel):
    flow: float
    head: float
    efficiency: Optional[float]
    power_kw: Optional[float]
    cost_per_year: Optional[float]
    npsh_available: Optional[float]
    npsh_required: Optional[float] = None
    cavitation_risk: bool = False
    details: List[SegmentResult]
