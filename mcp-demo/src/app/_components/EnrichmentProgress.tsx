"use client";

import { LoadingState } from "./ChatInterface";

type EnrichmentProgressProps = {
  loadingState: LoadingState;
  showSteps?: boolean;
};

export default function EnrichmentProgress({ 
  loadingState, 
  showSteps = true 
}: EnrichmentProgressProps) {
  // Define the steps in the enrichment process
  const steps = [
    "Extracting context",
    "Identifying entities",
    "Retrieving enrichment",
    "Generating response"
  ];

  // Determine the current step index
  const getCurrentStepIndex = () => {
    if (!loadingState.step) return -1;
    
    if (loadingState.step.includes("Extracting")) return 0;
    if (loadingState.step.includes("Identifying")) return 1;
    if (loadingState.step.includes("Retrieving")) return 2;
    if (loadingState.step.includes("Generating")) return 3;
    
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  if (!loadingState.isLoading) {
    return null;
  }

  return (
    <div className="mt-2 px-3 py-2 bg-purple-800/10 rounded-lg border border-purple-700/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-purple-300">MadKudu Enrichment Progress</h4>
        <span className="text-xs text-purple-400">{currentStepIndex >= 0 ? `${Math.round((currentStepIndex + 1) / steps.length * 100)}%` : ""}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-purple-900/50 rounded-full h-1.5 mb-3">
        <div 
          className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0}%` }}
        ></div>
      </div>
      
      {/* Step indicators */}
      {showSteps && (
        <div className="grid grid-cols-4 gap-1 mt-1">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center mb-1 
                ${index < currentStepIndex ? 'bg-green-500' : 
                  index === currentStepIndex ? 'bg-yellow-500 animate-pulse' : 'bg-gray-700'}`}>
                {index < currentStepIndex && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <span className={`text-[10px] text-center leading-tight ${
                index === currentStepIndex ? 'text-yellow-300' : 
                index < currentStepIndex ? 'text-green-400' : 'text-gray-500'
              }`}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 