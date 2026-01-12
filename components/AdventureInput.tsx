import React, { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
};

const AdventureInput = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onSend, placeholder, disabled = false, rows = 2 }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      const ta = (ref as any)?.current || innerRef.current;
      if (!ta) return;
      ta.style.height = 'auto';
      // clamp max height so it behaves like a textarea with overflow
      const max = 160; // px
      ta.style.height = Math.min(max, ta.scrollHeight) + 'px';
    }, [value, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled) onSend();
      }
    };

    return (
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        autoCapitalize="none"
        autoCorrect="off"
        className="flex-1 w-full bg-skyrim-paper/40 border border-skyrim-border rounded-lg p-3 text-sm text-skyrim-text placeholder-gray-500 resize-none focus:border-skyrim-gold focus:ring-1 focus:ring-skyrim-gold/50 disabled:opacity-50 font-sans normal-case min-h-[44px] max-h-40 overflow-auto"
        aria-label="Adventure input"
      />
    );
  }
);

export default AdventureInput;
