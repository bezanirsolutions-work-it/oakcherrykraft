import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-bark/10 bg-sand px-4 py-14 text-sm text-bark/70 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:gap-16">
          <div>
            <p className="font-display text-3xl font-semibold text-bark">Oak Cherry Kraft</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-oak-700">Artistry Limited</p>
            <p className="mt-5 max-w-md leading-7 text-bark/75">
              Handcrafted furniture made in Nigeria, transforming premium and discarded wood into beautiful pieces designed to last.
            </p>
            <div className="mt-6 flex items-start gap-3 text-sm text-bark/75">
              <MapPin size={18} className="mt-1 text-oak-700" aria-hidden="true" />
              <div>
                <p className="font-semibold text-bark">FHA Guzape</p>
                <p>Abuja, Federal Capital Territory, Nigeria</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a href="https://www.instagram.com/oakcherrykraft/?hl=en" target="_blank" rel="noreferrer noopener" aria-label="Oak Cherry Kraft on Instagram (@oakcherrykraft)" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 bg-white text-bark transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"><Instagram size={17} /></a>
              <a href="https://www.facebook.com/oakcherrykraft" target="_blank" rel="noreferrer noopener" aria-label="Oak Cherry Kraft on Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 bg-white text-bark transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"><Facebook size={17} /></a>
              <a href="https://www.linkedin.com/company/oak-cherry-kraft" target="_blank" rel="noreferrer noopener" aria-label="Oak Cherry Kraft on LinkedIn" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 bg-white text-bark transition hover:-translate-y-1 hover:shadow-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"><Linkedin size={17} /></a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Explore</p>
            <div className="mt-5 flex flex-col gap-4">
              <Link to="/products" className="text-bark/80 transition hover:text-bark">Products</Link>
              <Link to="/configuration-selector" className="text-bark/80 transition hover:text-bark">Design your furniture</Link>
              <Link to="/contact" className="text-bark/80 transition hover:text-bark">Contact studio</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Studio notes</p>
            <p className="mt-5 leading-7 text-bark/75">Join our occasional studio newsletter for new work, material stories, and project notes.</p>
            <form className="mt-5 flex gap-2" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="footer-email">Email address</label>
              <input id="footer-email" type="email" required placeholder="Your email" className="min-w-0 flex-1 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" />
              <button type="submit" aria-label="Subscribe to studio notes" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bark text-sand transition hover:-translate-y-0.5 hover:bg-oak-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"><Mail size={17} /></button>
            </form>
          </div>
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-bark/10 bg-white p-6 shadow-soft sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-oak-700">Ready to shape your space?</p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-bark/75">Connect with our studio for furniture that feels refined, resilient, and uniquely yours.</p>
          </div>
          <Link to="/contact" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-bark px-6 text-sm font-semibold text-sand transition hover:-translate-y-0.5 hover:bg-oak-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 lg:mt-0">
            Contact the studio
          </Link>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-bark/10 pt-6 text-xs text-bark/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Oak Cherry Kraft Artistry Limited. All rights reserved.</p>
          <a href="mailto:oakcherrykraft@gmail.com" className="inline-flex items-center gap-2 transition hover:text-bark"><Mail size={14} />oakcherrykraft@gmail.com<ArrowUpRight size={13} /></a>
        </div>
      </div>
    </footer>
  );
}
