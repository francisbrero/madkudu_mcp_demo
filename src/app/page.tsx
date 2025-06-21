import { ArrowRight, Sparkles, Wrench, MessageSquare, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: Wrench,
      title: "Tool Playground",
      description: "Test individual MCP tools in isolation with custom parameters",
      href: "/playground",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: MessageSquare,
      title: "AI Chat",
      description: "Chat with AI that has access to business context",
      href: "/chat",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Users,
      title: "Specialized Agents",
      description: "Create and manage AI agents for specific business tasks",
      href: "/agents",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-16">
        <div className="animate-fade-in text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass-card">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Model Context Provider Demo</span>
          </div>
          <h1 className="text-6xl font-bold mb-6">
            Welcome to <span className="gradient-text">GTM MCP</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of AI enhanced with business context. Connect LLMs to GTM&apos;s 
            structured tools for intelligent automation and insights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="agent-card p-6 h-full">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <div className="flex items-center text-primary">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="glass-card p-8 rounded-xl animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              To begin using the MCP Demo, you&apos;ll need to configure your API keys in the 
              <Link href="/settings" className="text-primary hover:underline ml-1">Settings</Link> page.
            </p>
            <div className="flex gap-4">
              <Link href="/settings" className="btn-primary inline-flex items-center gap-2">
                Configure API Keys
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/playground" className="btn-secondary inline-flex items-center gap-2">
                Try Playground
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}