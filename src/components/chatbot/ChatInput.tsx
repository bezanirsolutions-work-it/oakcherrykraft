import { type KeyboardEvent, useRef, useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatFileSize, validateAttachments, getFileIcon } from '../../lib/attachmentUtils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, attachments: File[]) => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        handleSend();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files) return;

    const validation = validateAttachments(Array.from(files));
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid files');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    setFileError(null);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed && selectedFiles.length === 0) {
      return;
    }
    onSend(trimmed, selectedFiles);
    onChange('');
    setSelectedFiles([]);
    setFileError(null);
  };

  return (
    <div className="rounded-[1.75rem] border border-bark/10 bg-white p-3 shadow-soft">
      {/* Attachments Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 rounded-lg border border-bark/10 bg-sand/30 p-3">
          <p className="text-xs font-semibold text-bark mb-2">Attachments ({selectedFiles.length})</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between gap-2 bg-white rounded-lg p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{getFileIcon(file.type)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-bark truncate">{file.name}</p>
                    <p className="text-xs text-bark/60">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0 p-1 text-bark/60 hover:text-bark transition"
                  aria-label="Remove file"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {fileError && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-2">
          <p className="text-xs text-red-700">{fileError}</p>
        </div>
      )}

      <label htmlFor="oak-chat-input" className="sr-only">
        Type your message
      </label>
      <div className="flex items-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="oak-chat-file-input"
          aria-label="Select files to attach"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach files"
          title="Attach files"
          className="flex-shrink-0 h-11 w-11 inline-flex items-center justify-center rounded-full border border-bark/20 bg-white/95 text-bark shadow-sm shadow-bark/10 transition hover:bg-sand disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bark/40"
        >
          <Paperclip size={18} />
        </button>
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
          disabled={disabled || (!value.trim() && selectedFiles.length === 0)}
          aria-label="Send message"
          className="h-11 w-11 p-0"
          onClick={handleSend}
        >
          <Send size={18} aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-1 text-xs text-bark/60">Press Enter to send, Shift+Enter for a new line. Attach files with the 📎 button.</p>
    </div>
  );
}

