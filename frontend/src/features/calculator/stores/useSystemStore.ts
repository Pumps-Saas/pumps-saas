import { create } from 'zustand';
import {
    SystemState,
    PipeSection,
    PumpCurvePoint,
    Fluid,
    PipeFitting
} from '@/types/engineering';
import { v4 as uuidv4 } from 'uuid';

interface SystemStore extends SystemState {
    // Actions
    setFluid: (fluid: Fluid) => void;
    setStaticHead: (head: number) => void;
    setPressure: (field: 'pressure_suction_bar_g' | 'pressure_discharge_bar_g' | 'atmospheric_pressure_bar', value: number) => void;
    setAltitude: (val: number) => void;

    // Suction Actions
    addSuctionSection: (section: Omit<PipeSection, 'id'>) => void;
    updateSuctionSection: (id: string, section: Partial<PipeSection>) => void;
    removeSuctionSection: (id: string) => void;

    // Discharge Before Junction Actions
    addDischargeSectionBefore: (section: Omit<PipeSection, 'id'>) => void;
    updateDischargeSectionBefore: (id: string, section: Partial<PipeSection>) => void;
    removeDischargeSectionBefore: (id: string) => void;

    // Discharge Parallel Actions
    addParallelBranch: (branchName: string) => void;
    removeParallelBranch: (branchName: string) => void;
    addSectionToBranch: (branchName: string, section: Omit<PipeSection, 'id'>) => void;
    updateSectionInBranch: (branchName: string, sectionId: string, section: Partial<PipeSection>) => void;
    removeSectionFromBranch: (branchName: string, sectionId: string) => void;

    // Discharge After Junction Actions
    addDischargeSectionAfter: (section: Omit<PipeSection, 'id'>) => void;
    updateDischargeSectionAfter: (id: string, section: Partial<PipeSection>) => void;
    removeDischargeSectionAfter: (id: string) => void;

    // Pump Actions
    setPumpCurve: (points: PumpCurvePoint[]) => void;
    setPumpDetails: (manufacturer: string, model: string) => void;

    pump_manufacturer: string;
    pump_model: string;

    // Fitting Actions
    addFittingToSection: (sectionLocation: 'suction' | 'discharge_before' | 'discharge_after', sectionId: string, fitting: PipeFitting) => void;

    resetSystem: () => void;
    loadState: (state: Partial<SystemState>) => void;

    // Calculation Action
    operatingPoint: any | null; // Using any to avoid import cycles for now, or use OperatingPointResult
    isCalculating: boolean;
    calculationError: string | null;
    calculateOperatingPoint: () => Promise<void>;
}

const DEFAULT_FLUID: Fluid = {
    name: "Water (20°C)",
    rho: 998.2,
    nu: 1.004e-6,
    pv_kpa: 2.34
};

// Import axios here to use in the store action
import axios from 'axios';
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const useSystemStore = create<SystemStore>((set, get) => ({
    fluid: DEFAULT_FLUID,
    suction_sections: [],
    discharge_sections_before: [],
    discharge_parallel_sections: {},
    discharge_sections_after: [],
    static_head: 10,
    pump_curve: [],
    pump_manufacturer: "",
    pump_model: "",

    // Default Pressures
    pressure_suction_bar_g: 0,
    pressure_discharge_bar_g: 0,
    atmospheric_pressure_bar: 1.01325,
    altitude_m: 0,

    // Calculation State
    operatingPoint: null,
    isCalculating: false,
    calculationError: null,

    setFluid: (fluid) => set({ fluid }),
    setStaticHead: (head) => set({ static_head: head }),
    setPressure: (field, value) => set({ [field]: value }),
    setAltitude: (val: number) => {
        // Calculate Patm based on Altitude
        // P = 101325 * (1 - 2.25577e-5 * h)^5.25588  (Pa)
        const patm_pa = 101325 * Math.pow((1 - 2.25577e-5 * val), 5.25588);
        const patm_bar = patm_pa / 100000;
        set({ altitude_m: val, atmospheric_pressure_bar: patm_bar });
    },

    setPumpDetails: (manufacturer, model) => set({ pump_manufacturer: manufacturer, pump_model: model }),

    // Suction
    addSuctionSection: (section) => set((state) => ({
        suction_sections: [...state.suction_sections, { ...section, id: uuidv4() }]
    })),
    updateSuctionSection: (id, section) => set((state) => ({
        suction_sections: state.suction_sections.map(s => s.id === id ? { ...s, ...section } : s)
    })),
    removeSuctionSection: (id) => set((state) => ({
        suction_sections: state.suction_sections.filter(s => s.id !== id)
    })),

    // Discharge Before
    addDischargeSectionBefore: (section) => set((state) => ({
        discharge_sections_before: [...state.discharge_sections_before, { ...section, id: uuidv4() }]
    })),
    updateDischargeSectionBefore: (id, section) => set((state) => ({
        discharge_sections_before: state.discharge_sections_before.map(s => s.id === id ? { ...s, ...section } : s)
    })),
    removeDischargeSectionBefore: (id) => set((state) => ({
        discharge_sections_before: state.discharge_sections_before.filter(s => s.id !== id)
    })),

    // Parallel Branches
    addParallelBranch: (branchName) => set((state) => ({
        discharge_parallel_sections: {
            ...state.discharge_parallel_sections,
            [branchName]: []
        }
    })),
    removeParallelBranch: (branchName) => set((state) => {
        const newBranches = { ...state.discharge_parallel_sections };
        delete newBranches[branchName];
        return { discharge_parallel_sections: newBranches };
    }),
    addSectionToBranch: (branchName, section) => set((state) => ({
        discharge_parallel_sections: {
            ...state.discharge_parallel_sections,
            [branchName]: [...(state.discharge_parallel_sections[branchName] || []), { ...section, id: uuidv4() }]
        }
    })),
    updateSectionInBranch: (branchName, sectionId, section) => set((state) => ({
        discharge_parallel_sections: {
            ...state.discharge_parallel_sections,
            [branchName]: state.discharge_parallel_sections[branchName].map(s => s.id === sectionId ? { ...s, ...section } : s)
        }
    })),
    removeSectionFromBranch: (branchName, sectionId) => set((state) => ({
        discharge_parallel_sections: {
            ...state.discharge_parallel_sections,
            [branchName]: state.discharge_parallel_sections[branchName].filter(s => s.id !== sectionId)
        }
    })),

    // Discharge After
    addDischargeSectionAfter: (section) => set((state) => ({
        discharge_sections_after: [...state.discharge_sections_after, { ...section, id: uuidv4() }]
    })),
    updateDischargeSectionAfter: (id, section) => set((state) => ({
        discharge_sections_after: state.discharge_sections_after.map(s => s.id === id ? { ...s, ...section } : s)
    })),
    removeDischargeSectionAfter: (id) => set((state) => ({
        discharge_sections_after: state.discharge_sections_after.filter(s => s.id !== id)
    })),

    setPumpCurve: (points) => set({ pump_curve: points }),

    addFittingToSection: (location, sectionId, fitting) => set((state) => {
        // Helper to update specific section in a list
        const updateList = (list: PipeSection[]) =>
            list.map(s => s.id === sectionId ? { ...s, fittings: [...s.fittings, fitting] } : s);

        if (location === 'suction') {
            return { suction_sections: updateList(state.suction_sections) };
        } else if (location === 'discharge_before') {
            return { discharge_sections_before: updateList(state.discharge_sections_before) };
        } else {
            return { discharge_sections_after: updateList(state.discharge_sections_after) };
        }
    }),

    calculateOperatingPoint: async () => {
        const state = get();
        set({ isCalculating: true, calculationError: null, operatingPoint: null });

        try {
            const payload = {
                suction_sections: state.suction_sections,
                discharge_sections_before: state.discharge_sections_before,
                discharge_parallel_sections: state.discharge_parallel_sections,
                discharge_sections_after: state.discharge_sections_after,
                fluid: state.fluid,
                static_head_m: state.static_head,

                pressure_suction_bar_g: state.pressure_suction_bar_g,
                pressure_discharge_bar_g: state.pressure_discharge_bar_g,
                atmospheric_pressure_bar: state.atmospheric_pressure_bar,

                pump_curve_points: state.pump_curve
            };

            const response = await axios.post(`${API_BASE_URL}/calculate/operating-point`, payload);
            set({ operatingPoint: response.data, isCalculating: false });
        } catch (error: any) {
            console.error('Failed to calculate operating point:', error);
            const msg = error.response?.data?.detail || "Failed to calculate operating point.";
            set({ isCalculating: false, calculationError: msg });
        }
    },

    resetSystem: () => set({
        fluid: DEFAULT_FLUID,
        suction_sections: [],
        discharge_sections_before: [],
        discharge_parallel_sections: {},
        discharge_sections_after: [],
        static_head: 10,
        pump_curve: [],
        pressure_suction_bar_g: 0,
        pressure_discharge_bar_g: 0,
        atmospheric_pressure_bar: 1.01325,
        operatingPoint: null,
        isCalculating: false,
        calculationError: null
    }),

    loadState: (state) => set((currentState) => ({
        ...currentState,
        ...state
    }))
}));
