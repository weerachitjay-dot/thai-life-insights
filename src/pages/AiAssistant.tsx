import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    // Add User Message
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Simulate AI Response (เดี๋ยวเราค่อยต่อ API จริงตรงนี้)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'รับทราบครับ... (ระบบกำลังเชื่อมต่อฐานข้อมูล Antigravity...)' 
      }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout title="AI Assistant" subtitle="Chat with your Ad Data">
      <Card className="border-2 border-foreground h-[calc(100vh-220px)] flex flex-col">
        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'assistant' 
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
