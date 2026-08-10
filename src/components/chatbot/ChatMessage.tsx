import { type ReactNode } from 'react';

interface ChatMessageProps {
  author: 'assistant' | 'user';
  content: string;
}

function formatBubbleClasses(author: ChatMessageProps['author']) {
  return author === 'assistant'
    ? 'bg-sand text-bark border border-bark/10 rounded-[1.75rem] rounded-tl-[0.5rem] rounded-br-[1.75rem]'
    : 'bg-bark text-sand rounded-[1.75rem] rounded-tr-[0.5rem] rounded-bl-[1.75rem]';
}

export function ChatMessage({ author, content }: ChatMessageProps) {
  const isAssistant = author === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[84%] text-sm leading-7">
        <div className={formatBubbleClasses(author)}>
          <p className="whitespace-pre-wrap break-words px-4 py-3">{content}</p>
        </div>
      </div>
    </div>
  );
}
