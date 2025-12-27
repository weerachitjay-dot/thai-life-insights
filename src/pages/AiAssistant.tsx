import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/integrations/supabase/client';
import { useFilter } from '@/contexts/FilterContext';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'สวัสดีครับ ผมคือ AI ผู้ช่วยวิเคราะห์โฆษณาของคุณ มีอะไรให้ช่วยเช็ควันนี้ครับ? (เช่น "ขอสรุปยอด Leads วันนี้", "แคมเปญไหน CPL แพงสุด")'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { dateRange, product } = useFilter();
  const [dataContext, setDataContext] = useState<string>('');

  // Fetch data context for AI
  useEffect(() => {
    fetchDataContext();
  }, [dateRange, product]);

  const fetchDataContext = async () => {
    try {
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // Fetch performance data
      const { data: performanceData } = await (supabase as any)
        .from('product_performance_daily')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate);

      // Fetch leads data
      const { data: leadsData } = await (supabase as any)
        .from('leads_sent_daily')
        .select('*')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      // Fetch ad performance for detailed campaign data
      const { data: adData } = await (supabase as any)
        .from('ad_performance_daily')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate);

      // Fetch audience breakdown
      const { data: audienceData } = await (supabase as any)
        .from('audience_breakdown_daily')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate);

      // Build context string
      let context = `Analysis Period: ${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}\n\n`;

      // === BY PRODUCT BREAKDOWN ===
      if (performanceData && performanceData.length > 0) {
        const byProduct: Record<string, { spend: number; leads: number; reach: number }> = {};

        performanceData.forEach((row: any) => {
          const prod = row.product_code || 'Unknown';
          if (!byProduct[prod]) byProduct[prod] = { spend: 0, leads: 0, reach: 0 };
          byProduct[prod].spend += row.spend || 0;
          byProduct[prod].leads += row.meta_leads || 0;
          byProduct[prod].reach += row.reach || 0;
        });

        context += '=== PERFORMANCE BY PRODUCT ===\n';
        Object.entries(byProduct)
          .sort((a, b) => b[1].leads - a[1].leads)
          .forEach(([productCode, data]) => {
            const cpl = data.leads > 0 ? Math.round(data.spend / data.leads) : 0;
            context += `\n${productCode}:\n`;
            context += `  - Spend: ฿${data.spend.toLocaleString()}\n`;
            context += `  - Meta Leads: ${data.leads}\n`;
            context += `  - CPL: ฿${cpl}\n`;
            context += `  - Reach: ${data.reach.toLocaleString()}\n`;
          });
        context += '\n';
      }

      // === LEADS CONVERSION BY PRODUCT ===
      if (leadsData && leadsData.length > 0) {
        const byProduct: Record<string, { sent: number; confirmed: number }> = {};

        leadsData.forEach((row: any) => {
          const prod = row.product_code || 'Unknown';
          if (!byProduct[prod]) byProduct[prod] = { sent: 0, confirmed: 0 };
          byProduct[prod].sent += row.sent_all_amount || 0;
          byProduct[prod].confirmed += row.confirmed_amount || 0;
        });

        context += '=== LEADS CONVERSION BY PRODUCT ===\n';
        Object.entries(byProduct)
          .sort((a, b) => b[1].confirmed - a[1].confirmed)
          .forEach(([productCode, data]) => {
            const convRate = data.sent > 0 ? ((data.confirmed / data.sent) * 100).toFixed(1) : 0;
            context += `\n${productCode}:\n`;
            context += `  - Sent Leads: ${data.sent}\n`;
            context += `  - Confirmed Leads: ${data.confirmed}\n`;
            context += `  - Conversion Rate: ${convRate}%\n`;
          });
        context += '\n';
      }

      // === TOP CAMPAIGNS ===
      if (adData && adData.length > 0) {
        const byCampaign: Record<string, { spend: number; leads: number; name: string }> = {};

        adData.forEach((row: any) => {
          const campId = row.campaign_id || 'unknown';
          if (!byCampaign[campId]) {
            byCampaign[campId] = {
              spend: 0,
              leads: 0,
              name: row.campaign_name || campId
            };
          }
          byCampaign[campId].spend += row.spend || 0;
          byCampaign[campId].leads += row.meta_leads || 0;
        });

        context += '=== TOP 5 CAMPAIGNS (by Leads) ===\n';
        Object.entries(byCampaign)
          .sort((a, b) => b[1].leads - a[1].leads)
          .slice(0, 5)
          .forEach(([id, data]) => {
            const cpl = data.leads > 0 ? Math.round(data.spend / data.leads) : 0;
            context += `\n${data.name}:\n`;
            context += `  - Leads: ${data.leads}\n`;
            context += `  - CPL: ฿${cpl}\n`;
            context += `  - Spend: ฿${data.spend.toLocaleString()}\n`;
          });
        context += '\n';
      }

      // === AUDIENCE DEMOGRAPHICS ===
      if (audienceData && audienceData.length > 0) {
        const byAge: Record<string, { leads: number; spend: number }> = {};
        const byGender: Record<string, { leads: number; spend: number }> = {};

        audienceData.forEach((row: any) => {
          if (row.age_range) {
            if (!byAge[row.age_range]) byAge[row.age_range] = { leads: 0, spend: 0 };
            byAge[row.age_range].leads += row.meta_leads || 0;
            byAge[row.age_range].spend += row.spend || 0;
          }
          if (row.gender) {
            if (!byGender[row.gender]) byGender[row.gender] = { leads: 0, spend: 0 };
            byGender[row.gender].leads += row.meta_leads || 0;
            byGender[row.gender].spend += row.spend || 0;
          }
        });

        if (Object.keys(byAge).length > 0) {
          context += '=== PERFORMANCE BY AGE GROUP ===\n';
          Object.entries(byAge)
            .sort((a, b) => b[1].leads - a[1].leads)
            .forEach(([age, data]) => {
              const cpl = data.leads > 0 ? Math.round(data.spend / data.leads) : 0;
              context += `${age}: ${data.leads} leads, CPL ฿${cpl}\n`;
            });
          context += '\n';
        }

        if (Object.keys(byGender).length > 0) {
          context += '=== PERFORMANCE BY GENDER ===\n';
          Object.entries(byGender).forEach(([gender, data]) => {
            const cpl = data.leads > 0 ? Math.round(data.spend / data.leads) : 0;
            context += `${gender}: ${data.leads} leads, CPL ฿${cpl}\n`;
          });
          context += '\n';
        }
      }

      // Overall summary
      const totalSpend = performanceData?.reduce((sum: number, row: any) => sum + (row.spend || 0), 0) || 0;
      const totalLeads = performanceData?.reduce((sum: number, row: any) => sum + (row.meta_leads || 0), 0) || 0;
      const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;

      context += '=== OVERALL SUMMARY ===\n';
      context += `Total Spend: ฿${totalSpend.toLocaleString()}\n`;
      context += `Total Leads: ${totalLeads}\n`;
      context += `Average CPL: ฿${avgCPL}\n`;

      setDataContext(context);
    } catch (error) {
      console.error('Error fetching data context:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add User Message
    const userMessage = input;
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Initialize Gemini
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Gemini API Key ไม่ได้ตั้งค่า กรุณาเพิ่ม VITE_GEMINI_API_KEY ใน environment variables'
        }]);
        setIsLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Build prompt with context
      const systemPrompt = `คุณคือผู้ช่วย AI สำหรับวิเคราะห์ข้อมูลโฆษณา Facebook Ads ของบริษัทประกันชีวิต
คุณมีข้อมูลดังนี้:

${dataContext}

ตอบคำถามเป็นภาษาไทย ให้คำแนะนำที่เป็นประโยชน์และเฉพาะเจาะจง 
ใช้ข้อมูลที่มีให้เท่านั้น ถ้าไม่มีข้อมูลบอกตรงๆ
ให้คำแนะนำแบบมืออาชีพและเป็นมิตร`;

      const fullPrompt = `${systemPrompt}\n\nคำถาม: ${userMessage}`;

      // Call Gemini API
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Add AI Response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse
      }]);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถเชื่อมต่อ Gemini API ได้'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="AI Assistant" subtitle="Chat with your Ad Data">
      <Card className="border-2 border-foreground h-[calc(100vh-220px)] flex flex-col">
        {/* Suggestion Chips */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Product Summary', prompt: 'สรุป Performance แต่ละ Product' },
              { label: 'Best Campaigns', prompt: 'แคมเปญไหน Leads เยอะสุด?' },
              { label: 'Optimization Tips', prompt: 'แนะนำวิธีปรับปรุง CPL' },
              { label: 'Audience Insights', prompt: 'กลุ่มเป้าหมายไหนให้ผลดี?' }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setInput(chip.prompt);
                }}
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full border border-border transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                  }`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`max-w-[70%] p-3 rounded-lg whitespace-pre-wrap ${msg.role === 'assistant'
                    ? 'bg-secondary text-foreground'
                    : 'bg-primary text-primary-foreground'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <span className="animate-pulse">กำลังพิมพ์...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border flex gap-2">
          <Input
            placeholder="ถามอะไรก็ได้เกี่ยวกับข้อมูลโฆษณา..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}
