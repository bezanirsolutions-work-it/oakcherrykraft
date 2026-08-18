import { useEffect, useState, lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

// Lazy-load ChatWidget to avoid bundling it with critical rendering path
const ChatWidget = lazy(() => import('../chatbot/ChatWidget').then(m => ({ default: m.ChatWidget })));

export function Layout() {
  const [shouldRenderChatWidget, setShouldRenderChatWidget] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShouldRenderChatWidget(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-sand">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {shouldRenderChatWidget ? (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      ) : null}
    </div>
  );
}
