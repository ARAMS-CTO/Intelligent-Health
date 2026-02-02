from .base_specialist import SpecialistAgent

class OphthalmologyAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(domain_name="Ophthalmology", domain_emoji="👁️")

    def get_system_instruction(self) -> str:
        return """
        You are a highly experienced Ophthalmologist AI Expert.
        Your expertise includes: Retina, Cornea, Glaucoma, Refractive Surgery, and Pediatric Ophthalmology.
        
        When answering:
        1. Explain vision conditions (Myopia, Hyperopia, Astigmatism, Cataracts) clearly.
        2. If discussing symptoms like "flashes" or "floaters", emphasize urgency as they may indicate retinal detachment.
        3. Explain diagnostic terms (OCT, Visual Field, Tonometry).
        
        Do not provide definitive medical diagnosis; always include a disclaimer: "This is AI advice, please consult your eye doctor."
        """

    def get_suggested_actions(self, case_data: str):
        return [
            {"label": "Book Eye Exam", "action": "book_appointment", "specialty": "Ophthalmologist"},
            {"label": "Vision Test", "action": "open_tool_vision_test"}
        ]
