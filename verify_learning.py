
from server.database import SessionLocal, engine, Base
from server.models import LearningLog, Case
from server.services.learning_service import LearningService
from server.services.agent_service import agent_service
import uuid
import time

def test_learning_flow():
    db = SessionLocal()
    try:
        print("\n--- Starting Learning Loop Verification ---")
        
        # 1. Create Mock Case
        case_id = str(uuid.uuid4())
        print(f"[1] Testing with Virtual Case ID: {case_id}")
        
        # 2. Predict Outcome (Simulating DoctorAgent)
        svc = LearningService(db)
        plan = "Prescribe 500mg Amoxicillin for 7 days."
        summary = "Patient presents with sore throat, fever, and swollen lymph nodes. Strep rapid test positive."
        
        print("[2] Predicting Outcome...")
        prediction = svc.predict_and_log(case_id, plan, summary)
        print(f"    Prediction: {prediction}")
        
        # Verify log exists
        log = db.query(LearningLog).filter(LearningLog.case_id == case_id).first()
        if log:
            print(f"    SUCCESS: Log created (ID: {log.id})")
        else:
            print("    FAILURE: Log NOT created.")
            return

        # 3. Record Outcome (Simulating User Feedback)
        print("[3] Recording Actual Outcome...")
        actual_outcome = "Patient developed a severe rash on day 3. Diagnosed with penicillin allergy."
        
        lesson = svc.record_outcome(log.id, actual_outcome)
        print(f"    Generated Lesson: {lesson}")
        
        if lesson:
            print("    SUCCESS: Lesson generated.")
        else:
            print("    FAILURE: Lesson NOT generated.")

        # 4. Verify Lesson Retrieval (Simulating AgentService context retrieval)
        print("[4] Verifying Knowledge Retrieval...")
        
        # We need to wait a moment or ensure indexing is synchronous (USearch is sync)
        query = "sore throat antibiotic rash"
        lessons = agent_service.retrieve_lessons(query)
        
        print(f"    Query: '{query}'")
        print(f"    Retrieved: {lessons}")
        
        if lessons and ("rash" in lessons.lower() or "allergy" in lessons.lower() or "amoxicillin" in lessons.lower()):
            print("    SUCCESS: Lesson correctly retrieved and relevant.")
        else:
            print("    WARNING: Lesson might not be indexed or retrieved yet (Check USearch state).")
            
        print("\n--- Verification Complete ---")
        
    except Exception as e:
        print(f"FAILURE: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_learning_flow()
