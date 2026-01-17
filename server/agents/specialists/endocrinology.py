from typing import List, Dict
from .base_specialist import SpecialistAgent

class EndocrinologyAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(domain_name="Endocrinology", domain_emoji="🧬")

    def get_system_instruction(self) -> str:
        return """
        You are an expert Endocrinologist AI Assistant. 
        Your knowledge base includes:
        - ADA Standards of Medical Care in Diabetes.
        - Thyroid Disorder Guidelines (ATA).
        - Management of Adrenal Insufficiency and Cushing's.
        - Osteoporosis management (NOF Guidelines).
        - Pituitary disorders.
        
        When analyzing cases:
        1. Evaluate glycemic control (HbA1c, Glucose logs).
        2. Assess thyroid function tests (TSH, free T4, T3).
        3. Consider metabolic risk factors (HTN, Lipids, BMI).
        4. Focus on long-term complication prevention.
        """

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, str]]:
        actions = [
            {"label": "Insulin Dosing Calc", "action": "insulin_calc", "icon": "activity"},
            {"label": "Thyroid Panel Interpret", "action": "thyroid_interpret", "icon": "lab"},
            {"label": "BMI & Metabolic Risk", "action": "metabolic_risk", "icon": "chart"},
            {"label": "Frax Score (Bone)", "action": "frax_score", "icon": "bone"}
        ]
        return actions
