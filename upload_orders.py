import json
import os
import requests
import time
import sys
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ──────────────────────────────────────────────
RETAILCRM_SUBDOMAIN = os.getenv("RETAILCRM_SUBDOMAIN")
RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")

BASE_URL = f"https://{RETAILCRM_SUBDOMAIN}.retailcrm.ru/api/v5"

# ── Load mock orders ──────────────────────────────────────────
with open("mock_orders.json", "r", encoding="utf-8") as f:
    orders = json.load(f)

print(f"Loaded {len(orders)} orders from mock_orders.json")


def create_order(order_data):
    """Create a single order in RetailCRM via API v5."""
    order_payload = {
        "firstName": order_data["firstName"],
        "lastName": order_data["lastName"],
        "phone": order_data["phone"],
        "email": order_data["email"],
        "orderType": order_data["orderType"],
        "orderMethod": order_data["orderMethod"],
        "status": order_data["status"],
        "items": [
            {
                "offer": {"name": item["productName"]},
                "quantity": item["quantity"],
                "initialPrice": item["initialPrice"],
            }
            for item in order_data["items"]
        ],
        "delivery": {"address": order_data["delivery"]["address"]},
        "customFields": order_data.get("customFields", {}),
    }

    response = requests.post(
        f"{BASE_URL}/orders/create",
        data={
            "apiKey": RETAILCRM_API_KEY,
            "order": json.dumps(order_payload, ensure_ascii=False),
        },
    )
    return response


def main():
    if not RETAILCRM_SUBDOMAIN or not RETAILCRM_API_KEY:
        print("ERROR: Set RETAILCRM_SUBDOMAIN and RETAILCRM_API_KEY in the .env file.")
        sys.exit(1)

    success = 0
    errors = 0

    for i, order in enumerate(orders, start=1):
        name = f"{order['firstName']} {order['lastName']}"
        try:
            resp = create_order(order)
            result = resp.json()

            if result.get("success"):
                order_id = result.get("id", "?")
                print(f"[{i}/{len(orders)}] ✓ Order #{order_id} created — {name}")
                success += 1
            else:
                print(f"[{i}/{len(orders)}] ✗ Failed for {name}:")
                print(f"    Status: {resp.status_code}")
                print(f"    Response: {json.dumps(result, ensure_ascii=False, indent=2)}")
                errors += 1
        except Exception as e:
            print(f"[{i}/{len(orders)}] ✗ Exception for {name}: {e}")
            errors += 1

        # Rate-limit: RetailCRM allows ~10 req/s, stay safe
        time.sleep(0.15)

    print(f"\nDone. Success: {success}, Errors: {errors}")


if __name__ == "__main__":
    main()
