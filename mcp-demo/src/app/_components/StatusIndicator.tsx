"use client";

import { LoadingState } from "./ChatInterface";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[rgba(var(--color-surface),0.5)] px-3 py-2 rounded-lg border border-gray-700">
        <div className="flex space-x-1.5">
          <div className="h-2 w-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
          <div className="h-2 w-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <div className="h-2 w-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </div>
  );
}

export default function StatusIndicator({ loadingState }: { loadingState: LoadingState }) {
  return (
    <div className="flex justify-start">
      <div className="bg-[rgba(var(--color-primary),0.1)] px-3 py-2 rounded-lg border border-[rgba(var(--color-primary),0.3)]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 text-[rgb(var(--color-primary))]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="text-sm text-white">{loadingState.step}</span>
        </div>
      </div>
    </div>
  );
} 