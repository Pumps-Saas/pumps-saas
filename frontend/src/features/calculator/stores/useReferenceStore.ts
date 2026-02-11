import { create } from 'zustand';
import axios from 'axios';
import { Material, Fluid } from '@/types/engineering';

interface ReferenceStore {
    fluids: Record<string, any>;
    materials: Record<string, number>;
    fittings: Record<string, number>;
    diameters: Record<string, number>;
    isLoading: boolean;
    error: string | null;
    fetchStandards: () => Promise<void>;
}

export const useReferenceStore = create<ReferenceStore>((set) => ({
    fluids: {},
    materials: {},
    fittings: {},
    diameters: {},
    isLoading: false,
    error: null,
    fetchStandards: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get('http://localhost:8000/api/v1/fluids/standards');
            set({
                fluids: response.data.fluids,
                materials: response.data.materials,
                fittings: response.data.fittings,
                diameters: response.data.diameters,
                isLoading: false
            });
        } catch (err: any) {
            console.error("Failed to fetch standards", err);
            set({ error: "Failed to load standard data", isLoading: false });
        }
    }
}));
