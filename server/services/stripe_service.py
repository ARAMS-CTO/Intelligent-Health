import stripe
from fastapi import HTTPException
from ..config import settings

class StripeService:
    def __init__(self):
        self.secret_key = settings.STRIPE_SECRET_KEY
        if not self.secret_key:
             # Use a mock or fail? Ideally fail if it's required, but preventing crash.
             # print("Warning: STRIPE_SECRET_KEY not set.")
             pass
        else:
            stripe.api_key = self.secret_key

    async def create_payment_intent(self, amount: float, currency: str = "usd"):
        """
        Creates a payment intent for the specified amount.
        Amount should be in cents.
        """
        if not self.secret_key:
             raise HTTPException(status_code=500, detail="Stripe is not configured")

        try:
            # Stripe expects integer cents
            amount_cents = int(amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                automatic_payment_methods={
                    'enabled': True,
                },
                payment_method_options={
                    "wechat_pay": {
                        "client": "web"
                    }
                }
            )
            return {"clientSecret": intent.client_secret, "id": intent.id}
        except Exception as e:
            print(f"Stripe Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def retrieve_payment_intent(self, id: str):
        if not self.secret_key:
             raise HTTPException(status_code=500, detail="Stripe is not configured")
        
        try:
            return stripe.PaymentIntent.retrieve(id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_connected_account(self, email: str):
        """
        Create a Stripe Connect account for a provider (e.g. Pharmacy, Insurance).
        """
        if not self.secret_key:
             raise HTTPException(status_code=500, detail="Stripe is not configured")
        
        try:
            account = stripe.Account.create(
                type="express",
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            return account
        except Exception as e:
             raise HTTPException(status_code=500, detail=str(e))

    async def create_account_link(self, account_id: str, refresh_url: str, return_url: str):
         try:
             link = stripe.AccountLink.create(
                 account=account_id,
                 refresh_url=refresh_url,
                 return_url=return_url,
                 type="account_onboarding"
             )
             return link
         except Exception as e:
             raise HTTPException(status_code=500, detail=str(e))

    async def transfer_funds(self, amount: float, destination_account_id: str):
         try:
             amount_cents = int(amount * 100)
             transfer = stripe.Transfer.create(
                 amount=amount_cents,
                 currency="usd",
                 destination=destination_account_id
             )
             return transfer
         except Exception as e:
             raise HTTPException(status_code=500, detail=str(e))
