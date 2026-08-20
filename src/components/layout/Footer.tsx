import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { recordLayoutStateChange } from '../../lib/perfInstrumentation';
import { BUSINESS_LOCATIONS } from '../../lib/locations';

export function Footer() {
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('newsletter-email')?.toString().trim() ?? '';

    if (!email || !email.includes('@') || !email.includes('.')) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address to subscribe.');
      recordLayoutStateChange('Newsletter error message shown');
      return;
    }

    setNewsletterStatus('success');
    setNewsletterMessage('Thanks for subscribing. We will keep you updated with our latest projects and notes.');
    recordLayoutStateChange('Newsletter success message shown');
    form.reset();
  };

  return (
    <footer className="border-t border-bark/10 bg-sand px-4 py-14 text-sm text-bark sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:gap-16">
          <div>
            <p className="font-display text-3xl font-semibold text-bark">Oak Cherry Kraft</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-oak-700">Artistry Limited</p>
            <p className="mt-5 max-w-md leading-7 text-bark">
              Handcrafted furniture made in Nigeria, transforming premium and discarded wood into beautiful pieces designed to last.
            </p>
            <div className="mt-6 flex items-start gap-3 text-sm text-bark">
              <MapPin size={18} className="mt-1 text-oak-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Our locations</p>
                <div className="mt-3 space-y-3">
                  {BUSINESS_LOCATIONS.map((location) => (
                    <div key={location.name}>
                      <p className="font-semibold text-bark">{location.name}</p>
                      <p>{location.address}</p>
                    </div>
                  ))}
                </div>
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
              <Link to="/products" className="text-bark transition hover:text-bark">Products</Link>
              <Link to="/configuration-selector" className="text-bark transition hover:text-bark">Design your furniture</Link>
              <Link to="/contact" className="text-bark transition hover:text-bark">Contact studio</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Studio notes</p>
            <p className="mt-5 leading-7 text-bark">Join our occasional studio newsletter for new work, material stories, and project notes.</p>
            <form className="mt-5 flex flex-col gap-3" onSubmit={handleNewsletterSubmit}>
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="footer-email">Email address</label>
                <input id="footer-email" name="newsletter-email" type="email" required placeholder="Your email" className="min-w-0 flex-1 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" />
                <button type="submit" aria-label="Subscribe to studio notes" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bark text-sand transition hover:-translate-y-0.5 hover:bg-oak-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"><Mail size={17} /></button>
              </div>
              {newsletterMessage ? (
                <p className={`text-sm ${newsletterStatus === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {newsletterMessage}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-bark/10 bg-white p-6 shadow-soft sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-oak-700">Ready to shape your space?</p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-bark">Connect with our studio for furniture that feels refined, resilient, and uniquely yours.</p>
          </div>
          <Link to="/contact" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-bark px-6 text-sm font-semibold text-sand transition hover:-translate-y-0.5 hover:bg-oak-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 lg:mt-0">
            Contact the studio
          </Link>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-bark/10 pt-6 text-xs text-bark sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p>© {new Date().getFullYear()} Oak Cherry Kraft Artistry Limited. All rights reserved.</p>
            <Link to="/privacy-policy" className="transition hover:text-bark">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-bark">Terms</Link>
          </div>
          <a href="mailto:oakcherrykraft@gmail.com" className="inline-flex items-center gap-2 transition hover:text-bark"><Mail size={14} />oakcherrykraft@gmail.com<ArrowUpRight size={13} /></a>
        </div>
      </div>
    </footer>
  );
}
