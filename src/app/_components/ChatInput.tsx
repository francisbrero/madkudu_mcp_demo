"use client";

import { useState, useEffect, KeyboardEvent, FormEvent, ChangeEvent } from "react";
import { Agent } from "./ChatInterface";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  selectedAgent: Agent | null;
  placeholder?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  selectedAgent,
  placeholder = "Type your message here...",
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  // Dynamic placeholder based on selected agent
  const getPlaceholder = () => {
    if (!selectedAgent) return "Select an agent to start chatting...";
    
    switch (selectedAgent.inputType) {
      case "email":
        return "Enter an email address...";
      case "domain":
        return "Enter a company domain...";
      default:
        return placeholder;
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex rounded-md shadow-lg overflow-hidden bg-gray-900 border border-gray-700">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        disabled={isLoading || !selectedAgent}
        className="flex-1 px-4 py-3 bg-gray-800 text-white focus:outline-none focus:border-blue-500 border-0"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim() || !selectedAgent}
        className="bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
} 