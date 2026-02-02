import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import HealthIntegration, MedicalRecord, User
from .integrations.manager import IntegrationManager

logger = logging.getLogger("scheduler")

async def start_scheduler():
    """
    Background task to run periodic jobs.
    """
    logger.info("Scheduler started.")
    print("SCHEDULER: Background service started.")
    
    while True:
        try:
            # Run every 60 minutes
            # For demo purposes, we might want it faster, but let's stick to 60m
            await run_periodic_sync()
            await asyncio.sleep(3600) 
        except asyncio.CancelledError:
            logger.info("Scheduler cancelled.")
            break
        except Exception as e:
            logger.error(f"Scheduler Error: {e}")
            await asyncio.sleep(60) # Retry after 1 min on error

async def run_periodic_sync():
    print(f"SCHEDULER: Starting periodic sync at {datetime.utcnow()}")
    loop = asyncio.get_event_loop()
    try:
        # Run blocking DB work in a thread
        result = await loop.run_in_executor(None, sync_health_integrations_sync)
        if result:
             print("SCHEDULER: Sync completed successfully.")
        else:
             print("SCHEDULER: Sync check completed (no active integrations or error).")
    except Exception as e:
         print(f"SCHEDULER: Job Error: {e}")

def sync_health_integrations_sync() -> bool:
    """
    Synchronous wrapper for integration sync.
    """
    db = SessionLocal()
    try:
        # Logic from previous async function, adapted to sync
        integrations = db.query(HealthIntegration).filter(HealthIntegration.status == "active").all()
        if not integrations:
            return False
            
        count = 0
        for integ in integrations:
            try:
                # 1. Get Client
                client = IntegrationManager.get_client(integ.provider)
                
                # 3. Fetch Data (Today)
                try:
                    data = client.fetch_data(integ.access_token, "today")
                except ValueError as e:
                    if "401" in str(e) and integ.refresh_token:
                        print(f"SCHEDULER: Token expired for {integ.user_id}, refreshing...")
                        try:
                            new_tokens = client.refresh_token(integ.refresh_token)
                            integ.access_token = new_tokens.get("access_token")
                            if new_tokens.get("refresh_token"):
                                 integ.refresh_token = new_tokens.get("refresh_token")
                            db.commit()
                            
                            # Retry fetch
                            data = client.fetch_data(integ.access_token, "today")
                        except Exception as refresh_err:
                            print(f"SCHEDULER: Refresh failed: {refresh_err}")
                            continue
                    else:
                        raise e
    
                fhir_bundle = client.normalize_to_fhir(data)
                
                # 4. Save to DB
                saved_count = save_fhir_records(db, integ.user_id, integ.provider, fhir_bundle)
                
                # 5. Update Timestamp
                integ.last_sync_timestamp = datetime.utcnow()
                db.commit()
                
                count += saved_count
                print(f"SCHEDULER: Synced {saved_count} records for User {integ.user_id} ({integ.provider})")
                
            except Exception as ex:
                print(f"SCHEDULER: Failed to sync {integ.provider} for user {integ.user_id}: {ex}")
                continue
                
        return count > 0
    finally:
        db.close()

def save_fhir_records(db: Session, user_id: str, provider: str, bundle: list) -> int:
    from ..models import MedicalRecord
    import uuid
    
    saved = 0
    
    # Get Patient ID
    user = db.query(User).filter(User.id == user_id).first()
    patient_id = user.patient_profile.id if user and user.patient_profile else None
    
    for res in bundle:
        if res.get("resourceType") == "Observation":
             # Create unique ID to prevent dups
             val = res.get("valueQuantity", {}).get("value", 0)
             code = res.get("code", {}).get("text", "Unknown")
             date_str = res.get("effectiveDateTime", str(datetime.utcnow()))
             
             # Dedup ID: user + provider + code + date (approx)
             rec_id = f"auto-{provider}-{user_id}-{code}-{date_str[:13]}" # Hourly distinct
             
             existing = db.query(MedicalRecord).filter(MedicalRecord.id == rec_id).first()
             if existing:
                 continue
                 
             rec = MedicalRecord(
                 id=rec_id,
                 patient_id=patient_id,
                 uploader_id=user_id,
                 type="Vitals",
                 title=f"Auto-Sync: {code}",
                 content_text=f"Value: {val}\nSource: {provider}\nDate: {date_str}",
                 ai_summary=f"Synced {val} from {provider}",
                 metadata_={
                    "source": provider, 
                    "auto_sync": True,
                    "value": val,
                    "unit": res.get("valueQuantity", {}).get("unit", "")
                 }
             )
             db.add(rec)
             saved += 1
             
    if saved > 0:
        db.commit()
        
    return saved
