import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChatWidget } from '../chatbot/ChatWidget';

export function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <ChatWidget />
    </>
  );
}
