export interface Fluid {
    name: string;
    rho: number;
    nu: number;
    pv_kpa: number;
}

export interface Material {
    name: string;
    roughness: number;
}

export interface PipeFitting {
    name: string;
    k: number;
    quantity: number;
}

export interface PipeSection {
    id: string;
    name: string;
    length_m: number;
    diameter_mm: number;
    material: string;
    roughness_mm: number;
    equipment_loss_m: number;
    fittings: PipeFitting[];
}

export interface PumpCurvePoint {
    flow: number;
    head: number;
    efficiency?: number;
    npshr?: number;
}

export interface SystemState {
    fluid: Fluid;
    suction_sections: PipeSection[];
    discharge_sections_before: PipeSection[];
    discharge_parallel_sections: Record<string, PipeSection[]>;
    discharge_sections_after: PipeSection[];

    static_head: number;

    // New Pressure Fields (Phase 3)
    pressure_suction_bar_g: number;
    pressure_discharge_bar_g: number;
    atmospheric_pressure_bar: number;
    altitude_m: number;

    pump_curve: PumpCurvePoint[];
}

export interface HeadLossResult {
    section_id: string;
    total_loss_m: number;
    major_loss_m: number;
    minor_loss_m: number;
    velocity_m_s: number;
    reynolds: number;
    friction_factor: number;
}

export interface OperatingPointResult {
    flow_op: number;
    head_op: number;
    efficiency_op?: number;
    power_kw?: number;
    cost_per_year?: number;
    npsh_available?: number;
    npsh_required?: number;
    cavitation_risk?: boolean;
    details?: HeadLossResult[];
}
