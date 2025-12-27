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
      const { data: performanceData } = await supabase
        .from('product_performance_daily')
        .select('*')
        .gte('date', fromDate)
        .lte('date', toDate);

      // Fetch leads data
      const { data: leadsData } = await supabase
        .from('leads_sent_daily')
        .select('*')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      // Build context string
      let context = `Current Data Context (${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}):\n\n`;

      if (performanceData && performanceData.length > 0) {
        const totalSpend = performanceData.reduce((sum: number, row: any) => sum + (row.spend || 0), 0);
        const totalLeads = performanceData.reduce((sum: number, row: any) => sum + (row.meta_leads || 0), 0);
        const totalReach = performanceData.reduce((sum: number, row: any) => sum + (row.reach || 0), 0);

        context += `Performance Summary:\n`;
        context += `- Total Spend: ฿${totalSpend.toLocaleString()}\n`;
        context += `- Total Meta Leads: ${totalLeads}\n`;
        context += `- Total Reach: ${totalReach.toLocaleString()}\n`;
        context += `- Average CPL: ฿${totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0}\n\n`;
      }

      if (leadsData && leadsData.length > 0) {
        const totalSent = leadsData.reduce((sum: number, row: any) => sum + (row.sent_all_amount || 0), 0);
        const totalConfirmed = leadsData.reduce((sum: number, row: any) => sum + (row.confirmed_amount || 0), 0);

        context += `Leads Summary:\n`;
        context += `- Total Sent Leads: ${totalSent}\n`;
        context += `- Total Confirmed Leads: ${totalConfirmed}\n`;
        context += `- Confirmation Rate: ${totalSent > 0 ? ((totalConfirmed / totalSent) * 100).toFixed(1) : 0}%\n`;
      }

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

      if (!apiKey) {
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
              { label: 'Daily Summary', prompt: 'สรุปยอด Sent Leads เมื่อวาน' },
              { label: 'High CPL Alert', prompt: 'แคมเปญไหน CPL แพงสุด?' },
              { label: 'Creative Ideas', prompt: 'ขอไอเดีย Content ใหม่' },
              { label: 'Best Interest', prompt: 'Interest ไหนได้ผลดีที่สุด?' }
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
