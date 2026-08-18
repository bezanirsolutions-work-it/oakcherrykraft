import { useEffect, useMemo, useState } from 'react';
import { SEO } from '../components/layout/SEO';
import { ArrowUpRight, Check, Clock3, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { getCachedData } from '../lib/cache';
import { PageContainer } from '../components/layout/PageContainer';
import { Button, EmptyState, LoadingState, SectionHeader } from '../components/ui';
import { getProductImage, normalizeProducts, productSelectColumns, type Product } from '../lib/products';
import { supabase } from '../lib/supabase';
import {
  recordProductsFetchStart,
  recordProductsFetchEnd,
  recordProductsStateUpdate,
  recordImagesStartLoading,
  recordImagesFinishedLoading,
} from '../lib/perfInstrumentation';

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

export function Products() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategoryFilter = categoryParam ?? null;

  useEffect(() => {
    const fetchProducts = async () => {
      recordProductsFetchStart();
      setLoading(true);
      setError(null);

      try {
        const data = await getCachedData<Product[]>(`products:catalog`, 10 * 60 * 1000, async () => {
          const { data, error: fetchError } = await supabase
            .from('products')
            .select(productSelectColumns)
            .in('status', ['published', 'available'])
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (fetchError) {
            throw fetchError;
          }

          return normalizeProducts(data);
        });

        recordProductsFetchEnd();
        recordImagesStartLoading();
        setProducts(data);
        recordProductsStateUpdate();
        
        // Record when images actually finish loading
        setTimeout(() => recordImagesFinishedLoading(), 5000);
      } catch (fetchError) {
        setError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const group = new Map<string, string>();
    products.forEach((product) => {
      const categoryLabel = product.category?.trim();
      if (!categoryLabel) return;
      const slug = normalizeCategorySlug(categoryLabel);
      if (!group.has(slug)) {
        group.set(slug, categoryLabel);
      }
    });
    return Array.from(group.entries()).map(([slug, label]) => ({ slug, label }));
  }, [products]);

  const selectedCategory = activeCategoryFilter
    ? categories.find((item) => item.label === activeCategoryFilter || item.slug === normalizeCategorySlug(activeCategoryFilter))
    : null;

  const selectedCategoryName = selectedCategory?.label ?? null;

  const categoryOptions = useMemo(
    () => [{ slug: 'all', label: 'All' }, ...categories],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (activeCategoryFilter && normalizeCategorySlug(product.category ?? '') !== normalizeCategorySlug(activeCategoryFilter)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [product.name, product.category, product.material, product.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [products, activeCategoryFilter, searchQuery]);

  const shouldShowCategoryNotFound = !loading && Boolean(activeCategoryFilter) && !selectedCategory;

  if (loading) {
    return (
      <PageContainer className="space-y-14 pb-16 sm:space-y-20 sm:pb-20">
        <LoadingState />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="space-y-14 pb-16 sm:space-y-20 sm:pb-20">
        <EmptyState
          title="Unable to load products"
          description={error}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </PageContainer>
    );
  }

  if (shouldShowCategoryNotFound) {
    return (
      <PageContainer className="space-y-14 pb-16 sm:space-y-20 sm:pb-20">
        <EmptyState
          title="Category not found"
          description="The category you requested does not exist. Browse the full collection or select another category."
          action={<Button asChild><Link to="/products">View all products</Link></Button>}
        />
      </PageContainer>
    );
  }

  const pageUrl = activeCategoryFilter
    ? `https://oakcherrykraft.com/products/${encodeURIComponent(activeCategoryFilter)}`
    : 'https://oakcherrykraft.com/products';

  return (
    <PageContainer className="space-y-14 pb-16 sm:space-y-20 sm:pb-20">
      <SEO
        title="Products | Oak Cherry Kraft"
        description="Discover our published furniture collection with live catalogue filtering by category, search, and product details."
        url={pageUrl}
      />

      <PageHeader
        title={selectedCategoryName || 'Furniture Built to Feel Natural, Lasting, and Beautifully Scaled'}
        subtitle="Explore considered pieces for dining, living, bedroom, and custom spaces. Every published design is made to order and can be tailored to your space."
        showBreadcrumb
      />

      <section
        className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end lg:gap-16"
      >
        <SectionHeader
          eyebrow="The collection"
          title={
            selectedCategoryName || 'Furniture built to feel natural, lasting, and beautifully scaled.'
          }
          description="Explore considered pieces for dining, living, bedroom, and custom spaces. Every published design is made to order and can be tailored to your space."
        />
        <p className="max-w-md text-base leading-8 text-bark/65 lg:pb-1">
          Choose a signature form or use the collection as a starting point for a fully bespoke commission.
        </p>
      </section>

      <div
        className="space-y-6"
      >
        <div className="rounded-[1.75rem] border border-bark/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bark/50" />
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, category, material or description"
                className="w-full rounded-full border border-bark/10 bg-sand px-12 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => {
                const destination = option.slug === 'all' ? '/products' : `/products/${encodeURIComponent(option.slug)}`;
                return (
                  <Link
                    key={option.slug}
                    to={destination}
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      option.slug === (categoryParam ?? 'all')
                        ? 'border-bark bg-bark text-sand'
                        : 'border-bark/10 bg-white text-bark hover:border-bark hover:bg-sand'
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No products match your search' : 'No products found'}
            description={
              searchQuery
                ? 'Try another search or clear the filter to see available furniture.'
                : 'There are no published products in this category at the moment. Please check back soon.'
            }
          />
        ) : (
          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredProducts.map((product, index) => {
              const displayImage = getProductImage(product);
              const productSlug = product.slug || product.id;
              const categorySlug = normalizeCategorySlug(product.category || '');
              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[1.5rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:shadow-medium hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-strong">
                    <img
                      src={displayImage}
                      alt={product.name ?? ''}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                      className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-bark shadow-soft">
                      <Check size={13} className="text-oak-600" aria-hidden="true" />
                      {product.status === 'published' || product.status === 'available' ? 'Available to commission' : 'Made to order'}
                    </span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{product.category}</p>
                    <h2 className="mt-3 font-display text-3xl font-semibold text-bark">{product.name}</h2>
                    <p className="mt-3 text-sm leading-7 text-bark/70">{product.description || 'Premium handcrafted furniture.'}</p>
                    <div className="mt-6 flex flex-col gap-3 border-t border-bark/10 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 text-bark/65">
                        <Clock3 size={15} aria-hidden="true" />
                        {product.material || 'Fine wood'}
                      </span>
                      <span className="font-semibold text-bark">{getDisplayPrice(product)}</span>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="px-0"
                          icon={<ArrowUpRight size={16} aria-hidden="true" />}
                        >
                          <Link to={`/products/${categorySlug}/${productSlug}`}>View product</Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild className="px-0" icon={<ArrowUpRight size={16} aria-hidden="true" />}>
                          <Link to="/request-quote">Request quote</Link>
                        </Button>
                      </div>
                      <div className="rounded-[1.75rem] border border-oak-200 bg-oak-50 p-5 text-sm text-bark/80">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Want a custom version?</p>
                        <p className="mt-3 leading-6">Design Your Furniture to create a bespoke version with your preferred dimensions, wood, finish and style.</p>
                        <Button variant="secondary" size="sm" asChild className="mt-5" icon={<ArrowUpRight size={16} aria-hidden="true" />}>
                          <Link
                            to={`/configuration-selector?product=${encodeURIComponent(productSlug)}&productName=${encodeURIComponent(product.name || '')}`}
                            state={{ selectedProduct: product }}
                          >
                            Start designing
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <section
        className="rounded-[2rem] bg-sand p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Need something specific?</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-bark">Start with a sketch, finish with a signature piece.</h2>
        </div>
        <Button asChild className="mt-7 shrink-0 lg:mt-0" icon={<ArrowUpRight size={17} aria-hidden="true" />}>
          <Link to="/contact">Discuss a custom design</Link>
        </Button>
      </section>
    </PageContainer>
  );
}
