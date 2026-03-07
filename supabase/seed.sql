-- ============================================================
-- NorthLens Demo Seed Data
-- Realistic Canadian competitive intelligence for "Northern Outfitters"
-- ============================================================

-- NOTE: This seed file assumes a demo user already exists in auth.users.
-- When running locally, create a user via Supabase Auth UI or the dashboard,
-- then replace the UUID below with that user's ID.
-- For development, we use a fixed UUID that the trigger will auto-create a profile for.

-- ============================================================
-- DEMO USER PROFILE
-- ============================================================
-- We update the auto-created profile with business details.
-- The demo user UUID must match an existing auth.users row.
-- For local dev, insert a test user first:
--   INSERT INTO auth.users (id, email) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'demo@northlens.ca');

DO $$
DECLARE
    demo_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    pipeline_jackets UUID := 'p0000001-0000-0000-0000-000000000001';
    pipeline_reviews UUID := 'p0000002-0000-0000-0000-000000000002';
    pipeline_news UUID := 'p0000003-0000-0000-0000-000000000003';
    import_products UUID := 'i0000001-0000-0000-0000-000000000001';
    dashboard_main UUID := 'd0000001-0000-0000-0000-000000000001';
    alert_price_drop UUID := 'al000001-0000-0000-0000-000000000001';
    alert_new_product UUID := 'al000002-0000-0000-0000-000000000002';
    chat_demo UUID := 'ch000001-0000-0000-0000-000000000001';
    -- Record UUIDs for jacket records (used in versions and alerts)
    rec_1 UUID; rec_2 UUID; rec_3 UUID; rec_4 UUID; rec_5 UUID;
    rec_6 UUID; rec_7 UUID; rec_8 UUID; rec_9 UUID; rec_10 UUID;
    rec_11 UUID; rec_12 UUID; rec_13 UUID; rec_14 UUID; rec_15 UUID;
    rec_16 UUID; rec_17 UUID; rec_18 UUID; rec_19 UUID; rec_20 UUID;
    rec_21 UUID; rec_22 UUID; rec_23 UUID; rec_24 UUID; rec_25 UUID;
    rec_26 UUID; rec_27 UUID; rec_28 UUID;
    -- Widget UUIDs
    w1 UUID; w2 UUID; w3 UUID; w4 UUID; w5 UUID; w6 UUID;
BEGIN

-- Generate record UUIDs
rec_1 := 'r0000001-0000-0000-0000-000000000001';
rec_2 := 'r0000002-0000-0000-0000-000000000002';
rec_3 := 'r0000003-0000-0000-0000-000000000003';
rec_4 := 'r0000004-0000-0000-0000-000000000004';
rec_5 := 'r0000005-0000-0000-0000-000000000005';
rec_6 := 'r0000006-0000-0000-0000-000000000006';
rec_7 := 'r0000007-0000-0000-0000-000000000007';
rec_8 := 'r0000008-0000-0000-0000-000000000008';
rec_9 := 'r0000009-0000-0000-0000-000000000009';
rec_10 := 'r0000010-0000-0000-0000-000000000010';
rec_11 := 'r0000011-0000-0000-0000-000000000011';
rec_12 := 'r0000012-0000-0000-0000-000000000012';
rec_13 := 'r0000013-0000-0000-0000-000000000013';
rec_14 := 'r0000014-0000-0000-0000-000000000014';
rec_15 := 'r0000015-0000-0000-0000-000000000015';
rec_16 := 'r0000016-0000-0000-0000-000000000016';
rec_17 := 'r0000017-0000-0000-0000-000000000017';
rec_18 := 'r0000018-0000-0000-0000-000000000018';
rec_19 := 'r0000019-0000-0000-0000-000000000019';
rec_20 := 'r0000020-0000-0000-0000-000000000020';
rec_21 := 'r0000021-0000-0000-0000-000000000021';
rec_22 := 'r0000022-0000-0000-0000-000000000022';
rec_23 := 'r0000023-0000-0000-0000-000000000023';
rec_24 := 'r0000024-0000-0000-0000-000000000024';
rec_25 := 'r0000025-0000-0000-0000-000000000025';
rec_26 := 'r0000026-0000-0000-0000-000000000026';
rec_27 := 'r0000027-0000-0000-0000-000000000027';
rec_28 := 'r0000028-0000-0000-0000-000000000028';

-- Widget UUIDs
w1 := 'w0000001-0000-0000-0000-000000000001';
w2 := 'w0000002-0000-0000-0000-000000000002';
w3 := 'w0000003-0000-0000-0000-000000000003';
w4 := 'w0000004-0000-0000-0000-000000000004';
w5 := 'w0000005-0000-0000-0000-000000000005';
w6 := 'w0000006-0000-0000-0000-000000000006';

-- ============================================================
-- Insert demo user into auth.users (if not exists)
-- ============================================================
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token,
    raw_app_meta_data, raw_user_meta_data
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    demo_user_id,
    'authenticated',
    'authenticated',
    'demo@northlens.ca',
    crypt('demodemo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Demo User"}'
)
ON CONFLICT (id) DO NOTHING;

-- Update profile (trigger should have created it)
UPDATE public.profiles SET
    email = 'demo@northlens.ca',
    business_name = 'Northern Outfitters',
    business_type = 'ecommerce',
    industry = 'Outdoor & Winter Apparel',
    location = 'Waterloo, ON',
    province = 'Ontario',
    website_url = 'https://northernoutfitters.ca',
    business_profile = '{
        "goals": ["Track competitor pricing", "Monitor industry trends", "Find pricing opportunities"],
        "competitors": ["Canadian Tire", "MEC", "Altitude Sports", "Sport Chek"],
        "product_categories": ["Winter Jackets", "Snow Pants", "Boots", "Accessories"],
        "price_range": {"min": 89, "max": 599},
        "notes": "Focus on mid-range outdoor apparel for Canadian winters"
    }'::jsonb,
    plan = 'pro',
    onboarding_complete = TRUE,
    updated_at = NOW()
WHERE id = demo_user_id;

-- ============================================================
-- PIPELINE 1: Winter Jacket Prices (28 records from 3 competitors)
-- ============================================================
INSERT INTO public.pipelines (id, user_id, name, description, prompt, schema, sources, extraction_mode, schedule, status, last_run_at, last_run_status, record_count, created_at)
VALUES (
    pipeline_jackets,
    demo_user_id,
    'Winter Jacket Prices',
    'Track winter jacket prices across major Canadian retailers',
    'Extract winter jacket product listings including name, brand, price in CAD, rating, and product URL from Canadian outdoor retailers',
    '[
        {"name": "product_name", "type": "string", "description": "Full product name"},
        {"name": "brand", "type": "string", "description": "Brand name"},
        {"name": "price", "type": "number", "description": "Price in CAD"},
        {"name": "original_price", "type": "number", "description": "Original price before discount"},
        {"name": "rating", "type": "number", "description": "Customer rating out of 5"},
        {"name": "review_count", "type": "number", "description": "Number of reviews"},
        {"name": "category", "type": "string", "description": "Product category"},
        {"name": "retailer", "type": "string", "description": "Retailer name"},
        {"name": "url", "type": "url", "description": "Product page URL"}
    ]'::jsonb,
    '[
        {"url": "https://www.canadiantire.ca/en/outdoor/winter-jackets", "label": "Canadian Tire", "enabled": true},
        {"url": "https://www.mec.ca/en/products/clothing/jackets", "label": "MEC", "enabled": true},
        {"url": "https://www.altitude-sports.com/collections/winter-jackets", "label": "Altitude Sports", "enabled": true}
    ]'::jsonb,
    'list',
    'daily',
    'active',
    NOW() - INTERVAL '2 hours',
    'completed',
    28,
    NOW() - INTERVAL '14 days'
);

-- ============================================================
-- 28 Jacket Records — Canadian Tire (10), MEC (10), Altitude Sports (8)
-- ============================================================

-- Canadian Tire jackets
INSERT INTO public.records (id, pipeline_id, user_id, data, content_hash, source_url, version, is_latest, first_seen_at, last_updated_at, created_at) VALUES
(rec_1, pipeline_jackets, demo_user_id, '{"product_name": "Woods Expedition Down Parka", "brand": "Woods", "price": 349.99, "original_price": 449.99, "rating": 4.3, "review_count": 187, "category": "Down Parkas", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/woods-expedition-down-parka-0871234p.html"}', 'hash_ct_001', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 2, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 days'),
(rec_2, pipeline_jackets, demo_user_id, '{"product_name": "Outbound Thermolite Winter Jacket", "brand": "Outbound", "price": 179.99, "original_price": 179.99, "rating": 4.1, "review_count": 93, "category": "Insulated Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/outbound-thermolite-0871456p.html"}', 'hash_ct_002', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_3, pipeline_jackets, demo_user_id, '{"product_name": "McKinley Whistler II 3-in-1 Jacket", "brand": "McKinley", "price": 259.99, "original_price": 299.99, "rating": 4.5, "review_count": 241, "category": "3-in-1 Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/mckinley-whistler-0871789p.html"}', 'hash_ct_003', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_4, pipeline_jackets, demo_user_id, '{"product_name": "Helly Hansen Alpha 3.0 Jacket", "brand": "Helly Hansen", "price": 399.99, "original_price": 399.99, "rating": 4.7, "review_count": 156, "category": "Ski Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/hh-alpha-3-0871999p.html"}', 'hash_ct_004', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_5, pipeline_jackets, demo_user_id, '{"product_name": "Columbia Bugaboo II Interchange Jacket", "brand": "Columbia", "price": 219.99, "original_price": 279.99, "rating": 4.4, "review_count": 312, "category": "3-in-1 Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/columbia-bugaboo-0872111p.html"}', 'hash_ct_005', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 2, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '14 days'),
(rec_6, pipeline_jackets, demo_user_id, '{"product_name": "Woods Tremblant Softshell Jacket", "brand": "Woods", "price": 149.99, "original_price": 149.99, "rating": 4.0, "review_count": 67, "category": "Softshell Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/woods-tremblant-0872333p.html"}', 'hash_ct_006', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_7, pipeline_jackets, demo_user_id, '{"product_name": "North Face McMurdo Parka III", "brand": "The North Face", "price": 449.99, "original_price": 499.99, "rating": 4.8, "review_count": 428, "category": "Down Parkas", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/tnf-mcmurdo-0872555p.html"}', 'hash_ct_007', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 2, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '14 days'),
(rec_8, pipeline_jackets, demo_user_id, '{"product_name": "Outbound Heated Vest", "brand": "Outbound", "price": 129.99, "original_price": 159.99, "rating": 3.9, "review_count": 45, "category": "Heated Apparel", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/outbound-heated-0872777p.html"}', 'hash_ct_008', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(rec_9, pipeline_jackets, demo_user_id, '{"product_name": "Woods Algonquin Down Jacket", "brand": "Woods", "price": 289.99, "original_price": 289.99, "rating": 4.2, "review_count": 134, "category": "Down Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/woods-algonquin-0872999p.html"}', 'hash_ct_009', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_10, pipeline_jackets, demo_user_id, '{"product_name": "Firefly Rocket Youth Jacket", "brand": "Firefly", "price": 89.99, "original_price": 119.99, "rating": 4.6, "review_count": 78, "category": "Youth Jackets", "retailer": "Canadian Tire", "url": "https://www.canadiantire.ca/en/pdp/firefly-rocket-0873111p.html"}', 'hash_ct_010', 'https://www.canadiantire.ca/en/outdoor/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- MEC jackets
INSERT INTO public.records (id, pipeline_id, user_id, data, content_hash, source_url, version, is_latest, first_seen_at, last_updated_at, created_at) VALUES
(rec_11, pipeline_jackets, demo_user_id, '{"product_name": "MEC Tremblant Insulated Jacket", "brand": "MEC", "price": 219.95, "original_price": 219.95, "rating": 4.4, "review_count": 203, "category": "Insulated Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/mec-tremblant-insulated-jacket"}', 'hash_mec_001', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_12, pipeline_jackets, demo_user_id, '{"product_name": "Arc''teryx Atom AR Hoody", "brand": "Arc''teryx", "price": 379.95, "original_price": 379.95, "rating": 4.9, "review_count": 567, "category": "Insulated Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/arcteryx-atom-ar-hoody"}', 'hash_mec_002', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_13, pipeline_jackets, demo_user_id, '{"product_name": "Patagonia Tres 3-in-1 Parka", "brand": "Patagonia", "price": 499.95, "original_price": 599.95, "rating": 4.6, "review_count": 189, "category": "3-in-1 Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/patagonia-tres-3in1-parka"}', 'hash_mec_003', 'https://www.mec.ca/en/products/clothing/jackets', 2, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '14 days'),
(rec_14, pipeline_jackets, demo_user_id, '{"product_name": "MEC Nordique Down Parka", "brand": "MEC", "price": 349.95, "original_price": 349.95, "rating": 4.5, "review_count": 312, "category": "Down Parkas", "retailer": "MEC", "url": "https://www.mec.ca/en/product/mec-nordique-down-parka"}', 'hash_mec_004', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_15, pipeline_jackets, demo_user_id, '{"product_name": "Fjällräven Expedition Down Jacket", "brand": "Fjällräven", "price": 549.95, "original_price": 549.95, "rating": 4.7, "review_count": 98, "category": "Down Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/fjallraven-expedition-down"}', 'hash_mec_005', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(rec_16, pipeline_jackets, demo_user_id, '{"product_name": "MEC Chinook Windproof Jacket", "brand": "MEC", "price": 159.95, "original_price": 159.95, "rating": 4.2, "review_count": 145, "category": "Windproof Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/mec-chinook-windproof"}', 'hash_mec_006', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_17, pipeline_jackets, demo_user_id, '{"product_name": "Mountain Hardwear Stretchdown Plus Hooded", "brand": "Mountain Hardwear", "price": 329.95, "original_price": 329.95, "rating": 4.3, "review_count": 76, "category": "Down Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/mhw-stretchdown-plus"}', 'hash_mec_007', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_18, pipeline_jackets, demo_user_id, '{"product_name": "The North Face Thermoball Eco Hoodie", "brand": "The North Face", "price": 269.95, "original_price": 269.95, "rating": 4.5, "review_count": 234, "category": "Insulated Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/tnf-thermoball-eco-hoodie"}', 'hash_mec_008', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_19, pipeline_jackets, demo_user_id, '{"product_name": "Outdoor Research Stormbound Jacket", "brand": "Outdoor Research", "price": 299.95, "original_price": 349.95, "rating": 4.4, "review_count": 112, "category": "Ski Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/or-stormbound-jacket"}', 'hash_mec_009', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(rec_20, pipeline_jackets, demo_user_id, '{"product_name": "Rab Microlight Alpine Down Jacket", "brand": "Rab", "price": 319.95, "original_price": 319.95, "rating": 4.6, "review_count": 167, "category": "Down Jackets", "retailer": "MEC", "url": "https://www.mec.ca/en/product/rab-microlight-alpine"}', 'hash_mec_010', 'https://www.mec.ca/en/products/clothing/jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- Altitude Sports jackets
INSERT INTO public.records (id, pipeline_id, user_id, data, content_hash, source_url, version, is_latest, first_seen_at, last_updated_at, created_at) VALUES
(rec_21, pipeline_jackets, demo_user_id, '{"product_name": "Canada Goose Expedition Parka", "brand": "Canada Goose", "price": 1395.00, "original_price": 1395.00, "rating": 4.8, "review_count": 623, "category": "Down Parkas", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/canada-goose-expedition-parka"}', 'hash_alt_001', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_22, pipeline_jackets, demo_user_id, '{"product_name": "Mackage Edward Down Jacket", "brand": "Mackage", "price": 890.00, "original_price": 890.00, "rating": 4.5, "review_count": 89, "category": "Down Jackets", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/mackage-edward-down"}', 'hash_alt_002', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_23, pipeline_jackets, demo_user_id, '{"product_name": "Nobis Yatesy Parka", "brand": "Nobis", "price": 995.00, "original_price": 995.00, "rating": 4.7, "review_count": 134, "category": "Down Parkas", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/nobis-yatesy-parka"}', 'hash_alt_003', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_24, pipeline_jackets, demo_user_id, '{"product_name": "Quartz Co. Champlain Down Jacket", "brand": "Quartz Co.", "price": 575.00, "original_price": 650.00, "rating": 4.6, "review_count": 78, "category": "Down Jackets", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/quartz-champlain"}', 'hash_alt_004', 'https://www.altitude-sports.com/collections/winter-jackets', 2, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '14 days'),
(rec_25, pipeline_jackets, demo_user_id, '{"product_name": "Kanuk Mont-Royal Parka", "brand": "Kanuk", "price": 725.00, "original_price": 725.00, "rating": 4.4, "review_count": 56, "category": "Down Parkas", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/kanuk-mont-royal"}', 'hash_alt_005', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(rec_26, pipeline_jackets, demo_user_id, '{"product_name": "Moose Knuckles Ballistic Bomber", "brand": "Moose Knuckles", "price": 850.00, "original_price": 850.00, "rating": 4.3, "review_count": 167, "category": "Bombers", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/moose-knuckles-ballistic"}', 'hash_alt_006', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(rec_27, pipeline_jackets, demo_user_id, '{"product_name": "Soia & Kyo Maddison Wool Coat", "brand": "Soia & Kyo", "price": 450.00, "original_price": 550.00, "rating": 4.5, "review_count": 92, "category": "Wool Coats", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/soia-kyo-maddison"}', 'hash_alt_007', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(rec_28, pipeline_jackets, demo_user_id, '{"product_name": "Rudsak Misha Leather Down Jacket", "brand": "Rudsak", "price": 695.00, "original_price": 695.00, "rating": 4.2, "review_count": 43, "category": "Leather Jackets", "retailer": "Altitude Sports", "url": "https://www.altitude-sports.com/products/rudsak-misha"}', 'hash_alt_008', 'https://www.altitude-sports.com/collections/winter-jackets', 1, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- ============================================================
-- RECORD VERSIONS (price changes over the last 2 weeks)
-- ============================================================
INSERT INTO public.record_versions (id, record_id, pipeline_id, version, old_data, new_data, changed_fields, change_summary, detected_at) VALUES
-- Woods Expedition Down Parka: price dropped from $399.99 to $349.99
(uuid_generate_v4(), rec_1, pipeline_jackets, 2,
 '{"product_name": "Woods Expedition Down Parka", "brand": "Woods", "price": 399.99, "original_price": 449.99, "rating": 4.3, "review_count": 182, "category": "Down Parkas", "retailer": "Canadian Tire"}',
 '{"product_name": "Woods Expedition Down Parka", "brand": "Woods", "price": 349.99, "original_price": 449.99, "rating": 4.3, "review_count": 187, "category": "Down Parkas", "retailer": "Canadian Tire"}',
 ARRAY['price', 'review_count'],
 'Price dropped from $399.99 to $349.99 (-12.5%). Review count increased by 5.',
 NOW() - INTERVAL '3 days'),

-- Columbia Bugaboo: price dropped from $249.99 to $219.99
(uuid_generate_v4(), rec_5, pipeline_jackets, 2,
 '{"product_name": "Columbia Bugaboo II Interchange Jacket", "brand": "Columbia", "price": 249.99, "original_price": 279.99, "rating": 4.4, "review_count": 305, "category": "3-in-1 Jackets", "retailer": "Canadian Tire"}',
 '{"product_name": "Columbia Bugaboo II Interchange Jacket", "brand": "Columbia", "price": 219.99, "original_price": 279.99, "rating": 4.4, "review_count": 312, "category": "3-in-1 Jackets", "retailer": "Canadian Tire"}',
 ARRAY['price', 'review_count'],
 'Price dropped from $249.99 to $219.99 (-12.0%). Review count increased by 7.',
 NOW() - INTERVAL '5 days'),

-- North Face McMurdo: price dropped from $499.99 to $449.99
(uuid_generate_v4(), rec_7, pipeline_jackets, 2,
 '{"product_name": "North Face McMurdo Parka III", "brand": "The North Face", "price": 499.99, "original_price": 499.99, "rating": 4.8, "review_count": 420, "category": "Down Parkas", "retailer": "Canadian Tire"}',
 '{"product_name": "North Face McMurdo Parka III", "brand": "The North Face", "price": 449.99, "original_price": 499.99, "rating": 4.8, "review_count": 428, "category": "Down Parkas", "retailer": "Canadian Tire"}',
 ARRAY['price', 'original_price', 'review_count'],
 'Price dropped from $499.99 to $449.99 (-10.0%). Now shows original price. Reviews up by 8.',
 NOW() - INTERVAL '2 days'),

-- Patagonia Tres: price dropped from $599.95 to $499.95
(uuid_generate_v4(), rec_13, pipeline_jackets, 2,
 '{"product_name": "Patagonia Tres 3-in-1 Parka", "brand": "Patagonia", "price": 599.95, "original_price": 599.95, "rating": 4.6, "review_count": 185, "category": "3-in-1 Jackets", "retailer": "MEC"}',
 '{"product_name": "Patagonia Tres 3-in-1 Parka", "brand": "Patagonia", "price": 499.95, "original_price": 599.95, "rating": 4.6, "review_count": 189, "category": "3-in-1 Jackets", "retailer": "MEC"}',
 ARRAY['price', 'review_count'],
 'Price dropped from $599.95 to $499.95 (-16.7%). Major sale detected.',
 NOW() - INTERVAL '4 days'),

-- Quartz Co. Champlain: price dropped from $650 to $575
(uuid_generate_v4(), rec_24, pipeline_jackets, 2,
 '{"product_name": "Quartz Co. Champlain Down Jacket", "brand": "Quartz Co.", "price": 650.00, "original_price": 650.00, "rating": 4.6, "review_count": 75, "category": "Down Jackets", "retailer": "Altitude Sports"}',
 '{"product_name": "Quartz Co. Champlain Down Jacket", "brand": "Quartz Co.", "price": 575.00, "original_price": 650.00, "rating": 4.6, "review_count": 78, "category": "Down Jackets", "retailer": "Altitude Sports"}',
 ARRAY['price', 'review_count'],
 'Price dropped from $650.00 to $575.00 (-11.5%). Now on sale.',
 NOW() - INTERVAL '6 days'),

-- Additional version: rating change
(uuid_generate_v4(), rec_12, pipeline_jackets, 1,
 NULL,
 '{"product_name": "Arc''teryx Atom AR Hoody", "brand": "Arc''teryx", "price": 379.95, "original_price": 379.95, "rating": 4.9, "review_count": 567, "category": "Insulated Jackets", "retailer": "MEC"}',
 ARRAY['review_count'],
 'Initial record captured. Premium product with highest rating in dataset.',
 NOW() - INTERVAL '14 days');

-- ============================================================
-- PIPELINE 2: Competitor Reviews
-- ============================================================
INSERT INTO public.pipelines (id, user_id, name, description, prompt, schema, sources, extraction_mode, schedule, status, last_run_at, last_run_status, record_count, created_at)
VALUES (
    pipeline_reviews,
    demo_user_id,
    'Competitor Reviews',
    'Monitor customer reviews and sentiment for competing outdoor brands',
    'Extract recent customer reviews including rating, review text, pros, cons, and reviewer location for winter jackets from Canadian retailers',
    '[
        {"name": "product_name", "type": "string", "description": "Product being reviewed"},
        {"name": "reviewer", "type": "string", "description": "Reviewer name or handle"},
        {"name": "rating", "type": "number", "description": "Rating out of 5"},
        {"name": "review_text", "type": "string", "description": "Review content"},
        {"name": "pros", "type": "string", "description": "Positive aspects mentioned"},
        {"name": "cons", "type": "string", "description": "Negative aspects mentioned"},
        {"name": "location", "type": "string", "description": "Reviewer location"},
        {"name": "date", "type": "date", "description": "Review date"}
    ]'::jsonb,
    '[
        {"url": "https://www.mec.ca/en/reviews/winter-jackets", "label": "MEC Reviews", "enabled": true}
    ]'::jsonb,
    'list',
    'weekly',
    'active',
    NOW() - INTERVAL '1 day',
    'completed',
    0,
    NOW() - INTERVAL '10 days'
);

-- ============================================================
-- PIPELINE 3: Industry News
-- ============================================================
INSERT INTO public.pipelines (id, user_id, name, description, prompt, schema, sources, extraction_mode, schedule, status, last_run_at, last_run_status, record_count, created_at)
VALUES (
    pipeline_news,
    demo_user_id,
    'Industry News & Trends',
    'Track outdoor apparel industry news and market trends in Canada',
    'Extract news articles about the Canadian outdoor apparel industry, including headlines, summaries, publication date, and source',
    '[
        {"name": "headline", "type": "string", "description": "Article headline"},
        {"name": "summary", "type": "string", "description": "Brief summary"},
        {"name": "source", "type": "string", "description": "Publication name"},
        {"name": "date", "type": "date", "description": "Publication date"},
        {"name": "url", "type": "url", "description": "Article URL"},
        {"name": "relevance", "type": "string", "description": "Relevance to outdoor apparel"}
    ]'::jsonb,
    '[
        {"url": "https://www.retailcouncil.org/industry-news", "label": "Retail Council of Canada", "enabled": true}
    ]'::jsonb,
    'daily',
    'active',
    NOW() - INTERVAL '6 hours',
    'completed',
    0,
    NOW() - INTERVAL '7 days'
);

-- ============================================================
-- DATA IMPORT: Our Products (CSV import simulation)
-- ============================================================
INSERT INTO public.data_imports (id, user_id, name, source_type, schema, record_count, created_at)
VALUES (
    import_products,
    demo_user_id,
    'Northern Outfitters Product Catalog',
    'csv',
    '[
        {"name": "sku", "type": "string", "description": "Product SKU"},
        {"name": "product_name", "type": "string", "description": "Product name"},
        {"name": "category", "type": "string", "description": "Product category"},
        {"name": "our_price", "type": "number", "description": "Our selling price in CAD"},
        {"name": "cost", "type": "number", "description": "Cost price in CAD"},
        {"name": "margin_pct", "type": "number", "description": "Profit margin percentage"},
        {"name": "stock_qty", "type": "number", "description": "Current stock quantity"},
        {"name": "monthly_sales", "type": "number", "description": "Units sold last month"}
    ]'::jsonb,
    15,
    NOW() - INTERVAL '12 days'
);

-- 15 import records for our products
INSERT INTO public.import_records (id, import_id, user_id, data, created_at) VALUES
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-001", "product_name": "Northern Shield Down Parka", "category": "Down Parkas", "our_price": 379.99, "cost": 185.00, "margin_pct": 51.3, "stock_qty": 45, "monthly_sales": 28}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-002", "product_name": "Northern Expedition 3-in-1", "category": "3-in-1 Jackets", "our_price": 299.99, "cost": 142.00, "margin_pct": 52.7, "stock_qty": 62, "monthly_sales": 41}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-003", "product_name": "Tundra Softshell Jacket", "category": "Softshell Jackets", "our_price": 169.99, "cost": 78.00, "margin_pct": 54.1, "stock_qty": 89, "monthly_sales": 53}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-004", "product_name": "Arctic Blast Insulated Jacket", "category": "Insulated Jackets", "our_price": 249.99, "cost": 115.00, "margin_pct": 54.0, "stock_qty": 37, "monthly_sales": 22}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-005", "product_name": "Cascade Ski Jacket", "category": "Ski Jackets", "our_price": 349.99, "cost": 168.00, "margin_pct": 52.0, "stock_qty": 28, "monthly_sales": 19}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-006", "product_name": "Boreal Down Vest", "category": "Vests", "our_price": 149.99, "cost": 62.00, "margin_pct": 58.7, "stock_qty": 74, "monthly_sales": 38}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-WJ-007", "product_name": "Laurentian Wool Coat", "category": "Wool Coats", "our_price": 399.99, "cost": 195.00, "margin_pct": 51.3, "stock_qty": 19, "monthly_sales": 12}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-SP-001", "product_name": "Northern Shield Snow Pants", "category": "Snow Pants", "our_price": 189.99, "cost": 82.00, "margin_pct": 56.8, "stock_qty": 56, "monthly_sales": 34}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-SP-002", "product_name": "Summit Insulated Snow Pants", "category": "Snow Pants", "our_price": 229.99, "cost": 105.00, "margin_pct": 54.3, "stock_qty": 42, "monthly_sales": 25}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-BT-001", "product_name": "Ice Grip Winter Boots", "category": "Boots", "our_price": 199.99, "cost": 88.00, "margin_pct": 56.0, "stock_qty": 67, "monthly_sales": 45}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-BT-002", "product_name": "Snowfield Insulated Boots", "category": "Boots", "our_price": 259.99, "cost": 118.00, "margin_pct": 54.6, "stock_qty": 31, "monthly_sales": 21}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-AC-001", "product_name": "Merino Wool Base Layer Set", "category": "Accessories", "our_price": 89.99, "cost": 35.00, "margin_pct": 61.1, "stock_qty": 112, "monthly_sales": 67}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-AC-002", "product_name": "Insulated Touchscreen Gloves", "category": "Accessories", "our_price": 49.99, "cost": 18.00, "margin_pct": 64.0, "stock_qty": 156, "monthly_sales": 89}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-AC-003", "product_name": "Fleece Neck Gaiter", "category": "Accessories", "our_price": 29.99, "cost": 9.50, "margin_pct": 68.3, "stock_qty": 203, "monthly_sales": 112}', NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), import_products, demo_user_id, '{"sku": "NO-AC-004", "product_name": "Heated Insoles", "category": "Accessories", "our_price": 69.99, "cost": 28.00, "margin_pct": 60.0, "stock_qty": 78, "monthly_sales": 34}', NOW() - INTERVAL '12 days');

-- ============================================================
-- DASHBOARD + WIDGETS
-- ============================================================
INSERT INTO public.dashboards (id, user_id, name, layout, is_default, created_at)
VALUES (
    dashboard_main,
    demo_user_id,
    'Competitive Intelligence',
    '[
        {"i": "w0000001-0000-0000-0000-000000000001", "x": 0, "y": 0, "w": 3, "h": 2},
        {"i": "w0000002-0000-0000-0000-000000000002", "x": 3, "y": 0, "w": 3, "h": 2},
        {"i": "w0000003-0000-0000-0000-000000000003", "x": 6, "y": 0, "w": 3, "h": 2},
        {"i": "w0000004-0000-0000-0000-000000000004", "x": 0, "y": 2, "w": 6, "h": 4},
        {"i": "w0000005-0000-0000-0000-000000000005", "x": 6, "y": 2, "w": 6, "h": 4},
        {"i": "w0000006-0000-0000-0000-000000000006", "x": 0, "y": 6, "w": 12, "h": 4}
    ]'::jsonb,
    TRUE,
    NOW() - INTERVAL '11 days'
);

INSERT INTO public.widgets (id, dashboard_id, type, title, config, position, created_at) VALUES
(w1, dashboard_main, 'kpi', 'Average Competitor Price',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001", "metric_field": "price", "time_range": "30d"}'::jsonb,
 '{"x": 0, "y": 0, "w": 3, "h": 2}'::jsonb, NOW() - INTERVAL '11 days'),

(w2, dashboard_main, 'kpi', 'Products Tracked',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001", "metric_field": "review_count", "time_range": "30d"}'::jsonb,
 '{"x": 3, "y": 0, "w": 3, "h": 2}'::jsonb, NOW() - INTERVAL '11 days'),

(w3, dashboard_main, 'kpi', 'Price Changes This Week',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001", "metric_field": "price", "time_range": "7d"}'::jsonb,
 '{"x": 6, "y": 0, "w": 3, "h": 2}'::jsonb, NOW() - INTERVAL '11 days'),

(w4, dashboard_main, 'bar_chart', 'Price Distribution by Retailer',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001", "metric_field": "price", "compare_field": "retailer", "chart_config": {"colors": ["#3b82f6", "#10b981", "#f59e0b"]}}'::jsonb,
 '{"x": 0, "y": 2, "w": 6, "h": 4}'::jsonb, NOW() - INTERVAL '11 days'),

(w5, dashboard_main, 'feed', 'Recent Price Changes',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001"}'::jsonb,
 '{"x": 6, "y": 2, "w": 6, "h": 4}'::jsonb, NOW() - INTERVAL '11 days'),

(w6, dashboard_main, 'table', 'All Tracked Jackets',
 '{"pipeline_id": "p0000001-0000-0000-0000-000000000001"}'::jsonb,
 '{"x": 0, "y": 6, "w": 12, "h": 4}'::jsonb, NOW() - INTERVAL '11 days');

-- ============================================================
-- ALERTS
-- ============================================================
INSERT INTO public.alerts (id, user_id, pipeline_id, name, condition, delivery_method, is_active, last_triggered_at, trigger_count, created_at) VALUES
(alert_price_drop, demo_user_id, pipeline_jackets, 'Competitor Price Drop > 10%',
 '{"field": "price", "operator": "pct_change_gt", "value": -10, "threshold": 10}'::jsonb,
 'in_app', TRUE, NOW() - INTERVAL '2 days', 3, NOW() - INTERVAL '13 days'),

(alert_new_product, demo_user_id, pipeline_jackets, 'New Product Detected',
 '{"field": "product_name", "operator": "changed", "value": null}'::jsonb,
 'in_app', TRUE, NOW() - INTERVAL '7 days', 2, NOW() - INTERVAL '13 days');

-- ============================================================
-- ALERT EVENTS
-- ============================================================
INSERT INTO public.alert_events (id, alert_id, user_id, record_id, summary, data, is_read, triggered_at) VALUES
(uuid_generate_v4(), alert_price_drop, demo_user_id, rec_1,
 'Woods Expedition Down Parka price dropped from $399.99 to $349.99 (-12.5%) at Canadian Tire',
 '{"old_price": 399.99, "new_price": 349.99, "change_pct": -12.5, "retailer": "Canadian Tire"}'::jsonb,
 FALSE, NOW() - INTERVAL '3 days'),

(uuid_generate_v4(), alert_price_drop, demo_user_id, rec_13,
 'Patagonia Tres 3-in-1 Parka price dropped from $599.95 to $499.95 (-16.7%) at MEC',
 '{"old_price": 599.95, "new_price": 499.95, "change_pct": -16.7, "retailer": "MEC"}'::jsonb,
 FALSE, NOW() - INTERVAL '4 days'),

(uuid_generate_v4(), alert_new_product, demo_user_id, rec_27,
 'New product detected: Soia & Kyo Maddison Wool Coat at Altitude Sports ($450.00)',
 '{"product_name": "Soia & Kyo Maddison Wool Coat", "price": 450.00, "retailer": "Altitude Sports"}'::jsonb,
 TRUE, NOW() - INTERVAL '7 days');

-- ============================================================
-- AI CHAT (demo conversation)
-- ============================================================
INSERT INTO public.ai_chats (id, user_id, title, messages, context, created_at)
VALUES (
    chat_demo,
    demo_user_id,
    'Pricing Strategy Analysis',
    '[
        {
            "role": "user",
            "content": "What are the biggest price drops from competitors this week?",
            "timestamp": "2026-03-05T10:30:00Z"
        },
        {
            "role": "assistant",
            "content": "I found **5 significant price drops** in the last 2 weeks across your tracked competitors:\n\n1. **Patagonia Tres 3-in-1 Parka** at MEC — dropped from $599.95 to **$499.95** (-16.7%)\n2. **Woods Expedition Down Parka** at Canadian Tire — dropped from $399.99 to **$349.99** (-12.5%)\n3. **Columbia Bugaboo II** at Canadian Tire — dropped from $249.99 to **$219.99** (-12.0%)\n4. **Quartz Co. Champlain** at Altitude Sports — dropped from $650.00 to **$575.00** (-11.5%)\n5. **North Face McMurdo Parka III** at Canadian Tire — dropped from $499.99 to **$449.99** (-10.0%)\n\nThe biggest drops are in the **premium down parka** category. This could be seasonal clearance or a competitive response. Your Northern Shield Down Parka at $379.99 is well-positioned against the Woods and Columbia options.",
            "timestamp": "2026-03-05T10:30:05Z"
        },
        {
            "role": "user",
            "content": "How does our pricing compare to the competition in the 3-in-1 jacket category?",
            "timestamp": "2026-03-05T10:31:00Z"
        },
        {
            "role": "assistant",
            "content": "Here''s your **3-in-1 jacket competitive pricing analysis**:\n\n| Product | Retailer | Price | Rating |\n|---------|----------|-------|--------|\n| Your Northern Expedition 3-in-1 | Northern Outfitters | **$299.99** | — |\n| McKinley Whistler II | Canadian Tire | $259.99 | 4.5★ |\n| Columbia Bugaboo II | Canadian Tire | $219.99 | 4.4★ |\n| Patagonia Tres 3-in-1 | MEC | $499.95 | 4.6★ |\n\n**Key insights:**\n- You''re priced **between** the budget options (Columbia/McKinley) and the premium option (Patagonia)\n- Your cost is $142, giving you a **52.7% margin** — healthy for this category\n- The Columbia Bugaboo just dropped to $219.99, which could pull price-sensitive customers\n\n**Recommendation:** Consider a limited-time promotion at $269.99 to stay competitive with the mid-tier while maintaining a 47% margin. This positions you $50 above Columbia but $190 below Patagonia.",
            "timestamp": "2026-03-05T10:31:10Z"
        }
    ]'::jsonb,
    '{"pipeline_ids": ["p0000001-0000-0000-0000-000000000001"], "import_ids": ["i0000001-0000-0000-0000-000000000001"]}'::jsonb,
    NOW() - INTERVAL '2 days'
);

END $$;
