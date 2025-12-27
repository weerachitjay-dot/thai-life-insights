import bizSdk from 'facebook-nodejs-business-sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

// --- CONFIG ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function mapProductToCode(campaignName) {
    if (!campaignName) return 'UNKNOWN';
    const name = campaignName.toUpperCase();
    if (name.includes('SENIOR-BONECARE')) return 'LIFE-SENIOR-BONECARE';
    if (name.includes('MONEYSAVING14/6')) return 'SAVING-MONEYSAVING14/6';
    if (name.includes('EXTRASENIOR-BUPHAKARI')) return 'LIFE-EXTRASENIOR-BUPHAKARI';
    if (name.includes('SENIOR-MORRADOK')) return 'LIFE-SENIOR-MORRADOK';
    if (name.includes('HAPPY')) return 'SAVING-HAPPY';
    if (name.includes('TOPUP-SICK')) return 'HEALTH-TOPUP-SICK';
    if (name.includes('SABAI-JAI') || name.includes('SABAIJAI')) return 'HEALTH-SABAI-JAI';
    return 'OTHER';
}

export async function fetchAudienceData(dateParam = 'today', providedToken = null) {
    const token = providedToken || process.env.FB_ACCESS_TOKEN;

    if (!token) {
        console.error("❌ Critical Error: FB_ACCESS_TOKEN is missing (Env or Argument).");
        return;
    }

    // Initialize API logic
    FacebookAdsApi.init(token);

    // 🛡️ ใช้ Object เพื่อเก็บข้อมูลชั่วคราวและยุบตัวที่ซ้ำ (Key = date + product + age + gender)
    const audienceMap = {};
    const ACCOUNT_IDS = process.env.FB_AD_ACCOUNT_IDS ? process.env.FB_AD_ACCOUNT_IDS.split(',') : [];

    const params = {
        level: 'campaign',
        breakdowns: ['age', 'gender'],
        limit: 100
    };
    if (typeof dateParam === 'string') {
        params['date_preset'] = dateParam;
    } else {
        params['time_range'] = dateParam;
    }

    console.log(`👥 Starting Audience Fetcher [Range: ${JSON.stringify(dateParam)}]`);

    for (const accountId of ACCOUNT_IDS) {
        const id = accountId.trim();
        if (!id) continue;

        try {
            const account = new AdAccount(id);
            const insights = await account.getInsights(['campaign_name', 'spend', 'actions', 'date_start'], params);

            for (const stat of insights) {
                const productCode = mapProductToCode(stat.campaign_name);
                const leads = stat.actions ? (stat.actions.find(a => a.action_type === 'lead')?.value || 0) : 0;

                // 🛡️ สร้าง Unique Key สำหรับแถวนี้
                const key = `${stat.date_start}_${productCode}_${stat.age}_${stat.gender}`;

                if (!audienceMap[key]) {
                    audienceMap[key] = {
                        date: stat.date_start,
                        product_code: productCode,
                        age_range: stat.age,
                        gender: stat.gender,
                        spend: 0,
                        meta_leads: 0
                    };
                }

                // 🛡️ ยุบข้อมูลเข้าด้วยกัน (ถ้ามีตัวซ้ำจะถูกนำมาบวกกันที่นี่)
                audienceMap[key].spend += parseFloat(stat.spend || 0);
                audienceMap[key].meta_leads += parseInt(leads);
            }
        } catch (error) {
            console.error(`❌ Audience Error ${id}:`, error.message);
        }
    }

    const payload = Object.values(audienceMap);

    if (payload.length > 0) {
        console.log(`👥 Updating Audience Stats (${payload.length} rows - deduplicated)...`);
        const { error } = await supabase
            .from('audience_breakdown_daily')
            .upsert(payload, { onConflict: 'date, product_code, age_range, gender' });

        if (error) console.error('Error upserting audience:', error);
        else console.log('✅ Audience Sync Success!');
    } else {
        console.log('⚠️ No audience data found.');
    }
}
