
import axios from 'axios';
import { supabase } from './supabase.js';

export async function exchangeToken() {
    console.log("🔐 Checking for new Facebook tokens...");

    // 1. Find 'short_lived' token
    const { data: tokenData, error } = await supabase
        .from('config_tokens')
        .select('*')
        .eq('provider', 'facebook')
        .eq('token_type', 'short_lived')
        .maybeSingle();

    if (error || !tokenData) {
        console.log("ℹ️ No short-lived tokens found. Skipping exchange.");
        return;
    }

    console.log("🔄 Found short-lived token. Exchanging for long-lived...");

    try {
        // 2. Exchange Token via Facebook API
        const appId = process.env.FB_APP_ID;
        const appSecret = process.env.FB_APP_SECRET;
        const shortToken = tokenData.access_token;

        const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;

        const response = await axios.get(url);
        const longToken = response.data.access_token;

        if (longToken) {
            // 3. Update Supabase
            const { error: updateError } = await supabase
                .from('config_tokens')
                .update({
                    access_token: longToken,
                    token_type: 'long_lived',
                    updated_at: new Date().toISOString()
                })
                .eq('id', tokenData.id);

            if (updateError) {
                console.error("❌ Failed to update token in DB:", updateError.message);
            } else {
                console.log("✅ Token successfully exchanged and saved (Long-lived)!");
            }
        }
    } catch (err) {
        console.error("❌ Error exchanging token:", err.response ? err.response.data : err.message);
    }
}
