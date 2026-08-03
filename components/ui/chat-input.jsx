"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatInput — auto-growing textarea + send button, Enter to send (Shift+Enter
 * for newline). Shared by the /coach surface and the global CoachDrawer.
 *
 * @param {{ onSend: (text: string) => void, disabled?: boolean, loading?: boolean, placeholder?: string, className?: string }} props
 */
export default function ChatInput({
  onSend,
  disabled = false,
  loading = false,
  placeholder = "Ask your AI copilot anything…",
  className,
}) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  // Auto-grow up to a max height.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled || loading) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        "glass-strong flex items-end gap-2 rounded-2xl border border-border p-2 shadow-elevated",
        className
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder}
        aria-label="Message your AI copilot"
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || loading || !value.trim()}
        aria-label="Send message"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </div>
  );
}