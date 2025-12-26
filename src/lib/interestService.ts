import axios from 'axios';

// ฟังก์ชันค้นหา Interest จาก Facebook
export const searchFacebookInterests = async (query: string, token: string) => {
  try {
    const res = await axios.get('https://graph.facebook.com/v19.0/search', {
      params: {
        type: 'adinterest',
        q: query,
        access_token: token,
        limit: 50,
        locale: 'th_TH' // ระบุเป็นไทยเพื่อให้ได้ผลลัพธ์ที่คนไทยใช้
      }
    });
    return res.data.data;
  } catch (error) {
    console.error("FB API Error:", error);
    return [];
  }
};

// ฟังก์ชันเรียก AI (Gemini/Groq) - ตัวอย่าง Mockup
// ของจริงคุณต้องเชื่อมกับ Server-Side API Route เพื่อความปลอดภัยของ Key
export const brainstormKeywords = async (context: string, apiKey: string) => {
  // Logic การเรียก AI ใส่ตรงนี้
  // return ["keyword1", "keyword2"];
  return []; 
};
