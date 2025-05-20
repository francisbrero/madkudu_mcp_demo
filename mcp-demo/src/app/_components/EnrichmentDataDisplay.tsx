"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface EnrichmentDataDisplayProps {
  enrichmentData: Record<string, unknown>;
}

export default function EnrichmentDataDisplay({ enrichmentData }: EnrichmentDataDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    // Expand Research Context by default for better UX
    "Research Context": true
  });
  
  // Debug: Log when component renders and what data it receives
  useEffect(() => {
    console.log("[EnrichmentDataDisplay] Rendering with data:", enrichmentData);
    console.log("[EnrichmentDataDisplay] Keys:", Object.keys(enrichmentData));
  }, [enrichmentData]);

  const toggleSection = (section: string) => {
    console.log("[EnrichmentDataDisplay] Toggling section:", section);
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (Object.keys(enrichmentData).length === 0) {
    console.log("[EnrichmentDataDisplay] No enrichment data, not rendering");
    return null;
  }

  return (
    <div className="mt-4 mb-4 border border-purple-300 rounded-lg p-2 bg-purple-950/30 text-sm">
      <h3 className="text-purple-300 font-semibold mb-2">MadKudu Enrichment Data</h3>
      
      {Object.entries(enrichmentData).map(([key, value]) => {
        console.log("[EnrichmentDataDisplay] Rendering section:", key);
        return (
          <div key={key} className="mb-2">
            <button
              onClick={() => toggleSection(key)}
              className="flex justify-between w-full text-left py-1 px-2 bg-purple-800/50 hover:bg-purple-700/50 rounded"
            >
              <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
              <span>{expandedSections[key] ? '▼' : '►'}</span>
            </button>
            
            {expandedSections[key] && (
              <div className="p-2 bg-gray-900 rounded mt-1 text-xs overflow-auto max-h-60">
                {(() => {
                  // Handle different possible data formats
                  if (typeof value === 'string') {
                    if (value.trim() === '' || value === 'No research data found') {
                      return <div className="text-gray-500">No data available</div>;
                    }

                    // For Research Context, render as markdown
                    if (key === 'Research Context') {
                      return (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>
                            {value}
                          </ReactMarkdown>
                        </div>
                      );
                    }
                    
                    // Regular text for other sections
                    return <pre>{value}</pre>;
                  }
                  
                  // If it's an object/array, stringify it
                  if (value !== null && typeof value === 'object') {
                    try {
                      return <pre>{JSON.stringify(value, null, 2)}</pre>;
                    } catch (error) {
                      console.error(`[EnrichmentDataDisplay] Error stringifying object:`, error);
                      return <div className="text-red-500">Error displaying data</div>;
                    }
                  }
                  
                  // Fallback for other types
                  return <pre>{String(value)}</pre>;
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 