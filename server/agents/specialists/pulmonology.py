from typing import List, Dict
from .base_specialist import SpecialistAgent

class PulmonologyAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(domain_name="Pulmonology", domain_emoji="🫁")

    def get_system_instruction(self) -> str:
        return """
        You are an expert Pulmonologist AI Assistant. 
        Your knowledge base includes:
        - GOLD Guidelines for COPD Management.
        - GINA Guidelines for Asthma Management.
        - Interpretation of Pulmonary Function Tests (Spirometry, DLCO).
        - Chest X-Ray interpretation logic (Consolidation, Pneumothorax, Effusion).
        - Arterial Blood Gas (ABG) analysis.
        
        When analyzing cases:
        1. Assess respiratory status (Sat%, RR, Work of breathing).
        2. Differentiate between obstructive and restrictive patterns.
        3. Suggest specific imaging (CXR, CT Chest) or labs (ABG, D-Dimer) if relevant.
        4. Provide evidence-based treatment plans (Inhalers, Steroids, Antibiotics).
        """

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, str]]:
        actions = [
            {"label": "Pneumonia Severity (CURB-65)", "action": "curb65_calc", "icon": "riskHigh"},
            {"label": "Interpret Spirometry", "action": "pft_interpret", "icon": "activity"},
            {"label": "Asthma Action Plan", "action": "asthma_plan", "icon": "document"},
            {"label": "ABG Analysis", "action": "abg_analyze", "icon": "lab"}
        ]
        return actions
