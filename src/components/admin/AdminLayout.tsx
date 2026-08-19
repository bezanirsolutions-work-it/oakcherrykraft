import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Globe2, X, Menu, Home, MessageSquare, FileText, Box, Settings, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui';
import { supabase } from '../../lib/supabase';
import { getProfileName } from '../../lib/profile';

interface AdminLayoutProps {
  children?: ReactNode;
  title?: string;
}

const navItems: { label: string; path: string; icon?: any }[] = [
  { label: 'Dashboard', path: '/admin', icon: Home },
  { label: 'Live Chat', path: '/admin/live-chat', icon: MessageSquare },
  { label: 'Testimonials', path: '/admin/testimonials', icon: FileText },
  { label: 'Quotes', path: '/admin/quotes', icon: FileText },
  { label: 'Configurator Requests', path: '/admin/configurator', icon: Box },
  { label: 'Contact Messages', path: '/admin/contacts', icon: Users },
  { label: 'Products', path: '/admin/products', icon: Box },
  { label: 'Projects', path: '/admin/projects', icon: Box },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children, title = 'Admin Dashboard' }: AdminLayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('oak-cherry-admin-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [adminName, setAdminName] = useState('Admin');
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => {
    const current = navItems.find((item) => item.path === location.pathname);
    return current ? current.label : title;
  }, [location.pathname, title]);

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNavOpen(false);
      }
    };
    if (isNavOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isNavOpen]);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('oak-cherry-admin-sidebar-collapsed', isCollapsed.toString());
    } catch {
      // localStorage not available
    }
  }, [isCollapsed]);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      try {
        const profileName = await getProfileName(session.user.id);
        if (profileName) {
          setAdminName(profileName);
        }
      } catch {
        // fall back to the default label if the profile lookup is unavailable
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand text-bark antialiased">
      <div className="lg:flex">
        <div 
          className={isNavOpen ? 'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden' : 'hidden'} 
          onClick={() => setIsNavOpen(false)}
          role="presentation"
        />

        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-50 transform bg-white shadow-soft transition-all duration-200 lg:relative lg:block lg:shadow-none ${
            isNavOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
          } ${
            isCollapsed ? 'lg:w-20' : 'lg:w-72'
          } min-h-screen flex flex-col ${
            isCollapsed ? 'px-2 py-4 lg:px-3 lg:py-6' : 'px-4 py-6 lg:px-6 lg:py-8'
          }`}
        >
          <div className={`flex items-center justify-between ${
            isCollapsed ? 'mb-6' : 'mb-8'
          } px-2`}>
            <div className={`flex items-center ${
              isCollapsed ? 'gap-0 justify-center w-full' : 'gap-3'
            }`}>
              <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-[1.75rem] bg-oak-100 text-oak-700 font-bold text-sm lg:text-base flex-shrink-0">
                OC
              </div>
              {!isCollapsed && (
                <div className="hidden lg:block">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/90">Studio admin</p>
                  <h1 className="mt-2 text-2xl font-semibold text-bark">Oak Cherry</h1>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsNavOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 text-bark hover:bg-sand transition"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setIsNavOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center justify-center lg:justify-start rounded-[1.5rem] px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-oak-600 text-white shadow-soft' : 'text-bark/75 hover:bg-sand hover:text-bark'
                  } ${
                    isCollapsed ? 'lg:px-3' : 'lg:px-4'
                  }`
                }
              >
                {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-bark/10 pt-6 space-y-3">
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand' : 'Collapse'}
              className="hidden lg:flex w-full items-center justify-center rounded-full border border-bark/10 bg-sand px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
            >
              {isCollapsed ? '→' : '←'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-full border border-bark/10 bg-sand px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
            >
              {isCollapsed ? 'Out' : 'Logout'}
            </button>
          </div>
        </aside>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 transition-all duration-200">
          <div className={`${
            isCollapsed ? 'max-w-7xl' : 'max-w-6xl'
          } mx-auto transition-all duration-200`}>
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setIsNavOpen((open) => !open)}
                aria-expanded={isNavOpen}
                aria-controls="admin-sidebar"
                aria-label="Toggle admin navigation"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-soft transition hover:bg-bark/5"
              >
                <Menu size={20} />
              </button>

              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-bark/90">Admin menu</p>
            </div>

            <header className="mb-8 rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/90">
                    {pageTitle}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-bark">
                    {pageTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/90">
                    Manage quote requests, configurator selections, messages, and studio operations from the admin dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="group rounded-full px-4 transition hover:bg-bark/5"
                  >
                    <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <span className="sr-only">View Website</span>
                      <Globe2 size={16} className="text-bark transition group-hover:text-bark" />
                      <span className="hidden sm:inline">View Website</span>
                    </a>
                  </Button>

                  <div className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
                    <p className="text-xs uppercase tracking-[0.35em] text-bark/90">{adminName}</p>
                    <p className="mt-2 font-semibold">Studio admin</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
                    <p className="text-xs uppercase tracking-[0.35em] text-bark/90">Today</p>
                    <p className="mt-2 font-semibold">{currentDate}</p>
                  </div>
                </div>
              </div>
            </header>

            <main>{children ?? <Outlet />}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
