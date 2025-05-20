"use client";

import { ChangeEvent, FormEvent, Dispatch, SetStateAction } from "react";

type ChatInputProps = {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSubmit: (e: FormEvent) => void;
  disabled: boolean;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex bg-gray-800 rounded-lg border border-purple-700 p-2"
    >
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Type your message here..."
        className="flex-grow bg-transparent text-white p-2 outline-none resize-none h-12 max-h-32"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 bg-purple-700 text-white rounded ml-2 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing
          </span>
        ) : (
          "Send"
        )}
      </button>
    </form>
  );
} 