import dotenv from 'dotenv';
import moment from 'moment';
import { exchangeToken } from './src/auth.js';
import { fetchFacebookAdsData } from './src/fetcher.js';
import { fetchAudienceData } from './src/fetch_audience.js';
import { supabase } from './src/supabase.js';

dotenv.config();

async function main() {
    console.log("🚀 Starting 14-Day Data Sync...");

    try {
        // Step 1: Exchange Keys (Maintenance)
        if (exchangeToken) {
            try {
                await exchangeToken();
            } catch (e) {
                console.warn("⚠️ Auth exchange warning (Non-critical):", e.message);
            }
        }

        // Step 2: Get Long-Lived Token from Supabase
        const { data: config, error } = await supabase
            .from('config_tokens')
            .select('access_token')
            .eq('provider', 'facebook')
            .eq('token_type', 'long_lived')
            .maybeSingle();

        if (error || !config) {
            console.error("❌ Error: No long-lived Facebook token found in Database.");
            process.exit(1);
        }

        const token = config.access_token;
        console.log("🔑 Token retrieved from database successfully.");

        // Step 3: Loop 14 Days
        // วนลูปย้อนหลังทีละวัน (รวมวันนี้ด้วย = 14 รอบ)
        for (let i = 0; i < 14; i++) {
            const targetDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
            const timeRange = { since: targetDate, until: targetDate };

            console.log(`\n📅 [Day ${i + 1}/14] Processing Date: ${targetDate}`);

            try {
                // ดึงข้อมูลหลัก + รูปภาพ
                await fetchFacebookAdsData(timeRange, token);
                // ดึงข้อมูลกลุ่มเป้าหมาย
                await fetchAudienceData(timeRange, token);

                console.log(`✅ Success for ${targetDate}`);

                // พัก 3 วินาที กัน Facebook บล็อก
                await new Promise(r => setTimeout(r, 3000));
            } catch (e) {
                console.error(`❌ Failed for ${targetDate}:`, e.message);
            }
        }

        console.log("\n🎉 14-Day Sync Complete! Check your Dashboard.");
        process.exit(0);

    } catch (error) {
        console.error("🔥 Critical Error:", error);
        process.exit(1);
    }
}

main();
