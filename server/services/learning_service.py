
import logging
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session
import server.models as models
# LearningLog, Case, Patient accessed via models.*
from server.services.agent_service import USearchVectorStore, vector_store 
import google.generativeai as genai
import os
import json
import datetime
from typing import Optional

# Ensure API Key is set (already handled in main, but good practice)
if "GEMINI_API_KEY" not in os.environ:
    logging.warning("GEMINI_API_KEY not found in environment")

class LearningService:
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = vector_store # Global instance or injected
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp') 

    def predict_and_log(self, case_id: str, plan_text: str, patient_summary: str) -> str:
        """
        Predicts the outcome of a plan and logs it for future learning.
        Returns the prediction text.
        """
        prompt = f"""
        You are a cautious senior supervising physician.
        
        Patient Summary:
        {patient_summary}
        
        Proposed Plan:
        {plan_text}
        
        Task:
        Predict the likely clinical outcome of this plan. 
        Focus on potential risks, side effects, or failure modes.
        Be specific about what success looks like versus failure.
        
        Prediction:
        """
        
        try:
            response = self.model.generate_content(prompt)
            prediction = response.text
            
            # Create Log
            log = models.LearningLog(
                case_id=case_id,
                state_snapshot={"summary": patient_summary},
                action_plan=plan_text,
                predicted_outcome=prediction
            )
            self.db.add(log)
            self.db.commit()
            
            return prediction
        except Exception as e:
            logging.error(f"Prediction failed: {e}")
            return "Prediction unavailable."

    def record_outcome(self, log_id: str, actual_outcome: str) -> str:
        """
        Records the actual outcome, compares with prediction, and generates a lesson.
        Indexes the lesson for future retrieval.
        """
        log = self.db.query(models.LearningLog).filter(models.LearningLog.id == log_id).first()
        if not log:
            raise ValueError("Log not found")
            
        log.actual_outcome = actual_outcome
        
        # Generate Lesson
        prompt = f"""
        Analyze this clinical case to extract a generalized medical lesson.
        
        Context: {log.state_snapshot}
        Action: {log.action_plan}
        
        Predicted Outcome: {log.predicted_outcome}
        Actual Outcome: {actual_outcome}
        
        Task:
        Compare the prediction with the reality.
        If the outcome was successful and as predicted, state what worked well.
        If the outcome was unexpected or negative, identify the root cause.
        
        Format the output as a concise "Lesson" that can be retrieved to help future cases.
        Example: "When treating X with Y, ensure Z is checked, otherwise W may occur."
        
        Lesson:
        """
        
        try:
            response = self.model.generate_content(prompt)
            lesson = response.text
            log.lesson_learned = lesson
            self.db.commit()
            
            # Index Lesson
            # We index the lesson text, with metadata about the context so it matches similar future contexts
            metadata = {
                "type": "lesson",
                "case_id": log.case_id,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            # We embed the "Context + Action" to match future situations where we are considering similar actions
            # Or better, embed the Lesson itself?
            # If we want to retrieve this lesson when we are in a similar situation, we should embed the SITUATION.
            # "Context: ... Action: ..."
            
            index_text = f"Context: {log.state_snapshot} \n Action: {log.action_plan}"
            
            # Use a dummy user_id or 'system' for shared lessons? 
            # Or the patient's ID? Lessons should probably be global or at least specialist-scoped.
            # For this MVP, let's use a "system_knowledge" ID.
            
            # Wait, USearchVectorStore adds to index.
            # We need to ensure we can retrieve it.
            # Let's index it under a special user_id "SYSTEM_LEARNING".
            
            self.vector_store.add(
                user_id="SYSTEM_LEARNING",
                text=index_text, 
                metadata={**metadata, "lesson_content": lesson} # Store lesson in metadata to retrieve it
            )
            
            return lesson
        except Exception as e:
            logging.error(f"Lesson generation failed: {e}")
            return "Could not generate lesson."
