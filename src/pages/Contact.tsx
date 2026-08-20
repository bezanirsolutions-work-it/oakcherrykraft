import { useState, type FormEvent } from 'react';
import { SEO } from '../components/layout/SEO';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageCircle, Phone, Send, Clock3, Instagram } from 'lucide-react';
import { emailService } from '../services/email';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { Button, Card, SectionHeader } from '../components/ui';
import { supabase } from '../lib/supabase';
import { BUSINESS_LOCATIONS } from '../lib/locations';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const contactItems = [
  { label: 'Call the studio', value: '07035000174 / 08034291245', href: 'tel:+2347035000174', Icon: Phone },
  { label: 'WhatsApp', value: '08034291245', href: 'https://wa.me/2348034291245', Icon: MessageCircle },
  { label: 'Email', value: 'oakcherrykraft@gmail.com', href: 'mailto:oakcherrykraft@gmail.com', Icon: Mail },
  { label: 'Instagram', value: '@oakcherrykraft', href: 'https://www.instagram.com/oakcherrykraft/?hl=en', Icon: Instagram },
];

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setFeedbackMessage('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const phone = formData.get('phone')?.toString().trim() ?? '';
    const subject = formData.get('subject')?.toString().trim() ?? '';
    const message = formData.get('message')?.toString().trim() ?? '';

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      phone,
      subject,
      message,
    });

    if (error) {
      setStatus('error');
      setFeedbackMessage(error.message || 'There was a problem sending your message. Please try again later.');
      return;
    }

    setStatus('success');
    setFeedbackMessage('Your message has been sent. We will get back to you shortly.');
    form.reset();

    try {
      await emailService.sendEmail({
        to: import.meta.env.VITE_EMAIL_TO || '',
        subject: `New contact enquiry: ${subject || 'No subject'}`,
        body: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\nMessage: ${message}`,
      });
    } catch (err) {
      console.error('Contact notification email failed:', err);
    }
  }

  return (
    <PageContainer className="space-y-14 pb-16 sm:space-y-20 sm:pb-20">
      <SEO
        title="Contact | Oak Cherry Kraft"
        description="Contact Oak Cherry Kraft for bespoke furniture, quotes, and project guidance across Nigeria."
        url="https://oakcherrykraft.com/contact"
      />
      <PageHeader title="Let’s Build Something Beautiful Together" subtitle="Reach out to discuss custom orders, project timelines, or design support for your space. We serve discerning clients across Nigeria." />

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn} className="max-w-3xl">
        <SectionHeader eyebrow="Contact the studio" title="Bring your furniture vision to life with a conversation." description="Reach out to discuss custom orders, project timelines, or design support for your space. We serve discerning clients across Nigeria." />
      </motion.section>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} variants={sectionStagger} className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div className="space-y-5">
          <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
            <Card className="bg-bark text-sand sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-clay">Oak Cherry Kraft Artistry Limited</p>
              <h2 className="mt-5 font-display text-3xl font-semibold text-sand">A thoughtful conversation is where every piece begins.</h2>
              <p className="mt-4 text-base leading-8 text-sand/75">Tell us about your home, office, hotel, or commercial project. We usually respond within one business day.</p>
              <div className="mt-7 flex items-center gap-3 border-t border-sand/15 pt-5 text-sm text-sand/75"><Clock3 size={17} className="text-clay" aria-hidden="true" />Open daily, 8 AM–6 PM</div>
            </Card>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {contactItems.map(({ label, value, href, Icon }) => (
              <motion.a key={label} href={href} variants={fadeIn} whileHover={{ y: -3 }} className="group flex items-start gap-4 rounded-[1.25rem] border border-bark/10 bg-white p-5 shadow-card transition duration-300 hover:shadow-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oak-100 text-oak-700"><Icon size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-bark/55">{label}</span>
                  <span className="mt-2 block overflow-hidden text-sm font-medium text-bark group-hover:text-oak-700" style={{ wordBreak: 'break-word' }}>{value}</span>
                </span>
              </motion.a>
            ))}
          </div>
        </div>

        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
          <Card className="sm:p-9">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Start your project</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-bark">Tell us what you&apos;re imagining.</h2>
            </div>

            {status === 'success' ? (
              <div className="space-y-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-semibold text-emerald-700">✓ Message sent successfully</p>
                <p className="text-sm text-emerald-600">{feedbackMessage}</p>
                <Button variant="secondary" onClick={() => setStatus('idle')} className="w-full">
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="space-y-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
                    <p className="text-sm font-semibold text-rose-700">⚠ Error sending message</p>
                    <p className="text-sm text-rose-600">{feedbackMessage}</p>
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-bark">Name
                    <input name="name" required className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" type="text" placeholder="Your name" />
                  </label>
                  <label className="block text-sm font-medium text-bark">Email
                    <input name="email" required className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" type="email" placeholder="you@example.com" />
                  </label>
                </div>
                <label className="block text-sm font-medium text-bark">Phone number
                  <input name="phone" className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" type="tel" placeholder="0803 429 1245" />
                </label>
                <label className="block text-sm font-medium text-bark">Subject
                  <select name="subject" className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200" defaultValue="">
                    <option value="" disabled>Select an option</option>
                    <option>General Enquiries</option>
                    <option>Residential furniture</option>
                    <option>Office or commercial project</option>
                    <option>Custom cabinetry</option>
                    <option>Outdoor furniture</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-bark">Message
                  <textarea name="message" required className="mt-2 h-36 w-full resize-y rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200" placeholder="Tell us about your space, timeline, and pieces you have in mind." />
                </label>
                <Button type="submit" disabled={status === 'submitting'} className="w-full sm:w-auto" icon={<Send size={17} aria-hidden="true" />}>{status === 'submitting' ? 'Sending…' : 'Send enquiry'}</Button>
              </form>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <motion.section id="locations" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} variants={sectionStagger} className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] border border-bark/10 bg-sand p-7 shadow-card sm:p-10 transition-transform duration-300">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(123,79,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(123,79,42,0.12) 1px, transparent 1px)', backgroundSize: '42px 42px' }} aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bark text-sand" aria-hidden="true"><MapPin size={21} /></span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Our locations</p>
            <div className="mt-4 space-y-5">
              {BUSINESS_LOCATIONS.map((location) => (
                <div key={location.name}>
                  <h2 className="font-display text-3xl font-semibold text-bark">{location.name}</h2>
                  <p className="mt-2 max-w-md text-base leading-8 text-bark/70">{location.address}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
          <Card className="flex flex-col justify-between bg-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Prefer messaging?</p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-bark">Reach us directly on WhatsApp.</h2>
              <p className="mt-3 text-base leading-8 text-bark/70">Send a quick note and we&apos;ll help you take the next step.</p>
            </div>
            <Button variant="secondary" asChild className="mt-8 self-start" icon={<MessageCircle size={17} aria-hidden="true" />}><a href="https://wa.me/2348034291245">WhatsApp the studio</a></Button>
          </Card>
        </motion.div>
      </motion.section>
    </PageContainer>
  );
}
