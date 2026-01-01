from typing import Dict, Any, List

class BillingAgent:
    def check_insurance_eligibility(self, patient_id: str, procedure_code: str) -> Dict[str, Any]:
        """
        Mock verification of insurance.
        """
        # Mock logic
        approved = True
        copay = 50.0
        
        if "MRI" in procedure_code or "992" in procedure_code:
            # Randomize slightly for demo or keep static
            pass
        
        # Reject specific mock ID for demo
        if patient_id == "uninsured-123":
            approved = False
            copay = 0.0
            
        return {
            "eligible": approved,
            "status": "Active" if approved else "Inactive",
            "copay": copay,
            "covered_amount": 0.8 if approved else 0.0,
            "message": "Approved for service." if approved else "Patient coverage inactive or procedure not covered."
        }

billing_agent = BillingAgent()
