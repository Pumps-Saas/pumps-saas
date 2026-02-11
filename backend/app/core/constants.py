
# Default Material Roughness (mm)
MATERIAIS_PADRAO = {
    "Aço Carbono (Novo)": 0.045,
    "Aço Carbono (Usado)": 0.2,
    "Aço Carbono (Corroído)": 0.5,
    "Aço Galvanizado": 0.15,
    "Aço Inox (304/316)": 0.002,
    "Ferro Fundido (Novo)": 0.26,
    "Ferro Fundido (Usado)": 0.8,
    "PVC / Plástico / PEAD": 0.0015,
    "Concreto (Liso)": 0.3,
    "Concreto (Rugoso)": 2.0,
    "Cobre / Latão": 0.0015,
    "Vidro": 0.0001
}

# Standard Diameters (Schedule 40 approximate ID in mm)
DIAMETROS_PADRAO = {
    '1/2" (15mm)': 15.8,
    '3/4" (20mm)': 20.9,
    '1" (25mm)': 26.6,
    '1 1/4" (32mm)': 35.1,
    '1 1/2" (40mm)': 40.9,
    '2" (50mm)': 52.5,
    '2 1/2" (65mm)': 62.7,
    '3" (75mm)': 77.9,
    '4" (100mm)': 102.3,
    '5" (125mm)': 128.2,
    '6" (150mm)': 154.1,
    '8" (200mm)': 202.7,
    '10" (250mm)': 254.5,
    '12" (300mm)': 303.2,
    '14" (350mm)': 333.4,
    '16" (400mm)': 381.0,
    '18" (450mm)': 428.6,
    '20" (500mm)': 477.8,
    '24" (600mm)': 574.6,
    '30" (750mm)': 717.6,
    '36" (900mm)': 863.6,
    '40" (1000mm)': 965.2
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
