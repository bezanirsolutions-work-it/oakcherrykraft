import { Helmet } from 'react-helmet-async';
import { BUSINESS_LOCATIONS } from '../../lib/locations';

export const SITE_URL = 'https://oakcherrykraft.com';
export const DEFAULT_SEO_IMAGE = `${SITE_URL}/assets/about-page.webp`;

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Oak Cherry Kraft',
      url: SITE_URL,
      description:
        'Oak Cherry Kraft creates handcrafted furniture and bespoke commissions for residential and commercial spaces in Nigeria.',
    },
    {
      '@type': 'LocalBusiness',
      name: 'Oak Cherry Kraft Artistry Limited',
      alternateName: 'Oak Cherry Kraft',
      foundingDate: '2023',
      url: SITE_URL,
      description:
        'Oak Cherry Kraft creates bespoke handcrafted furniture and custom pieces for homes, offices, and commercial spaces across Nigeria.',
      image: DEFAULT_SEO_IMAGE,
      areaServed: 'Nigeria',
      address: BUSINESS_LOCATIONS.map((location) => ({
        '@type': 'PostalAddress',
        streetAddress: location.streetAddress,
        addressLocality: location.city,
        addressRegion: location.region,
        addressCountry: 'NG',
      })),
      location: BUSINESS_LOCATIONS.map((location) => ({
        '@type': 'Place',
        name: `${location.name}, ${location.address}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: location.streetAddress,
          addressLocality: location.city,
          addressRegion: location.region,
          addressCountry: 'NG',
        },
      })),
      openingHours: 'Mo-Sa 08:00-18:00',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:00',
          closes: '18:00',
        },
      ],
    },
  ],
};

export function SEO({ title, description, url, image, type = 'website' }: SEOProps) {
  const socialImage = image ?? DEFAULT_SEO_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {url ? <link rel="canonical" href={url} /> : null}
      <meta property="og:site_name" content="Oak Cherry Kraft" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="en_US" />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:image" content={socialImage} />
      <meta name="twitter:card" content={socialImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
