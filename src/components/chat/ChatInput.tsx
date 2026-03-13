"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-c3 bg-c1 px-4 py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tell Veil what you need..."
          disabled={disabled}
          rows={1}
          className={clsx(
            "flex-1 bg-c2 border border-c3 px-4 py-2.5",
            "font-mono text-sm text-c12 placeholder:text-c5",
            "resize-none outline-none",
            "transition-colors duration-150",
            "focus:border-accent",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "max-h-40"
          )}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={clsx(
            "shrink-0 w-10 h-10 flex items-center justify-center",
            "bg-c2 border border-c3",
            "text-c5 transition-all duration-150",
            "hover:border-c4 hover:text-c12",
            "disabled:opacity-40 disabled:pointer-events-none",
            "cursor-pointer"
          )}
          aria-label="Send message"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
