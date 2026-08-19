import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';

interface SettingsValues {
  companyName: string;
  tagline: string;
  founderName: string;
  founderBio: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  heroTitle: string;
  heroSubtitle: string;
  statistics: string;
  founderSection: string;
  testimonials: string;
  delighters: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  pinterest: string;
  youtube: string;
  tiktok: string;
  logoUrl: string;
  faviconUrl: string;
  defaultLeadTime: string;
  quoteValidity: string;
  installationMessage: string;
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  openGraphImage: string;
}

const initialValues: SettingsValues = {
  companyName: '',
  tagline: '',
  founderName: '',
  founderBio: '',
  address: 'FHA Guzape, Abuja, Federal Capital Territory, Nigeria.',
  phone: '',
  email: '',
  whatsapp: '',
  heroTitle: '',
  heroSubtitle: '',
  statistics: '',
  founderSection: '',
  testimonials: '',
  delighters: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  pinterest: '',
  youtube: '',
  tiktok: '',
  logoUrl: '',
  faviconUrl: '',
  defaultLeadTime: '',
  quoteValidity: '',
  installationMessage: '',
  siteTitle: '',
  metaDescription: '',
  keywords: '',
  openGraphImage: '',
};

const settingKeys: Array<keyof SettingsValues> = [
  'companyName',
  'tagline',
  'founderName',
  'founderBio',
  'address',
  'phone',
  'email',
  'whatsapp',
  'heroTitle',
  'heroSubtitle',
  'statistics',
  'founderSection',
  'testimonials',
  'delighters',
  'instagram',
  'facebook',
  'linkedin',
  'pinterest',
  'youtube',
  'tiktok',
  'logoUrl',
  'faviconUrl',
  'defaultLeadTime',
  'quoteValidity',
  'installationMessage',
  'siteTitle',
  'metaDescription',
  'keywords',
  'openGraphImage',
];

const fieldLabels: Record<keyof SettingsValues, string> = {
  companyName: 'Company Name',
  tagline: 'Tagline',
  founderName: 'Founder Name',
  founderBio: 'Founder Bio',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  whatsapp: 'WhatsApp',
  heroTitle: 'Hero title',
  heroSubtitle: 'Hero subtitle',
  statistics: 'Statistics',
  founderSection: 'Founder section',
  testimonials: 'Testimonials',
  delighters: 'Delighters',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  logoUrl: 'Logo upload',
  faviconUrl: 'Favicon upload',
  defaultLeadTime: 'Default lead time',
  quoteValidity: 'Quote validity',
  installationMessage: 'Installation message',
  siteTitle: 'Site title',
  metaDescription: 'Meta description',
  keywords: 'Keywords',
  openGraphImage: 'Open Graph image',
};

function buildSettingsPayload(values: SettingsValues) {
  return settingKeys.map((key) => ({
    key,
    value: values[key] || null,
  }));
}

export function Settings() {
  const [values, setValues] = useState<SettingsValues>(initialValues);
  const [loadedValues, setLoadedValues] = useState<SettingsValues>(initialValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.from('settings').select('key, value');

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const loadedValues = { ...initialValues };
      (data ?? []).forEach((item: { key: string; value: string | null }) => {
        if (item.key in loadedValues) {
          (loadedValues as Record<string, string>)[item.key] = item.value ?? '';
        }
      });

      setValues(loadedValues);
      setLoadedValues(loadedValues);
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (key: keyof SettingsValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);

    const payload = buildSettingsPayload(values);
    const { error: upsertError } = await supabase.from('settings').upsert(payload, { onConflict: 'key' });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSuccess('Settings saved successfully.');
    setLoadedValues(values);
    setSaving(false);
  };

  const resetValues = () => {
    setValues(loadedValues);
    setSuccess(null);
    setError(null);
  };

  const renderField = (key: keyof SettingsValues) => {
    const label = fieldLabels[key];
    const value = values[key];
    const isTextArea = ['founderBio', 'statistics', 'founderSection', 'testimonials', 'delighters', 'installationMessage', 'metaDescription', 'keywords'].includes(key);
    const isFile = ['logoUrl', 'faviconUrl', 'openGraphImage'].includes(key);

    return (
      <label key={key} className="block">
        <span className="mb-2 block text-sm font-semibold text-bark/70">{label}</span>
        {isTextArea ? (
          <textarea
            value={value}
            onChange={(event) => handleChange(key, event.target.value)}
            rows={4}
            className="w-full rounded-[1.25rem] border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
          />
        ) : (
          <input
            type={isFile ? 'text' : 'text'}
            value={value}
            onChange={(event) => handleChange(key, event.target.value)}
            placeholder={isFile ? 'Public file URL' : ''}
            className="w-full rounded-[1.25rem] border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
          />
        )}
      </label>
    );
  };

  return (
    <>
      <Helmet>
        <title>Settings | Oak Cherry Kraft Admin</title>
      </Helmet>

      <section className="rounded-[2rem] border border-bark/10 bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-bark/70">Admin settings</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-bark">Studio settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/70">
              Update site copy, social links, branding assets, quote defaults, SEO metadata, and maintenance actions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={saveSettings} loading={saving} disabled={loading}>
              Save settings
            </Button>
            <Button variant="secondary" onClick={resetValues}>
              Reset values
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">Company Information</h2>
            <div className="mt-6 grid gap-4">
              {['companyName', 'tagline', 'founderName', 'founderBio', 'address', 'phone', 'email', 'whatsapp'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">Homepage Content</h2>
            <div className="mt-6 grid gap-4">
              {['heroTitle', 'heroSubtitle', 'statistics', 'founderSection', 'testimonials', 'delighters'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">Social Media</h2>
            <div className="mt-6 grid gap-4">
              {['instagram', 'facebook', 'linkedin', 'pinterest', 'youtube', 'tiktok'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">Branding</h2>
            <div className="mt-6 grid gap-4">
              {['logoUrl', 'faviconUrl'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">Quote Settings</h2>
            <div className="mt-6 grid gap-4">
              {['defaultLeadTime', 'quoteValidity', 'installationMessage'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6">
            <h2 className="text-xl font-semibold text-bark">SEO</h2>
            <div className="mt-6 grid gap-4">
              {['siteTitle', 'metaDescription', 'keywords', 'openGraphImage'].map((key) => renderField(key as keyof SettingsValues))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {success ? <p className="text-sm font-semibold text-emerald-700">{success}</p> : null}
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={resetValues}>
              Reset values
            </Button>
            <Button onClick={saveSettings} loading={saving} disabled={loading}>
              Save settings
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
