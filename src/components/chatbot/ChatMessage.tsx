import { useEffect, useState, type ReactNode } from 'react';
import { getFileIcon, formatFileSize } from '../../lib/attachmentUtils';
import { normalizeAttachmentPath, requestAttachmentSignedUrl } from '../../lib/attachmentClient';

interface Attachment {
  name: string;
  type: string;
  size: number;
  path: string;
}

interface ChatMessageProps {
  author: 'assistant' | 'user';
  content: string;
  attachments?: Attachment[];
}

function formatBubbleClasses(author: ChatMessageProps['author']) {
  return author === 'assistant'
    ? 'bg-sand text-bark border border-bark/10 rounded-[1.75rem] rounded-tl-[0.5rem] rounded-br-[1.75rem]'
    : 'bg-bark text-sand rounded-[1.75rem] rounded-tr-[0.5rem] rounded-bl-[1.75rem]';
}

function AttachmentLink({ attachment, isAssistant }: { attachment: Attachment; isAssistant: boolean }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const path = normalizeAttachmentPath(attachment.path);
        if (!path) throw new Error('Attachment could not be loaded.');

        const sessionId = typeof window !== 'undefined' ? window.localStorage.getItem('live-chat-session-id') ?? undefined : undefined;
        const visitorToken = typeof window !== 'undefined' ? window.localStorage.getItem('live-chat-visitor-token') ?? undefined : undefined;
        const response = await requestAttachmentSignedUrl(path, { sessionId, visitorToken });

        if (!active) return;
        setSignedUrl(response.url);
        setError(null);
      } catch {
        if (!active) return;
        setError('Attachment could not be loaded.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [attachment.path]);

  if (loading) {
    return <div className="text-xs opacity-70">Loading attachment...</div>;
  }

  if (error || !signedUrl) {
    return <span className="text-xs text-red-600">Attachment could not be loaded.</span>;
  }

  const isImage = attachment.type.startsWith('image/');

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noreferrer" title={`${attachment.name} (${formatFileSize(attachment.size)})`}>
        <img src={signedUrl} alt={attachment.name} className="max-w-full rounded-lg border border-current border-opacity-10" />
      </a>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noreferrer"
      download={attachment.name}
      className={`underline break-all text-xs ${
        isAssistant ? 'text-oak-600 hover:text-oak-700' : 'text-sand/80 hover:text-sand'
      }`}
      title={`${attachment.name} (${formatFileSize(attachment.size)})`}
    >
      {attachment.name}
    </a>
  );
}

export function ChatMessage({ author, content, attachments }: ChatMessageProps) {
  const isAssistant = author === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[96%] text-sm leading-7">
        <div className={formatBubbleClasses(author)}>
          {content && (
            <p className="whitespace-pre-wrap break-words px-5 py-2" style={{ lineHeight: '1.6' }}>
              {content}
            </p>
          )}
          {attachments && attachments.length > 0 && (
            <div className={`${content ? 'border-t border-current border-opacity-10' : ''} px-5 py-2 space-y-2`}>
              {attachments.map((attachment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-lg">{getFileIcon(attachment.type)}</span>
                  <AttachmentLink attachment={attachment} isAssistant={isAssistant} />
                  <span className="text-xs opacity-70">({formatFileSize(attachment.size)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
