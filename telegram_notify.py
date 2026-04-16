import json
import os
import requests
import sys
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ──────────────────────────────────────────────
RETAILCRM_SUBDOMAIN = os.getenv("RETAILCRM_SUBDOMAIN")
RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

RETAILCRM_BASE = f"https://{RETAILCRM_SUBDOMAIN}.retailcrm.ru/api/v5"
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
THRESHOLD = 50000  # KZT


def check_config():
    missing = []
    for name, val in [
        ("RETAILCRM_SUBDOMAIN", RETAILCRM_SUBDOMAIN),
        ("RETAILCRM_API_KEY", RETAILCRM_API_KEY),
        ("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN),
        ("TELEGRAM_CHAT_ID", TELEGRAM_CHAT_ID),
    ]:
        if not val or val.startswith("YOUR_"):
            missing.append(name)
    if missing:
        print(f"ERROR: Set these in .env: {', '.join(missing)}")
        sys.exit(1)


def send_telegram(text):
    """Send a message via Telegram Bot API."""
    resp = requests.post(
        f"{TELEGRAM_API}/sendMessage",
        json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
        },
    )
    return resp.json()


def fetch_recent_orders():
    """Fetch orders from RetailCRM."""
    resp = requests.get(
        f"{RETAILCRM_BASE}/orders",
        params={"apiKey": RETAILCRM_API_KEY, "limit": 100},
    )
    data = resp.json()
    if not data.get("success"):
        print(f"Error fetching orders: {data.get('errorMsg', data)}")
        return []
    return data.get("orders", [])


# Track which orders we've already notified about
NOTIFIED_FILE = "notified_orders.json"


def load_notified():
    if os.path.exists(NOTIFIED_FILE):
        with open(NOTIFIED_FILE, "r") as f:
            return set(json.load(f))
    return set()


def save_notified(ids):
    with open(NOTIFIED_FILE, "w") as f:
        json.dump(list(ids), f)


def main():
    check_config()

    notified = load_notified()
    orders = fetch_recent_orders()

    big_orders = [
        o for o in orders
        if o.get("totalSumm", 0) > THRESHOLD and o["id"] not in notified
    ]

    if not big_orders:
        print("No new orders above 50,000 KZT.")
        return

    print(f"Found {len(big_orders)} new order(s) above {THRESHOLD:,} KZT")

    for o in big_orders:
        name = f"{o.get('firstName', '')} {o.get('lastName', '')}".strip()
        city = o.get("delivery", {}).get("address", {}).get("city", "—")
        total = o.get("totalSumm", 0)

        text = (
            f"🔔 <b>Large order #{o['id']}</b>\n"
            f"👤 {name}\n"
            f"📍 {city}\n"
            f"💰 {total:,.0f} KZT"
        )

        result = send_telegram(text)
        if result.get("ok"):
            print(f"  ✓ Notified about order #{o['id']} ({total:,.0f} KZT)")
            notified.add(o["id"])
        else:
            print(f"  ✗ Failed to send for order #{o['id']}: {result}")

    save_notified(notified)
    print("Done.")


if __name__ == "__main__":
    main()
