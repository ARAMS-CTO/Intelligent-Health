from .auth import router as auth_router
from .cases import router as cases_router
from .patients import router as patients_router
from .ai import router as ai_router
from .sharing import router as sharing_router
from .comments import router as comments_router
from .users import router as users_router
from .dashboard import router as dashboard_router
from .files import router as files_router
from .billing import router as billing_router
from .agent_bus import router as agent_bus_router
from .integrations import router as integrations_router
from .tokens import router as tokens_router
from .agents import router as agents_router
from .commerce import router as commerce_router
from .partners import router as partners_router
from .sdk import router as sdk_router
from .pharmacy import router as pharmacy_router
from .lab import router as lab_router
from .credits import router as credits_router
from .referrals import router as referrals_router

__all__ = ["auth_router", "cases_router", "patients_router", "comments_router", "ai_router", "agents_router", "billing_router", "files_router", "dashboard_router", "tokens_router", "integrations_router", "pharmacy_router", "lab_router", "credits_router", "referrals_router"]

def init_app(app):
    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
    app.include_router(cases_router, prefix="/api/cases", tags=["Cases"])
    app.include_router(patients_router, prefix="/api/patients", tags=["Patients"])
    app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
    app.include_router(comments_router, prefix="/api/comments", tags=["Comments"])
    app.include_router(users_router, prefix="/api", tags=["Users"])
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
    app.include_router(files_router, prefix="/api/files", tags=["Files"])
    app.include_router(billing_router, prefix="/api/billing", tags=["Billing"])
    app.include_router(agent_bus_router, prefix="/api/bus", tags=["AgentBus"])
    app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"])
    app.include_router(tokens_router, prefix="/api/tokens", tags=["Tokens"])
    app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
    app.include_router(sharing_router, prefix="/api/sharing", tags=["Sharing"])
    app.include_router(commerce_router) # Commerce router has its own prefix defined
    app.include_router(partners_router) # Partners router has its own prefix defined
    app.include_router(sdk_router) # SDK router has its own prefix defined
    app.include_router(pharmacy_router, prefix="/api/pharmacy", tags=["Pharmacy"])
    app.include_router(lab_router, prefix="/api/lab", tags=["Lab"])
    app.include_router(credits_router, prefix="/api/credits", tags=["Credits"])
    app.include_router(referrals_router, prefix="/api/referrals", tags=["Referrals"])
    
    from .webhooks import router as webhooks_router
    app.include_router(webhooks_router) # Prefix defined in router


