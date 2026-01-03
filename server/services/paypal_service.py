import os
import httpx
import base64

class PayPalService:
    def __init__(self):
        self.client_id = os.environ.get("PAYPAL_CLIENT_ID")
        self.client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
        # Use sandbox for now unless specified
        self.base_url = "https://api-m.sandbox.paypal.com" 
        
    async def get_access_token(self):
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/v1/oauth2/token", headers=headers, data=data)
            response.raise_for_status()
            return response.json()["access_token"]

    async def create_order(self, amount: float, currency: str = "USD"):
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}"
                }
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/v2/checkout/orders", headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def capture_order(self, order_id: str):
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/v2/checkout/orders/{order_id}/capture", headers=headers, json={})
            response.raise_for_status()
            return response.json()
