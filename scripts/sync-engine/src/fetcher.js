import bizSdk from 'facebook-nodejs-business-sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const AdAccount = bizSdk.AdAccount;
const FacebookAdsApi = bizSdk.FacebookAdsApi;

// --- CONFIG ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY; // Prefer Service Key for scripts
// Fallback if only VITE keys are present (usually scripts need service key to bypass RLS, but if anon works for inserts, fine. But usually strict RLS blocks anon)
// However, the original script used SUPABASE_URL and SUPABASE_SERVICE_KEY.
// I'll ensure I try to grab VITE_ variables if the others are missing, but warn.

// Actually, in the original script:
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// I will keep it consistent but improve fallback
const finalSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// IMPORTANT: Scripts usually need SERVICE_KEY to write to restricted tables
const finalSupabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(finalSupabaseUrl, finalSupabaseKey);

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

function extractImageUrl(adCreative) {
    if (!adCreative) return null;

    // 1. ลองหาจาก image_url ตรงๆ (สำหรับ Single Image)
    if (adCreative.image_url) return adCreative.image_url;

    // 2. สำหรับ Video หรือ Thumbnail ของโฆษณา
    if (adCreative.thumbnail_url) return adCreative.thumbnail_url;

    // 3. เจาะลึกเข้าไปใน object_story_spec (สำหรับ Video/Carousel/Dynamic)
    const spec = adCreative.object_story_spec;
    if (spec) {
        // เคส Video
        if (spec.video_data && spec.video_data.image_url) return spec.video_data.image_url;
        // เคส Link/Image
        if (spec.link_data) {
            if (spec.link_data.picture) return spec.link_data.picture;
            // เคส Carousel (เอาภาพแรกสุดมาโชว์)
            if (spec.link_data.child_attachments && spec.link_data.child_attachments.length > 0) {
                return spec.link_data.child_attachments[0].picture;
            }
        }
    }

    // 4. ลองเช็คระดับล่างสุดที่ Facebook มักจะส่งมา
    if (adCreative.body && adCreative.image_hash) {
        // ถ้ามี Hash แต่ไม่มี URL อาจต้องใช้ Graph API ดึงรูปจาก Hash (แต่ควรจะได้จากข้อ 1-3 ก่อน)
    }

    return null;
}

export async function fetchFacebookAdsData(dateParam = 'today', providedToken = null) {
    const token = providedToken || process.env.FB_ACCESS_TOKEN;

    if (!token) {
        console.error("❌ Critical Error: FB_ACCESS_TOKEN is missing (Env or Argument).");
        return;
    }

    // Initialize API logic
    FacebookAdsApi.init(token);

    const allProductStats = {};
    const allAdStats = [];
    const ACCOUNT_IDS = process.env.FB_AD_ACCOUNT_IDS ? process.env.FB_AD_ACCOUNT_IDS.split(',') : [];

    // กำหนด Parameter ตามรูปแบบที่ส่งมา
    const params = {
        limit: 100 // ลดลงเพื่อความเสถียร
    };
    if (typeof dateParam === 'string') {
        params['date_preset'] = dateParam;
    } else {
        // time_range expects stringified object for some SDK calls, but for getting insights via SDK objects
        // we often pass the object directly. However, the user provided code implies passing it as an object to the SDK method.
        // Let's ensure it's passed correctly. The NodeJS SDK usually handles objects in params.
        params['time_range'] = dateParam; // { since: 'YYYY-MM-DD', until: 'YYYY-MM-DD' }
    }

    console.log(`🚀 Starting Ads Fetcher [Range: ${JSON.stringify(dateParam)}]`);

    for (const accountId of ACCOUNT_IDS) {
        const id = accountId.trim();
        if (!id) continue;

        try {
            const account = new AdAccount(id);
            console.log(`   🔹 Fetching Ads for: ${id}`);

            const ads = await account.getAds(
                ['campaign_name', 'ad_name', 'ad_id', 'creative{image_url,thumbnail_url,object_story_spec}', 'status'],
                { limit: 100 }
            );

            for (const ad of ads) {
                const insights = await ad.getInsights(
                    ['spend', 'impressions', 'clicks', 'actions', 'date_start'],
                    params
                );

                if (insights.length > 0) {
                    for (const stat of insights) {
                        const productCode = mapProductToCode(ad.campaign_name);
                        const spend = parseFloat(stat.spend || 0);
                        const leads = stat.actions ? (stat.actions.find(a => a.action_type === 'lead')?.value || 0) : 0;

                        // Ad Stats
                        allAdStats.push({
                            date: stat.date_start,
                            product_code: productCode,
                            ad_id: ad.id,
                            ad_name: ad.name,
                            image_url: extractImageUrl(ad.creative),
                            spend: spend,
                            meta_leads: parseInt(leads),
                            status: ad.status
                        });

                        // รวม Product Stats
                        const key = `${stat.date_start}_${productCode}`;
                        if (!allProductStats[key]) {
                            allProductStats[key] = { date: stat.date_start, product_code: productCode, spend: 0, meta_leads: 0 };
                        }
                        allProductStats[key].spend += spend;
                        allProductStats[key].meta_leads += parseInt(leads);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error in ${id}:`, error.message);
        }
    }

    // Upsert to Supabase
    if (Object.keys(allProductStats).length > 0) {
        console.log(`📦 Upserting ${Object.keys(allProductStats).length} product stats...`);
        const { error } = await supabase.from('product_performance_daily').upsert(Object.values(allProductStats), { onConflict: 'date, product_code' });
        if (error) console.error("Error upserting product stats:", error);
    }

    if (allAdStats.length > 0) {
        console.log(`🎨 Upserting ${allAdStats.length} ad stats...`);
        const { error } = await supabase.from('ad_performance_daily').upsert(allAdStats, { onConflict: 'date, ad_id, product_code' });
        if (error) console.error("Error upserting ad stats:", error);
    }

    console.log("✅ Ads/Creative Sync Complete.");
}
