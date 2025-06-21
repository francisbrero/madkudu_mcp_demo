import { ChatInterface } from "./_components/ChatInterface";
import { MessageSquare, Sparkles } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Chat</h1>
              <p className="text-muted-foreground">Chat with AI that has access to GTM data</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              The AI can automatically use MCP tools to answer your questions with real business data.
            </p>
          </div>
        </div>
        <div className="h-[calc(100vh-16rem)]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
} 