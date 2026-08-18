import { useEffect, useState, lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { recordChatWidgetMount, recordLayoutStateChange } from '../../lib/perfInstrumentation';

// Lazy-load ChatWidget to avoid bundling it with critical rendering path
const ChatWidget = lazy(() => import('../chatbot/ChatWidget').then(m => ({ default: m.ChatWidget })));

export function Layout() {
  const [shouldRenderChatWidget, setShouldRenderChatWidget] = useState(false);

  useEffect(() => {
    // Delay ChatWidget rendering until after LCP to avoid blocking critical rendering
    const timer = window.setTimeout(() => {
      const frame = requestAnimationFrame(() => {
        setShouldRenderChatWidget(true);
        recordLayoutStateChange('ChatWidget render state changed to true');
      });
    }, 5000); // 5 second delay after page load

    return () => window.clearTimeout(timer);
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
