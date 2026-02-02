from ..knowledge_base.store import DomainKnowledgeBase

class ContinuousLearningService:
    
    @staticmethod
    def ingest_research(zone: str, text: str, source: str):
        """
        Ingest a new research paper or guideline into the specific domain vector store.
        """
        kb = DomainKnowledgeBase.get_instance(zone)
        kb.add_document(text, source, reliability=1.0)
        print(f"Ingested knowledge into {zone}: {source}")

    @staticmethod
    def learn_from_case(zone: str, case_id: str, resolution_notes: str):
        """
        Ingest a resolved case as a case study.
        """
        text = f"Case Study {case_id}: {resolution_notes}"
        kb = DomainKnowledgeBase.get_instance(zone)
        kb.add_document(text, f"Case {case_id}", reliability=0.8)

    def record_outcome(self, db, log_id: str, outcome: str):
        """
        Records the outcome of an agent action and derives a lesson.
        """
        from ..models import LearningLog
        log = db.query(LearningLog).filter(LearningLog.id == log_id).first()
        if log:
            log.outcome = outcome
            db.commit()
            return f"Outcome '{outcome}' recorded for Log {log_id}"
        return "Log not found"

    def predict_and_log(self, db, case_id: str, plan_text: str, summary: str):
        """
        Simulates outcome prediction and creates an initial Learning log.
        """
        from ..models import LearningLog
        import datetime
        import uuid
        
        # In a real system, this would use a predictive model.
        # Here we just log the plan as a prediction "pending validation".
        prediction = "Predicted effective with 85% confidence."
        
        log = LearningLog(
            id=str(uuid.uuid4()),
            case_id=case_id,
            action_taken=plan_text,
            predicted_outcome=prediction,
            outcome="Pending",
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        
        return prediction

    @staticmethod
    def export_training_data(domain: str = None, min_rating: float = 0.8):
        """
        Exports high-quality Q&A pairs for SLM fine-tuning.
        """
        from ..database import SessionLocal
        from ..models import TrainingDataset
        import json
        
        db = SessionLocal()
        try:
            query = db.query(TrainingDataset).filter(TrainingDataset.rating >= min_rating)
            if domain:
                query = query.filter(TrainingDataset.domain == domain)
            
            rows = query.all()
            export_data = []
            for r in rows:
                export_data.append({
                    "instruction": r.query,
                    "input": r.context_summary or "",
                    "output": r.response,
                    "domain": r.domain
                })
            
            return json.dumps(export_data, indent=2)
        finally:
            db.close()

learning_service = ContinuousLearningService()
