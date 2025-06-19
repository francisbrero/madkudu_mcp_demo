import { ToolPlayground } from './_components/ToolPlayground';

export default function PlaygroundPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Tool Playground</h1>
        <ToolPlayground />
      </div>
    </main>
  );
} 