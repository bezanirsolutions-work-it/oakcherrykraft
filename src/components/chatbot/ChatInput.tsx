import { type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-bark/10 bg-white p-3 shadow-soft">
      <label htmlFor="oak-chat-input" className="sr-only">
        Type your message
      </label>
      <div className="flex items-end gap-3">
        <textarea
          id="oak-chat-input"
          aria-label="Type your message"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask OAKIES a question..."
          className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-bark/10 bg-sand/80 px-4 py-3 text-sm leading-6 text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled}
          aria-label="Send message"
          className="h-11 w-11 p-0"
          onClick={onSend}
        >
          <Send size={18} aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-1 text-xs text-bark/60">Press Enter to send, Shift+Enter for a new line.</p>
    </div>
  );
}
