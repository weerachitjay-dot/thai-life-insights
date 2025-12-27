-- Create product_settings table for storing product configuration
CREATE TABLE IF NOT EXISTS product_settings (
    product_code TEXT PRIMARY KEY,
    sell_price NUMERIC DEFAULT 0,
    target_cpl NUMERIC,
    owner_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default product settings
INSERT INTO product_settings (product_code, sell_price, target_cpl, owner_name)
VALUES 
    ('LIFE-SENIOR-BONECARE', 5000, 500, 'Team A'),
    ('SAVING-MONEYSAVING14/6', 3000, 400, 'Team B'),
    ('LIFE-EXTRASENIOR-BUPHAKARI', 6000, 600, 'Team A'),
    ('LIFE-SENIOR-MORRADOK', 4500, 450, 'Team C'),
    ('SAVING-HAPPY', 3500, 350, 'Team B'),
    ('HEALTH-TOPUP-SICK', 2500, 300, 'Team D'),
    ('HEALTH-SABAI-JAI', 2000, 250, 'Team D')
ON CONFLICT (product_code) DO NOTHING;
