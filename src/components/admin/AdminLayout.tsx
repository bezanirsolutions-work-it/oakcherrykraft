import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminLayoutProps {
  children?: ReactNode;
  title?: string;
}

const navItems = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Quotes', path: '/admin/quotes' },
  { label: 'Contact Messages', path: '/admin/contacts' },
  { label: 'Products', path: '/admin/products' },
  { label: 'Settings', path: '/admin/settings' },
];

export function AdminLayout({ children, title = 'Admin Dashboard' }: AdminLayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
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
      localStorage.setItem('admin-sidebar-collapsed', isCollapsed.toString());
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

      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', session.user.id).single();

      if (data?.full_name) {
        setAdminName(data.full_name);
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
          className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white px-4 py-6 shadow-soft transition duration-200 lg:relative lg:block lg:w-72 lg:px-6 lg:py-8 lg:shadow-none ${
            isNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } min-h-screen flex flex-col`}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.75rem] bg-oak-100 text-oak-700 font-bold">
                OC
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Studio admin</p>
                <h1 className="mt-2 text-2xl font-semibold text-bark">Oak Cherry</h1>
              </div>
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
                className={({ isActive }) =>
                  `flex items-center rounded-[1.5rem] px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-oak-600 text-white shadow-soft' : 'text-bark/75 hover:bg-sand hover:text-bark'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-bark/10 pt-6">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-full border border-bark/10 bg-sand px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
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

              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-bark/60">Admin menu</p>
            </div>

            <header className="mb-8 rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">{pageTitle}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-bark">{pageTitle}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/70">
                    Manage quote requests, configurator selections, messages, and studio operations from the admin dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
                    <p className="text-xs uppercase tracking-[0.35em] text-bark/60">{adminName}</p>
                    <p className="mt-2 font-semibold">Studio admin</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
                    <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Today</p>
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
