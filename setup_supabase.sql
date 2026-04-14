-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY,              -- RetailCRM order ID
    number TEXT,
    order_type TEXT,
    order_method TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    status_updated_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    delivery_city TEXT,
    delivery_address TEXT,
    total_summ NUMERIC,
    utm_source TEXT,
    country_iso TEXT,
    site TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY,              -- RetailCRM item ID
    order_id BIGINT REFERENCES orders(id),
    product_name TEXT,
    quantity INTEGER,
    initial_price NUMERIC,
    discount_total NUMERIC DEFAULT 0,
    status TEXT,
    created_at TIMESTAMPTZ
);
