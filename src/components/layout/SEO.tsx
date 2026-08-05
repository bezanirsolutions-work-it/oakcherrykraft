import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://oakcherrykraft.com';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
}

export function SEO({ title, description, url, image, type = 'website' }: SEOProps) {
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
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Helmet>
  );
}
