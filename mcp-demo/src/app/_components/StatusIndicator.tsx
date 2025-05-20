"use client";

import { LoadingState } from "./ChatInterface";

type StatusIndicatorProps = {
  loadingState: LoadingState;
};

export default function StatusIndicator({ loadingState }: StatusIndicatorProps) {
  if (!loadingState.isLoading || !loadingState.step) {
    return null;
  }

  return (
    <div className="mt-2 px-3 py-2 bg-purple-800/30 rounded text-xs text-white border border-purple-700">
      <div className="flex items-center space-x-2">
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{loadingState.step}</span>
      </div>
      <div className="mt-1 w-full bg-purple-900 rounded-full h-1">
        <div className="bg-purple-500 h-1 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg p-3 bg-gray-700 text-white">
        <div className="flex space-x-2 items-center">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
        </div>
      </div>
    </div>
  );
} 