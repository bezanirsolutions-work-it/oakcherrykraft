import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useMemo, useState } from 'react';
import logoPath from '../../../public/assets/logo/LOGO.png';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Design Your Furniture', path: '/configuration-selector' },
  { label: 'Gallery', path: '/projects' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const activeClass = 'text-bark border-bark/80';

  const navItems = useMemo(
    () =>
      links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `transition-colors duration-200 ease-brand border-b-2 border-transparent py-1 ${
              isActive ? activeClass : 'hover:text-bark/90 focus-visible:text-bark'
            }`
          }
          onClick={() => setOpen(false)}
        >
          {link.label}
        </NavLink>
      )),
    []
  );

  return (
    <header className="sticky top-0 z-50 border-b border-bark/10 bg-sand/90 shadow-soft backdrop-blur-xl transition duration-300 ease-brand">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-8 sm:py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold tracking-tight text-bark">
          <img src={logoPath} alt="Oak Cherry Kraft logo" className="h-10 w-10 rounded-full object-contain shadow-sm sm:h-11 sm:w-11" />
          <div className="flex flex-col leading-tight">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-bark/90 sm:text-xs">Oak Cherry Kraft</span>
            <span className="hidden text-[0.68rem] uppercase tracking-[0.3em] text-bark/60 sm:block">Artistry Limited</span>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navItems}
          <Link
            to="/request-quote"
            className="btn-base btn-primary h-11 px-5 text-sm font-semibold"
          >
            Request quote
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-sm transition hover:-translate-y-0.5 hover:border-bark/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden border-t border-bark/10 bg-sand px-4 pb-6 sm:px-8 md:hidden"
          >
            <div className="flex flex-col gap-4">{navItems}</div>
            <Link
              to="/request-quote"
              className="btn-base btn-primary mt-4 inline-flex h-11 w-full items-center justify-center px-5 text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              Request quote
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
