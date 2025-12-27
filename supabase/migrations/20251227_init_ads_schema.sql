-- Antigravity Database Schema

-- 1. Store Facebook Access Tokens
CREATE TABLE IF NOT EXISTS facebook_tokens (
    id SERIAL PRIMARY KEY,
    account_name TEXT NOT NULL UNIQUE, -- CLI arg maps to this. e.g. 'client_x'
    ad_account_id TEXT NOT NULL,       -- e.g. 'act_123456789'
    app_id TEXT,
    app_secret TEXT,
    access_token TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Store RAW JSON Responses from Meta (Raw Data First)
-- This is the Source of Truth.
CREATE TABLE IF NOT EXISTS meta_ads_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id TEXT NOT NULL,          -- Extracted from JSON for indexing
    date_start DATE NOT NULL,     -- Reporting period start
    date_stop DATE NOT NULL,      -- Reporting period end
    raw_json JSONB NOT NULL,      -- The EXACT response from Meta
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Idempotency: Prevent duplicate raw entries for the same ad & date range.
    CONSTRAINT unique_ad_date_range UNIQUE (ad_id, date_start, date_stop)
);

-- 3. Flattened Data (Legacy/Optional - keeping for reference if needed)
CREATE TABLE IF NOT EXISTS meta_ads_flat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raw_ref_id UUID REFERENCES meta_ads_raw(id) ON DELETE CASCADE,
    ad_id TEXT NOT NULL,
    ad_name TEXT,
    date_start DATE,
    date_stop DATE,
    impressions NUMERIC,
    spend NUMERIC,
    clicks NUMERIC,
    ctr NUMERIC,
    cpc NUMERIC,
    cpm NUMERIC,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_flat_ad_date_range UNIQUE (ad_id, date_start, date_stop)
);

-- 4. NEW: Daily Stats Fact Table (Rich Metrics)
CREATE TABLE IF NOT EXISTS meta_ads_daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raw_ref_id UUID REFERENCES meta_ads_raw(id) ON DELETE CASCADE,
    ad_account_id TEXT,
    date DATE NOT NULL,
    
    -- Dimensions
    campaign_id TEXT,
    campaign_name TEXT,
    adset_id TEXT,
    adset_name TEXT,
    ad_id TEXT NOT NULL,
    ad_name TEXT,

    -- Metrics
    spend NUMERIC,
    impressions NUMERIC,
    reach NUMERIC,
    clicks NUMERIC,
    frequency NUMERIC,
    
    -- Actions
    leads NUMERIC DEFAULT 0,
    leads_on_facebook NUMERIC DEFAULT 0,
    leads_website NUMERIC DEFAULT 0,
    purchases NUMERIC DEFAULT 0,
    
    -- Calculated
    cpm NUMERIC,
    cpc NUMERIC,
    ctr NUMERIC,
    cpl NUMERIC,
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One stat record per ad per day
    CONSTRAINT unique_daily_stats UNIQUE (ad_id, date)
);

-- 5. NEW: Dimensions Tables (Context Sync)

-- Campaigns
CREATE TABLE IF NOT EXISTS meta_dim_campaigns (
    id TEXT PRIMARY KEY, -- Campaign ID
    account_id TEXT,
    name TEXT,
    status TEXT,
    objective TEXT,
    buying_type TEXT,
    start_time TIMESTAMP,
    stop_time TIMESTAMP,
    raw_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AdSets
CREATE TABLE IF NOT EXISTS meta_dim_adsets (
    id TEXT PRIMARY KEY, -- AdSet ID
    account_id TEXT,
    campaign_id TEXT REFERENCES meta_dim_campaigns(id), -- Optional: FK if you enforce order
    name TEXT,
    status TEXT,
    targeting JSONB, -- Stored as JSON
    daily_budget NUMERIC,
    lifetime_budget NUMERIC,
    optimization_goal TEXT,
    billing_event TEXT,
    bid_strategy TEXT,
    raw_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ads
CREATE TABLE IF NOT EXISTS meta_dim_ads (
    id TEXT PRIMARY KEY, -- Ad ID
    account_id TEXT,
    campaign_id TEXT REFERENCES meta_dim_campaigns(id),
    adset_id TEXT REFERENCES meta_dim_adsets(id),
    name TEXT,
    status TEXT,
    creative JSONB, -- Stored as JSON
    raw_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Indices
CREATE INDEX IF NOT EXISTS idx_meta_ads_raw_fetched_at ON meta_ads_raw(fetched_at);
CREATE INDEX IF NOT EXISTS idx_meta_ads_daily_stats_date ON meta_ads_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_meta_ads_daily_stats_campaign ON meta_ads_daily_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_dim_campaigns_account ON meta_dim_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_meta_dim_adsets_account ON meta_dim_adsets(account_id);
CREATE INDEX IF NOT EXISTS idx_meta_dim_ads_account ON meta_dim_ads(account_id);

-- 6. NEW: Config Tokens (Auth Worker)
-- Stores tokens for rotation (Short -> Long lived)
CREATE TABLE IF NOT EXISTS config_tokens (
    id SERIAL PRIMARY KEY,
    provider TEXT NOT NULL, -- e.g. 'facebook'
    token_type TEXT CHECK (token_type IN ('short_lived', 'long_lived')),
    access_token TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_provider_token UNIQUE (provider)
);

-- 7. NEW: Product Performance Daily (Business Intelligence)
-- Aggregated stats mapped to Product Codes
CREATE TABLE IF NOT EXISTS product_performance_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    product_code TEXT NOT NULL,
    
    spend NUMERIC DEFAULT 0,
    meta_leads NUMERIC DEFAULT 0,
    impressions NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_date_product UNIQUE (date, product_code)
);

-- 8. NEW: Audience Breakdown Daily (Added for Audience Sync)
CREATE TABLE IF NOT EXISTS audience_breakdown_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    product_code TEXT NOT NULL,
    age_range TEXT,
    gender TEXT,
    spend NUMERIC DEFAULT 0,
    meta_leads NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_audience_daily UNIQUE (date, product_code, age_range, gender)
);

-- 9. NEW: Ad Performance Daily (Added for Ad Stats Sync)
CREATE TABLE IF NOT EXISTS ad_performance_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    product_code TEXT NOT NULL,
    ad_id TEXT NOT NULL,
    ad_name TEXT,
    image_url TEXT,
    spend NUMERIC DEFAULT 0,
    meta_leads NUMERIC DEFAULT 0,
    status TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_ad_daily UNIQUE (date, ad_id, product_code)
);
