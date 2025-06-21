import { ToolPlayground } from './_components/ToolPlayground';
import { Wrench, Sparkles } from 'lucide-react';

export default function PlaygroundPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tool Playground</h1>
              <p className="text-muted-foreground">Test MCP tools with custom parameters</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Select a tool from the dropdown and provide parameters to test its functionality directly.
            </p>
          </div>
        </div>
        <ToolPlayground />
      </div>
    </main>
  );
} 