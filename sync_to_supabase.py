import json
import os
import requests
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ── Configuration ──────────────────────────────────────────────
RETAILCRM_SUBDOMAIN = os.getenv("RETAILCRM_SUBDOMAIN")
RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

RETAILCRM_BASE = f"https://{RETAILCRM_SUBDOMAIN}.retailcrm.ru/api/v5"


def check_config():
    missing = []
    if not RETAILCRM_SUBDOMAIN:
        missing.append("RETAILCRM_SUBDOMAIN")
    if not RETAILCRM_API_KEY:
        missing.append("RETAILCRM_API_KEY")
    if not SUPABASE_URL or SUPABASE_URL == "YOUR_SUPABASE_URL":
        missing.append("SUPABASE_URL")
    if not SUPABASE_KEY or SUPABASE_KEY == "YOUR_SUPABASE_SERVICE_ROLE_KEY":
        missing.append("SUPABASE_KEY")
    if missing:
        print(f"ERROR: Set these in .env: {', '.join(missing)}")
        sys.exit(1)


def fetch_all_orders():
    """Fetch all orders from RetailCRM with pagination."""
    all_orders = []
    page = 1

    while True:
        print(f"  Fetching page {page}...")
        resp = requests.get(
            f"{RETAILCRM_BASE}/orders",
            params={"apiKey": RETAILCRM_API_KEY, "limit": 100, "page": page},
        )
        data = resp.json()

        if not data.get("success"):
            print(f"  Error fetching orders: {data.get('errorMsg', data)}")
            break

        orders = data.get("orders", [])
        if not orders:
            break

        all_orders.extend(orders)
        total_pages = data.get("pagination", {}).get("totalPageCount", 1)
        if page >= total_pages:
            break
        page += 1

    return all_orders


def transform_order(order):
    """Transform a RetailCRM order into a Supabase row."""
    custom_fields = order.get("customFields", {})
    if isinstance(custom_fields, list):
        custom_fields = {}

    delivery = order.get("delivery", {})
    address = delivery.get("address", {})

    return {
        "id": order["id"],
        "number": order.get("number"),
        "order_type": order.get("orderType"),
        "order_method": order.get("orderMethod"),
        "status": order.get("status"),
        "created_at": order.get("createdAt"),
        "status_updated_at": order.get("statusUpdatedAt"),
        "first_name": order.get("firstName"),
        "last_name": order.get("lastName"),
        "phone": order.get("phone"),
        "email": order.get("email"),
        "delivery_city": address.get("city"),
        "delivery_address": address.get("text"),
        "total_summ": order.get("totalSumm"),
        "utm_source": custom_fields.get("utm_source"),
        "country_iso": order.get("countryIso"),
        "site": order.get("site"),
    }


def transform_items(order):
    """Transform RetailCRM order items into Supabase rows."""
    rows = []
    for item in order.get("items", []):
        offer = item.get("offer", {})
        # Use displayName or name from the offer
        product_name = offer.get("displayName") or offer.get("name") or "Unknown"

        rows.append({
            "id": item["id"],
            "order_id": order["id"],
            "product_name": product_name,
            "quantity": item.get("quantity"),
            "initial_price": item.get("initialPrice"),
            "discount_total": item.get("discountTotal", 0),
            "status": item.get("status"),
            "created_at": item.get("createdAt"),
        })
    return rows


def main():
    check_config()
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Fetch from RetailCRM
    print("Fetching orders from RetailCRM...")
    orders = fetch_all_orders()
    print(f"Fetched {len(orders)} orders.\n")

    if not orders:
        print("No orders to sync.")
        return

    # 2. Transform
    order_rows = [transform_order(o) for o in orders]
    item_rows = []
    for o in orders:
        item_rows.extend(transform_items(o))

    # 3. Upsert into Supabase (upsert = insert or update on conflict)
    print(f"Upserting {len(order_rows)} orders into Supabase...")
    sb.table("orders").upsert(order_rows).execute()

    print(f"Upserting {len(item_rows)} order items into Supabase...")
    sb.table("order_items").upsert(item_rows).execute()

    print(f"\nDone! Synced {len(order_rows)} orders with {len(item_rows)} items.")


if __name__ == "__main__":
    main()
