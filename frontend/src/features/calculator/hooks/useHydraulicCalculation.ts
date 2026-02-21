
import { useState } from 'react';
import axios from 'axios';
import { OperatingPointResult } from '@/types/engineering';
import { useSystemStore } from './../stores/useSystemStore';

// Assuming API is proxied or running on 8000
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const useHydraulicCalculation = () => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<OperatingPointResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get current state from store
    const fluid = useSystemStore(state => state.fluid);
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);
    const staticHead = useSystemStore(state => state.static_head);
    const pumpCurve = useSystemStore(state => state.pump_curve);

    // Pressures
    const pSuction = useSystemStore(state => state.pressure_suction_bar_g);
    const pDischarge = useSystemStore(state => state.pressure_discharge_bar_g);
    const pAtm = useSystemStore(state => state.atmospheric_pressure_bar);

    // Energy Config
    const efficiencyMotor = useSystemStore(state => state.efficiency_motor);
    const hoursPerDay = useSystemStore(state => state.hours_per_day);
    const energyCost = useSystemStore(state => state.energy_cost_per_kwh);

    const calculateOperatingPoint = async () => {
        setIsCalculating(true);
        setError(null);
        try {
            const payload = {
                suction_sections: suction,
                discharge_sections_before: dischargeBefore,
                discharge_parallel_sections: dischargeParallel,
                discharge_sections_after: dischargeAfter,
                fluid: fluid,
                static_head_m: staticHead,

                // Pressure Fields
                pressure_suction_bar_g: pSuction,
                pressure_discharge_bar_g: pDischarge,
                atmospheric_pressure_bar: pAtm,

                // Energy Fields
                efficiency_motor: efficiencyMotor,
                hours_per_day: hoursPerDay,
                energy_cost_per_kwh: energyCost,

                pump_curve_points: pumpCurve
            };

            const response = await axios.post<OperatingPointResult>(
                `${API_URL}/calculate/operating-point`,
                payload
            );
            setResult(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || "Calculation failed");
        } finally {
            setIsCalculating(false);
        }
    };

    return {
        calculateOperatingPoint,
        isCalculating,
        result,
        error
    };
};
