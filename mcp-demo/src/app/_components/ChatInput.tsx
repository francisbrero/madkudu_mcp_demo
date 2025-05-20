"use client";

import { useState, useEffect, KeyboardEvent, FormEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  disabled: boolean;
  placeholder?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Type your message here...",
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex rounded-md shadow-lg overflow-hidden bg-[rgba(var(--color-surface),0.8)] border border-gray-700">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-[rgb(var(--color-background))] text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-[rgb(var(--color-primary))] text-white px-6 py-3 font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
} 