"use client";

import { useState } from "react";

interface EnrichmentDataDisplayProps {
  enrichmentData: Record<string, unknown>;
}

export default function EnrichmentDataDisplay({ enrichmentData }: EnrichmentDataDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (Object.keys(enrichmentData).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-4 border border-purple-300 rounded-lg p-2 bg-purple-950/30 text-sm">
      <h3 className="text-purple-300 font-semibold mb-2">MadKudu Enrichment Data</h3>
      
      {Object.entries(enrichmentData).map(([key, value]) => (
        <div key={key} className="mb-2">
          <button
            onClick={() => toggleSection(key)}
            className="flex justify-between w-full text-left py-1 px-2 bg-purple-800/50 hover:bg-purple-700/50 rounded"
          >
            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
            <span>{expandedSections[key] ? '▼' : '►'}</span>
          </button>
          
          {expandedSections[key] && (
            <pre className="p-2 bg-gray-900 rounded mt-1 text-xs overflow-auto max-h-60">
              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
} 