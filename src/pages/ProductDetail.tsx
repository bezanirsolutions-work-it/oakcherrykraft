import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import {
  AnimatedImage,
  Badge,
  Button,
  Card,
  Breadcrumb,
  EmptyState,
  LoadingState,
  SectionHeader,
  ImageCarousel,
} from '../components/ui';
import { getCachedData } from '../lib/cache';
import { getProductImage, normalizeProduct, productSelectColumns, type Product } from '../lib/products';
import { supabase } from '../lib/supabase';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const normalizeCategorySlug = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const formatPriceValue = (value?: string | number | null) => {
  if (value == null) return '';
  const stringValue = typeof value === 'number' ? String(value) : value.trim();
  if (!stringValue) return '';
  const numeric = stringValue.replace(/[^0-9.-]/g, '');
  if (!numeric || Number.isNaN(Number(numeric))) return stringValue.trim();
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(numeric));
};

const getDisplayPrice = (product: Product) => {
  const label = product.price_label?.trim();
  if (label) return label;
  const formatted = formatPriceValue(product.price);
  return formatted || 'Contact for price';
};

const buildDimensions = (product: Product) => {
  if (product.dimensions?.trim()) {
    return product.dimensions.trim();
  }

  return null;
};

export function ProductDetail() {
  const { slug } = useParams<{ category?: string; slug?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setError('Product slug is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const product = await getCachedData<Product | null>(`products:${slug}`, 10 * 60 * 1000, async () => {
          const { data, error: fetchError } = await supabase
            .from('products')
            .select(productSelectColumns)
            .eq('slug', slug)
            .in('status', ['published', 'available'])
            .eq('is_active', true)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              throw new Error('Product not found');
            }
            throw fetchError;
          }

          const product = normalizeProduct(data);
          if (product?.status === 'archived') {
            return null;
          }
          return product;
        });

        if (!product) {
          setError('Product not found');
        } else {
          setProduct(product);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const coverImage = getProductImage(product);
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
    return images.filter(Boolean);
  }, [product]);

  const dimensions = product ? buildDimensions(product) : null;

  if (loading) {
    return (
      <PageContainer className="space-y-10 pb-20">
        <LoadingState />
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer className="space-y-10 pb-20">
        <EmptyState
          title="Product not found"
          description={error || 'We could not locate the product you were looking for. Explore the collection or contact our studio for help.'}
          action={<Button asChild><Link to="/products">View all products</Link></Button>}
        />
      </PageContainer>
    );
  }

  const categorySlug = normalizeCategorySlug(product.category || '');

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>{product.name} | Oak Cherry Kraft</title>
        <meta name="description" content={product.description ?? 'Premium handcrafted furniture'} />
      </Helmet>
      <PageHeader title={product.name ?? ''} subtitle={product.description ?? undefined} showBreadcrumb />
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Products', path: '/products' },
          { label: product.category ?? '', path: `/products/${categorySlug}` },
          { label: product.name ?? '' },
        ]}
        className="pt-6"
      />
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
        <SectionHeader eyebrow="Product details" title={product.name ?? ''} description={product.description ?? ''} />

        {galleryImages.length > 0 ? (
          <ImageCarousel images={galleryImages} alt={product.name ?? ''} />
        ) : (
          <AnimatedImage src={coverImage} alt={product.name ?? ''} aspectRatio="4 / 3" overlay />
        )}

        {product.description ? (
          <div className="rounded-[2rem] border border-bark/10 bg-white p-6 text-base leading-8 text-bark/75">
            {product.description}
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Category</p>
            <p className="mt-3 text-lg font-semibold text-bark">{product.category ?? ''}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Material</p>
            <p className="mt-3 text-lg font-semibold text-bark">{product.material || 'Premium wood'}</p>
          </Card>
        </div>

        <div className="rounded-[2rem] border border-bark/10 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center gap-4">
            <Badge className="bg-oak-100 text-oak-700">{product.status === 'published' || product.status === 'available' ? 'Available to commission' : 'Made to order'}</Badge>
            <span className="text-lg font-semibold text-bark">{getDisplayPrice(product)}</span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Finish</p>
              <p className="mt-3 text-lg font-semibold text-bark">{product.finish || 'Hand-finished'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Colour</p>
              <p className="mt-3 text-lg font-semibold text-bark">{product.colour || 'Natural'}</p>
            </div>
            {dimensions ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Dimensions</p>
                <p className="mt-3 text-lg font-semibold text-bark">{dimensions}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild>
              <Link to="/request-quote">Request a quote</Link>
            </Button>
            <Button asChild>
              <Link to="/configuration-selector" state={{ selectedProduct: product }}>Design Your Furniture</Link>
            </Button>
            <Button variant="secondary" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <Link to="/projects">View portfolio</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-sand p-6">
            <h3 className="text-lg font-semibold text-bark">Features</h3>
            {product.features?.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-bark/75">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-bark" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-bark/75">Designed with thoughtful details for enduring use and everyday comfort.</p>
            )}
          </Card>

          <Card className="bg-sand p-6">
            <h3 className="text-lg font-semibold text-bark">Specifications</h3>
            {product.specifications?.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-bark/75">
                {product.specifications.map((spec, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-bark" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-bark/75">Carefully selected materials and dimensions crafted for your space.</p>
            )}
          </Card>
        </div>

        <Card className="bg-sand">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-bark/80">
              <MapPin size={18} aria-hidden="true" />
              <p>Studio and delivery across Nigeria</p>
            </div>
            <div className="flex items-center gap-3 text-bark/80">
              <Clock3 size={18} aria-hidden="true" />
              <p>Custom lead times depend on material availability and scope</p>
            </div>
          </div>
        </Card>
      </motion.section>
    </PageContainer>
  );
}
