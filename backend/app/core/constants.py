
# Default Material Roughness (mm)
MATERIAIS_PADRAO = {
    "Aço Carbono (novo)": 0.046,
    "Aço Carbono (pouco uso)": 0.1,
    "Aço Carbono (enferrujado)": 0.2,
    "Aço Inox": 0.002,
    "Ferro Fundido": 0.26,
    "PVC / Plástico": 0.0015,
    "Concreto": 0.5
}

# Default Fluid Properties
# rho: Density (kg/m³)
# nu: Kinematic Viscosity (m²/s)
# pv_kpa: Vapor Pressure (kPa)
FLUIDOS_PADRAO = {
    "Água a 20°C": {"rho": 998.2, "nu": 1.004e-6, "pv_kpa": 2.34},
    "Etanol a 20°C": {"rho": 789.0, "nu": 1.51e-6, "pv_kpa": 5.8}
}

# K Factors for Fittings (Local Losses)
K_FACTORS = {
    "Entrada de Borda Viva": 0.5,
    "Entrada Levemente Arredondada": 0.2,
    "Entrada Bem Arredondada": 0.04,
    "Saída de Tubulação": 1.0,
    "Válvula Gaveta (Totalmente Aberta)": 0.2,
    "Válvula Gaveta (1/2 Aberta)": 5.6,
    "Válvula Globo (Totalmente Aberta)": 10.0,
    "Válvula de Retenção (Tipo Portinhola)": 2.5,
    "Cotovelo 90° (Raio Longo)": 0.6,
    "Cotovelo 90° (Raio Curto)": 0.9,
    "Cotovelo 45°": 0.4,
    "Curva de Retorno 180°": 2.2,
    "Tê (Fluxo Direto)": 0.6,
    "Tê (Fluxo Lateral)": 1.8,
}
