"use client";

import { useState } from "react";

type EnrichmentDataDisplayProps = {
  enrichmentData: Record<string, unknown>;
};

export default function EnrichmentDataDisplay({
  enrichmentData,
}: EnrichmentDataDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no enrichment data
  if (!enrichmentData || Object.keys(enrichmentData).length === 0) {
    return null;
  }

  return (
    <div className="bg-[rgba(var(--color-primary),0.05)] rounded-md p-3 border border-[rgba(var(--color-primary),0.2)]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white">MadKudu Enrichment Data</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-300 hover:text-white underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-3 text-sm">
          {Object.entries(enrichmentData).map(([key, value]) => (
            <div key={key} className="bg-[rgba(var(--color-surface),0.7)] p-2 rounded border border-gray-700">
              <h4 className="font-medium text-[rgb(var(--color-primary))] mb-1">{key}</h4>
              <div className="text-gray-300 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                {typeof value === "string" ? (
                  value
                ) : (
                  <pre>{JSON.stringify(value, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-300 text-xs">
          <p>Enrichment data available for {Object.keys(enrichmentData).length} categories.</p>
        </div>
      )}
    </div>
  );
} 