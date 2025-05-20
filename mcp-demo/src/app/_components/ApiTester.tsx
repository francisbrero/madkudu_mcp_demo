"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function ApiTester() {
  const [email, setEmail] = useState("francis@madkudu.com");
  const [domain, setDomain] = useState("madkudu.com");
  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  // tRPC hooks
  const lookupPersonMutation = api.madkudu.lookupPerson.useMutation();
  const lookupAccountMutation = api.madkudu.lookupAccount.useMutation();
  const getAIResearchMutation = api.madkudu.getAIResearch.useMutation();

  const handleGetContactDetails = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await lookupPersonMutation.mutateAsync({ email });
      setResult(response);
      setActiveTab("raw"); // Default to raw for contact details
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAccountDetails = async () => {
    if (!domain.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await lookupAccountMutation.mutateAsync({ domain });
      setResult(response);
      setActiveTab("raw"); // Default to raw for account details
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAIResearch = async () => {
    if (!domain.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await getAIResearchMutation.mutateAsync({ domain });
      setResult(response);
      setActiveTab("formatted"); // Default to formatted for AI research
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format markdown links
  const formatMarkdownLinks = (text: string) => {
    // Replace markdown links with HTML links
    // Pattern: [link text](url)
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>`;
    });
  };

  // Function to render formatted research
  const renderFormattedResearch = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;
    
    // If result is a string, format it with proper paragraphs and headers
    if (typeof result === 'string') {
      const researchText = result as string;
      
      // Process line by line to ensure each \n becomes a line break
      // This will preserve the structure of the text better
      const lines = researchText
        .replace(/\\n/g, '\n')
        .split('\n');
      
      // Create a container for the formatted content
      const formattedContent: JSX.Element[] = [];
      let currentParagraph: string[] = [];
      let listItems: string[] = [];
      let isInList = false;
      let key = 0;
      
      // Process line by line
      lines.forEach((line, index) => {
        // Check if this is a header line
        const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headerMatch) {
          // If we have accumulated paragraph text, add it first
          if (currentParagraph.length > 0) {
            const paraText = currentParagraph.join(' ');
            formattedContent.push(
              <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
            );
            currentParagraph = [];
          }
          
          // If we were in a list, end it
          if (isInList && listItems.length > 0) {
            formattedContent.push(
              <ul key={key++} className="list-disc pl-5 mb-3">
                {listItems.map((item, i) => (
                  <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
                ))}
              </ul>
            );
            listItems = [];
            isInList = false;
          }
          
          // Add the header
          const level = headerMatch[1].length;
          const headerText = headerMatch[2];
          const formattedText = formatMarkdownLinks(headerText);
          
          switch (level) {
            case 1:
              formattedContent.push(
                <h1 key={key++} className="text-2xl font-bold text-blue-400 mt-6 mb-3" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
            case 2:
              formattedContent.push(
                <h2 key={key++} className="text-xl font-bold text-indigo-400 mt-5 mb-3" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
            case 3:
              formattedContent.push(
                <h3 key={key++} className="text-lg font-bold text-purple-400 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
          }
          return;
        }
        
        // Check if this is a list item
        if (line.trim().startsWith('- ')) {
          // If we have accumulated paragraph text, add it first
          if (currentParagraph.length > 0) {
            const paraText = currentParagraph.join(' ');
            formattedContent.push(
              <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
            );
            currentParagraph = [];
          }
          
          // Add to list items
          isInList = true;
          listItems.push(line.trim().substring(2));
          return;
        }
        
        // If we were in a list and now we're not
        if (isInList && !line.trim().startsWith('- ') && line.trim() !== '') {
          formattedContent.push(
            <ul key={key++} className="list-disc pl-5 mb-3">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
              ))}
            </ul>
          );
          listItems = [];
          isInList = false;
        }
        
        // Format special symbols and emojis in this line
        let formattedLine = line;
        
        // Handle common emojis
        const emojiMap = {
          '✨': '<span class="text-yellow-300">✨</span>',
          '💡': '<span class="text-yellow-300">💡</span>',
          '📊': '<span class="text-blue-400">📊</span>',
          '✅': '<span class="text-green-400">✅</span>',
          '⭐': '<span class="text-yellow-300">⭐</span>',
          '🔍': '<span class="text-blue-300">🔍</span>',
          '📈': '<span class="text-green-400">📈</span>',
          '🚀': '<span class="text-purple-400">🚀</span>',
          '🎯': '<span class="text-red-400">🎯</span>',
          '👋': '<span class="text-yellow-200">👋</span>',
          '📝': '<span class="text-gray-300">📝</span>',
          '🤔': '<span class="text-yellow-200">🤔</span>',
          '🔗': '<span class="text-blue-300">🔗</span>',
          '📱': '<span class="text-purple-300">📱</span>',
          '🖥️': '<span class="text-blue-300">🖥️</span>',
          '🏢': '<span class="text-gray-300">🏢</span>',
        };
        
        // Replace emojis with styled span elements
        Object.entries(emojiMap).forEach(([emoji, html]) => {
          formattedLine = formattedLine.replace(new RegExp(emoji, 'g'), html);
        });
        
        // Handle special sections like "💡 Insight" without making them bold
        formattedLine = formattedLine.replace(/(💡\s*Insight|✅\s*Success|⭐\s*Why|🔍\s*Details)/g, (match) => {
          return `<span class="text-yellow-300">${match}</span>`;
        });
        
        // Handle sources with brackets
        formattedLine = formattedLine.replace(/\[Source\]/g, '<span class="text-gray-400">[Source]</span>');
        
        // If line is not empty, add it to the current paragraph
        if (line.trim() !== '') {
          currentParagraph.push(formattedLine);
        } 
        // If line is empty and we have paragraph content, finish the paragraph
        else if (currentParagraph.length > 0) {
          const paraText = currentParagraph.join(' ');
          formattedContent.push(
            <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
          );
          currentParagraph = [];
        }
        
        // For an empty line in the input, add an empty paragraph to maintain spacing
        if (line.trim() === '' && !isInList && currentParagraph.length === 0) {
          formattedContent.push(<div key={key++} className="h-3"></div>);
        }
      });
      
      // Add any remaining paragraph content
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ');
        formattedContent.push(
          <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
        );
      }
      
      // Add any remaining list items
      if (isInList && listItems.length > 0) {
        formattedContent.push(
          <ul key={key++} className="list-disc pl-5 mb-3">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
            ))}
          </ul>
        );
      }
      
      return <div className="space-y-0">{formattedContent}</div>;
    }
    
    // If it's not a string, just render a message
    return <p className="text-gray-400">Results are available in raw format</p>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">MCP API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleGetContactDetails}
          disabled={isLoading || !email.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Contact Details
        </button>
        
        <button
          onClick={handleGetAccountDetails}
          disabled={isLoading || !domain.trim()}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Account Details
        </button>
        
        <button
          onClick={handleGetAIResearch}
          disabled={isLoading || !domain.trim()}
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          AI Account Research
        </button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {result && !isLoading && (
        <div className="mb-6">
          <div className="flex border-b border-zinc-700 mb-4">
            <button
              className={`px-4 py-2 ${activeTab === "formatted" ? "border-b-2 border-purple-500 text-white" : "text-zinc-400"}`}
              onClick={() => setActiveTab("formatted")}
            >
              Formatted
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "raw" ? "border-b-2 border-blue-500 text-white" : "text-zinc-400"}`}
              onClick={() => setActiveTab("raw")}
            >
              Raw JSON
            </button>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Results</h2>
          
          <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4 overflow-x-auto">
            {activeTab === "formatted" ? (
              renderFormattedResearch()
            ) : (
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 