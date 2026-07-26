import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArrowUpRight, Check, Clock3, Eye, Image, Layers, Paintbrush, Pencil, Search, Tag, Text, Trash2, X, CalendarDays } from 'lucide-react';
import { Button, EmptyState, LoadingState, ImageCarousel } from '../../components/ui';
import { supabase } from '../../lib/supabase';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  summary?: string;
  status?: string;
  price?: string;
  price_label?: string;
  material?: string;
  finish?: string;
  colour?: string;
  dimensions?: string;
  height?: string;
  width?: string;
  depth?: string;
  dimensionUnit?: string;
  description?: string;
  features?: string[];
  specifications?: string[];
  image_urls?: string[];
  cover_image?: string;
  image?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
  wood?: string;
}

const productDimensionUnits = ['mm', 'cm', 'm', 'in', 'ft'];

const generateSafeSlug = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `product-${Date.now()}`;
};

const isValidUuid = (value?: string | null) => {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value.trim());
};

const parseDimensionsString = (dimensions?: string) => {
  if (!dimensions) {
    return { height: '', width: '', depth: '', dimensionUnit: '' };
  }

  const normalized = dimensions.trim();
  const match = normalized.match(/^([\d.]+)\s*[x×]\s*([\d.]+)(?:\s*[x×]\s*([\d.]+))?\s*(mm|cm|m|in|ft)?$/i);

  if (!match) {
    return { height: '', width: '', depth: '', dimensionUnit: '' };
  }

  const [, height = '', width = '', depth = '', dimensionUnit = ''] = match;
  return {
    height,
    width,
    depth: depth || '',
    dimensionUnit: dimensionUnit.toLowerCase(),
  };
};

const buildDimensionsString = (values: Product) => {
  const parts = [values.height?.trim(), values.width?.trim(), values.depth?.trim()].filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  const joined = parts.join(' x ');
  return values.dimensionUnit?.trim() ? `${joined} ${values.dimensionUnit.trim()}` : joined;
};

const ensureUniqueSlug = async (baseSlug: string) => {
  const slug = generateSafeSlug(baseSlug);
  const { data, error } = await supabase
    .from('products')
    .select('slug');

  if (error) {
    return `${slug}-${Date.now()}`;
  }

  const existingSlugs = new Set<string>((data ?? [])
    .map((product) => product.slug ?? '')
    .filter(Boolean));

  if (!existingSlugs.has(slug)) {
    return slug;
  }

  let suffix = 2;
  let candidate = `${slug}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${slug}-${suffix}`;
  }
  return candidate;
};

const formatDate = (value: string | undefined | null) => {
  if (!value) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const detailValue = (value: string | undefined | string[] | null) => {
  if (value == null) return 'Not provided';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Not provided';
  }
  return String(value).trim() || 'Not provided';
};

const formatPriceValue = (value?: string | number | null) => {
  const text = value == null ? '' : String(value).trim();
  if (!text) return 'Not provided';
  const numeric = text.replace(/[^0-9.-]/g, '');
  if (!numeric || Number.isNaN(Number(numeric))) return text;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(numeric));
};

const getDisplayPrice = (product: Product) => {
  const label = String(product.price_label ?? '').trim();
  if (label) return label;
  return formatPriceValue(product.price);
};

const statusBadgeClass = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'in stock':
    case 'available to commission':
      return 'bg-emerald-100 text-emerald-700';
    case 'limited run':
    case 'limited':
      return 'bg-amber-100 text-amber-700';
    case 'sold out':
    case 'unavailable':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-sand text-bark';
  }
};

const productStatusOptions = ['draft', 'published', 'archived'];
const productCategoryOptions = [
  'Dining Tables',
  'Coffee Tables',
  'TV Units',
  'Wardrobes',
  'Kitchen Cabinets',
  'Shelving',
  'Office Furniture',
  'Bedroom Furniture',
  'Outdoor Furniture',
  'Custom Furniture',
];
const productMaterialOptions = [
  'Solid Oak',
  'Mahogany',
  'Walnut',
  'Teak',
  'Pine',
  'Birch',
  'MDF',
  'Plywood',
  'Veneer',
  'Mixed Wood',
];
const productFinishOptions = ['Natural Oil', 'Matte', 'Satin', 'Gloss', 'Painted', 'Stained', 'Lacquered', 'Waxed'];
const productColourOptions = ['Natural', 'Amber', 'Chocolate', 'Espresso', 'Black', 'White', 'Grey', 'Blue', 'Green', 'Red'];


const optionsWithCurrentValue = (options: string[], currentValue: string) =>
  currentValue && !options.includes(currentValue) ? [currentValue, ...options] : options;

const generateSeoTitle = (name: string, category: string) => `${name} | ${category} | Oak Cherry Kraft`;
const generateMetaDescription = (name: string, category: string, material: string, finish: string) => {
  const finishText = finish ? ` with a ${finish.toLowerCase()} finish` : '';
  const materialText = material && material !== 'Custom Timber' ? ` crafted from ${material.toLowerCase()}` : '';
  return `${name} is a premium ${category.toLowerCase()}${materialText}${finishText}, designed for elegant, handcrafted living spaces. Contact Oak Cherry Kraft for a bespoke quote.`;
};

const generateAltText = (name: string, material: string, finish: string, colour: string) => {
  const materialText = material && material !== 'Custom Timber' ? ` in ${material.toLowerCase()}` : '';
  const finishText = finish ? ` with a ${finish.toLowerCase()} finish` : '';
  const colourText = colour ? ` in ${colour.toLowerCase()}` : '';
  return `${name}${materialText}${finishText}${colourText}`.trim();
};

export function ProductsAdmin() {
  const blankProductValues: Product = {
    id: '',
    name: '',
    category: '',
    summary: '',
    status: 'draft',
    price: '',
    price_label: '',
    material: '',
    finish: '',
    colour: '',
    dimensions: '',
    height: '',
    width: '',
    depth: '',
    dimensionUnit: '',
    description: '',
    features: [],
    specifications: [],
    image_urls: [],
    cover_image: '',
    image: '',
    images: [],
    created_at: '',
    updated_at: '',
    wood: '',
  };

  const [productList, setProductList] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadProductsError, setLoadProductsError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Product>(blankProductValues);
  const [createFormValues, setCreateFormValues] = useState<Product>(blankProductValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedUploadCoverIndex, setSelectedUploadCoverIndex] = useState(0);
  const [formFeaturesText, setFormFeaturesText] = useState('');
  const [formSpecificationsText, setFormSpecificationsText] = useState('');
  const [createFeaturesText, setCreateFeaturesText] = useState('');
  const [createSpecificationsText, setCreateSpecificationsText] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create' | null>(null);
  const [slugEdited, setSlugEdited] = useState({ create: false, edit: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<{ id: string; message: string; variant: 'success' | 'error' }[]>([]);
  const [confirmation, setConfirmation] = useState<{
    action: 'archive' | 'delete';
    product: Product | null;
    title: string;
    description: string;
    confirmLabel: string;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [draggedPreviewIndex, setDraggedPreviewIndex] = useState<number | null>(null);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [galleryOrder, setGalleryOrder] = useState<string[]>([]);
  const galleryOrderRef = useRef<string[]>([]);
  const bucket = (import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'product-images').trim() || 'product-images';
  const maxImageSize = 8 * 1024 * 1024;
  const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

  const getStoragePathFromPublicUrl = (imageUrl: string) => {
    try {
      const url = new URL(imageUrl);
      const segments = url.pathname.split('/').filter(Boolean);
      const publicIndex = segments.indexOf('public');
      if (publicIndex >= 0 && segments.length > publicIndex + 2) {
        return segments.slice(publicIndex + 2).join('/');
      }
      const bucketIndex = segments.findIndex((segment) => segment === bucket);
      if (bucketIndex >= 0) {
        return segments.slice(bucketIndex + 1).join('/');
      }
    } catch {
      return null;
    }

    return null;
  };

  const deleteStorageFile = async (imageUrl: string) => {
    const path = getStoragePathFromPublicUrl(imageUrl);
    if (!path) return false;

    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  };

  const validateImageFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];
    const seenKeys = new Set<string>();

    files.forEach((file) => {
      const fileKey = `${file.name.toLowerCase()}|${file.size}|${file.type}`;

      if (!acceptedImageTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported image type.`);
        return;
      }

      if (file.size > maxImageSize) {
        errors.push(`${file.name}: File exceeds ${Math.round(maxImageSize / 1024 / 1024)}MB.`);
        return;
      }

      if (seenKeys.has(fileKey) || selectedImageFiles.some((existing) => `${existing.name.toLowerCase()}|${existing.size}|${existing.type}` === fileKey)) {
        errors.push(`${file.name}: Duplicate image skipped.`);
        return;
      }

      seenKeys.add(fileKey);
      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const addImageFiles = (files: File[]) => {
    const { validFiles, errors } = validateImageFiles(files);

    if (errors.length > 0) {
      setImageError(errors.join(' '));
    }

    if (validFiles.length === 0) {
      return;
    }

    setSelectedImageFiles((current) => [...current, ...validFiles]);
    setSelectedUploadCoverIndex((current) => (current >= 0 ? current : 0));
    setImageError(null);
    setImageMessage(null);
  };

  const handleDropFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    addImageFiles(imageFiles);
  };

  const handleImageFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    addImageFiles(Array.from(event.target.files));
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedImageFiles((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      if (selectedUploadCoverIndex >= next.length) {
        setSelectedUploadCoverIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const fetchAllProducts = async () => {
    setIsLoadingProducts(true);
    setLoadProductsError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const allProducts = (data as Product[]) || [];
      setProductList(allProducts);
      if (allProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(allProducts[0].id);
      }
    } catch (err) {
      setLoadProductsError(err instanceof Error ? err.message : 'Failed to load products');
      setProductList([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const selectedCount = selectedProductIds.length;
  const isAllSelected = productList.length > 0 && selectedCount === productList.length;

  const addToast = (message: string, variant: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const openConfirmation = (action: 'archive' | 'delete', product: Product) => {
    setConfirmation({
      action,
      product,
      title: action === 'archive' ? 'Archive product?' : 'Delete product?',
      description: action === 'archive'
        ? `Archiving ${product.name} will remove it from public listings without deleting its data.`
        : `Deleting ${product.name} will permanently remove it from the product catalog.`,
      confirmLabel: action === 'archive' ? 'Archive product' : 'Delete product',
    });
  };

  const closeConfirmation = () => setConfirmation(null);

  const toastVariantClass = (variant: 'success' | 'error') =>
    variant === 'success'
      ? 'bg-emerald-600 text-white'
      : 'bg-red-600 text-white';

  const reorderArray = <T,>(items: T[], fromIndex: number, toIndex: number) => {
    const next = [...items];
    const [movedItem] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, movedItem);
    return next;
  };

  const moveIndex = (index: number, fromIndex: number, toIndex: number) => {
    if (index === fromIndex) return toIndex;
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return index + 1;
    return index;
  };

  const handleConfirmAction = async () => {
    if (isProcessing || !confirmation?.product) return;
    if (confirmation.action === 'archive') {
      await handleArchive(confirmation.product);
    } else {
      await handleDelete(confirmation.product);
    }
  };

  const handleDropzoneDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDropzoneDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDropzoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  };

  const handleDropzoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (!event.dataTransfer.files?.length) return;
    handleDropFiles(event.dataTransfer.files);
  };

  const handlePreviewDragStart = (index: number) => {
    setDraggedPreviewIndex(index);
  };

  const handlePreviewDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (draggedPreviewIndex === null || draggedPreviewIndex === index) return;
    setSelectedImageFiles((current) => reorderArray(current, draggedPreviewIndex, index));
    setSelectedUploadCoverIndex((current) => moveIndex(current, draggedPreviewIndex, index));
    setDraggedPreviewIndex(index);
  };

  const handlePreviewDragEnd = () => {
    setDraggedPreviewIndex(null);
  };

  const handleGalleryDragStart = (index: number) => {
    setDraggedGalleryIndex(index);
  };

  const arraysEqual = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

  const persistGalleryOrder = async (nextOrder: string[]) => {
    if (!selectedProduct) return;
    const currentOrder = selectedProduct.image_urls ?? selectedProduct.images ?? [];
    if (arraysEqual(nextOrder, currentOrder)) return;

    setIsUploadingImages(true);
    setImageError(null);
    setImageMessage(null);

    const { error } = await supabase
      .from('products')
      .update({ image_urls: nextOrder })
      .eq('id', selectedProduct.id);

    setIsUploadingImages(false);

    if (error) {
      setImageError(`Unable to save image order: ${error.message}`);
      return;
    }

    setImageMessage('Image order saved.');
    setGalleryOrder(nextOrder);
    galleryOrderRef.current = nextOrder;
    setFormValues((current) => ({
      ...current,
      image_urls: nextOrder,
      images: nextOrder,
      cover_image: current.cover_image || current.image || nextOrder[0] || '',
      image: current.cover_image || current.image || nextOrder[0] || '',
    }));
    setProductList((current) =>
      current.map((item) =>
        item.id === selectedProduct.id
          ? {
              ...item,
              image_urls: nextOrder,
              images: nextOrder,
              cover_image: item.cover_image || item.image || nextOrder[0] || '',
              image: item.cover_image || item.image || nextOrder[0] || '',
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleGalleryDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (draggedGalleryIndex === null || draggedGalleryIndex === index) return;
    const nextOrder = reorderArray(galleryOrder, draggedGalleryIndex, index);
    setGalleryOrder(nextOrder);
    galleryOrderRef.current = nextOrder;
    setDraggedGalleryIndex(index);
  };

  const handleGalleryDragEnd = async () => {
    setDraggedGalleryIndex(null);
    await persistGalleryOrder(galleryOrderRef.current);
  };

  const selectedProduct = useMemo(
    () => productList.find((item) => item.id === selectedProductId) ?? null,
    [productList, selectedProductId]
  );

  useEffect(() => {
    if (!selectedProduct) {
      setGalleryOrder([]);
      galleryOrderRef.current = [];
      return;
    }

    const images = selectedProduct.image_urls ?? selectedProduct.images ?? [];
    const coverImage = selectedProduct.cover_image ?? selectedProduct.image;
    const ordered = coverImage ? [coverImage, ...images] : images;
    const newOrder = Array.from(new Set(ordered.filter(Boolean)));
    setGalleryOrder(newOrder);
    galleryOrderRef.current = newOrder;
  }, [selectedProduct]);

  const filteredProductList = productList.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProductIds((current) =>
      isAllSelected ? [] : productList.map((product) => product.id)
    );
  };

  const handleBulkStatusUpdate = async (status: string, label: string) => {
    if (selectedCount === 0) {
      setActionMessage(null);
      setActionError(`Select one or more products to ${label.toLowerCase()}.`);
      return;
    }

    const confirmed = window.confirm(
      `Set ${selectedCount} selected product${selectedCount === 1 ? '' : 's'} to ${label.toLowerCase()}?`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setActionMessage(null);
    setActionError(null);

    const { error } = await supabase
      .from('products')
      .update({ status })
      .in('id', selectedProductIds);

    setIsProcessing(false);

    if (error) {
      setActionError(`Unable to update products: ${error.message}`);
      return;
    }

    setActionMessage(`Updated ${selectedCount} product${selectedCount === 1 ? '' : 's'} to ${label}.`);
    setProductList((current) =>
      current.map((item) =>
        selectedProductIds.includes(item.id)
          ? { ...item, status, updated_at: new Date().toISOString() }
          : item
      )
    );
  };

  const handleBulkPublish = () => handleBulkStatusUpdate('available', 'Publish');
  const handleBulkDraft = () => handleBulkStatusUpdate('draft', 'Draft');
  const handleBulkArchive = () => handleBulkStatusUpdate('archived', 'Archive');

  const handleBulkDelete = async () => {
    if (selectedCount === 0) {
      setActionMessage(null);
      setActionError('Select one or more products to delete.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedCount} selected product${selectedCount === 1 ? '' : 's'}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setActionMessage(null);
    setActionError(null);

    const uuidIds = selectedProductIds.filter(isValidUuid);
    const localOnlyIds = selectedProductIds.filter((id) => !isValidUuid(id));

    if (uuidIds.length > 0) {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', uuidIds);

      if (error) {
        setIsProcessing(false);
        setActionError(`Unable to delete products: ${error.message}`);
        return;
      }
    }

    const allRemovedIds = [...uuidIds, ...localOnlyIds];
    const updatedProducts = productList.filter((item) => !allRemovedIds.includes(item.id));
    setProductList(updatedProducts);
    setSelectedProductIds([]);
    if (selectedProductId && selectedProductIds.includes(selectedProductId)) {
      setSelectedProductId(updatedProducts[0]?.id ?? null);
      setDrawerMode(null);
    }

    setIsProcessing(false);
    setActionMessage(`Deleted ${selectedCount} product${selectedCount === 1 ? '' : 's'}.`);
  };

  const openProductPanel = (productId: string, mode: 'view' | 'edit') => {
    setSelectedProductId(productId);
    setDrawerMode(mode);
    setActionError(null);
    setActionMessage(null);
  };

  useEffect(() => {
    if (!selectedProduct) return;

    const dimensionParts = parseDimensionsString(selectedProduct.dimensions);

    setFormValues({
      id: selectedProduct.id,
      name: selectedProduct.name,
      slug: selectedProduct.slug ?? '',
      category: selectedProduct.category,
      summary: selectedProduct.summary ?? '',
      status: selectedProduct.status ?? '',
      price: selectedProduct.price ?? '',
      price_label: selectedProduct.price_label ?? '',
      material: selectedProduct.material ?? selectedProduct.wood ?? '',
      finish: selectedProduct.finish ?? '',
      colour: selectedProduct.colour ?? '',
      dimensions: selectedProduct.dimensions ?? '',
      height: dimensionParts.height,
      width: dimensionParts.width,
      depth: dimensionParts.depth,
      dimensionUnit: dimensionParts.dimensionUnit,
      description: selectedProduct.description ?? '',
      features: selectedProduct.features ?? [],
      specifications: selectedProduct.specifications ?? [],
      image_urls: selectedProduct.image_urls ?? selectedProduct.images ?? [],
      cover_image: selectedProduct.cover_image ?? selectedProduct.image ?? '',
      image: selectedProduct.image ?? '',
      images: selectedProduct.images ?? [],
      created_at: selectedProduct.created_at ?? '',
      updated_at: selectedProduct.updated_at ?? '',
      wood: selectedProduct.wood ?? '',
    });

    setFormFeaturesText((selectedProduct.features ?? []).join('\n'));
    setFormSpecificationsText((selectedProduct.specifications ?? []).join('\n'));
    setSaveMessage(null);
    setSaveError(null);
  }, [selectedProduct]);

  const galleryImages = useMemo(() => {
    if (!selectedProduct) return [] as string[];
    if (galleryOrder.length > 0) return galleryOrder;
    const images = selectedProduct.image_urls ?? selectedProduct.images ?? [];
    const coverImage = selectedProduct.cover_image ?? selectedProduct.image;
    if (coverImage && !images.includes(coverImage)) {
      return [coverImage, ...images];
    }
    return images;
  }, [selectedProduct, galleryOrder]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedImageFiles([]);
      setImagePreviews([]);
      setImageMessage(null);
      setImageError(null);
      setUploadProgress(null);
      return;
    }

    setFormValues((current) => ({
      ...current,
      image_urls: selectedProduct.image_urls ?? selectedProduct.images ?? [],
      cover_image: selectedProduct.cover_image ?? selectedProduct.image ?? '',
      images: selectedProduct.images ?? [],
      image: selectedProduct.image ?? '',
    }));
  }, [selectedProduct]);

  useEffect(() => {
    const urls = selectedImageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImageFiles]);

  const updateFormField = (field: keyof Product, value: string, isCreate: boolean) => {
    const setter = isCreate ? setCreateFormValues : setFormValues;
    const errorSetter = isCreate ? setCreateFormErrors : setFormErrors;

    setter((current) => {
      const next = { ...current, [field]: value };

      if (field === 'name') {
        const currentAutoSlug = generateSafeSlug(current.name ?? '');
        const shouldUpdateSlug = !current.slug || current.slug === currentAutoSlug;
        if (shouldUpdateSlug) {
          next.slug = generateSafeSlug(value);
        }
      }

      return next;
    });

    if (field === 'slug') {
      setSlugEdited((current) => ({ ...current, [isCreate ? 'create' : 'edit']: true }));
    }

    errorSetter((current) => ({ ...current, [field]: '' }));
  };

  const handleInputChange = (field: keyof Product, value: string) => updateFormField(field, value, false);
  const handleCreateInputChange = (field: keyof Product, value: string) => updateFormField(field, value, true);

  const parseMultilineList = (value: string) =>
    value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  const addListItem = (field: 'features' | 'specifications', value: string, isCreate: boolean) => {
    const item = value.trim();
    if (!item) return;
    const setter = isCreate ? setCreateFormValues : setFormValues;
    setter((current) => {
      const values = current[field] ?? [];
      if (values.some((existing) => existing.toLowerCase() === item.toLowerCase())) return current;
      return { ...current, [field]: [...values, item] };
    });
    if (field === 'features') setFormFeaturesText('');
    else setFormSpecificationsText('');
  };

  const removeListItem = (field: 'features' | 'specifications', index: number, isCreate: boolean) => {
    const setter = isCreate ? setCreateFormValues : setFormValues;
    setter((current) => ({ ...current, [field]: (current[field] ?? []).filter((_, itemIndex) => itemIndex !== index) }));
  };

  const getSafeFileName = (file: File) => file.name.replace(/[^a-zA-Z0-9._-]/g, '-');

  const uploadImagesToStorage = async (files: File[], productId = selectedProduct?.id) => {
    if (!productId) {
      throw new Error('No selected product for image upload.');
    }

    const uploadedUrls: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const filename = getSafeFileName(file);
      const path = `products/${productId}/${Date.now()}-${filename}`;
      setUploadProgress(`Uploading ${index + 1} of ${files.length}...`);

      console.log('Upload start', {
        productId,
        bucket,
        path,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          isFile: file instanceof File,
        },
      });

      if (!(file instanceof File)) {
        throw new Error('Upload target is not a File object.');
      }

      if (!file.size || file.size <= 0) {
        throw new Error('Upload target is an empty file.');
      }

      if (!file.type || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
        throw new Error(`Unsupported file type for upload: ${file.type || 'unknown'}`);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Auth session:', sessionData);
      console.log('Bucket:', bucket);
      console.log('Uploading:', filename);

      const uploadResult = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      console.log('Upload result:', uploadResult);
      console.log('Upload data:', uploadResult.data);
      console.log('Upload error:', uploadResult.error);

      if (uploadResult.error) {
        console.error('Upload error message:', uploadResult.error.message);
        console.error('Upload error statusCode:', (uploadResult.error as { statusCode?: number }).statusCode);
        console.error('Upload error payload:', JSON.stringify(uploadResult.error));
        throw new Error(uploadResult.error.message);
      }

      const listResult = await supabase.storage.from(bucket).list();
      console.log('Bucket list after upload:', listResult);

      const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrlData = publicUrlResult.data;
      console.log('Public URL:', publicUrlData?.publicUrl ?? null);
      if (!publicUrlData?.publicUrl) {
        throw new Error('Unable to get image public URL.');
      }

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleUploadImages = async () => {
    if (!selectedProduct) {
      setImageError('Select a product before uploading images.');
      return;
    }

    if (selectedImageFiles.length === 0) {
      setImageError('Choose at least one image to upload.');
      return;
    }

    setIsUploadingImages(true);
    setImageError(null);
    setImageMessage(null);

    try {
      const uploadedUrls = await uploadImagesToStorage(selectedImageFiles);
      const updatedImages = [...(selectedProduct.image_urls ?? selectedProduct.images ?? []), ...uploadedUrls];
      const coverUrl = selectedProduct.cover_image || selectedProduct.image || uploadedUrls[0] || '';

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_urls: updatedImages, cover_image: coverUrl })
        .eq('id', selectedProduct.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSelectedImageFiles([]);
      setUploadProgress(null);
      setImageMessage('Images uploaded successfully.');
      setImageError(null);
      setFormValues((current) => ({
        ...current,
        image_urls: updatedImages,
        cover_image: coverUrl,
        images: updatedImages,
        image: coverUrl,
      }));

      setProductList((current) =>
        current.map((item) =>
          item.id === selectedProduct.id
            ? {
                ...item,
                image_urls: updatedImages,
                cover_image: coverUrl,
                images: updatedImages,
                image: coverUrl,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Unable to upload images.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSetCoverImage = async (imageUrl: string) => {
    if (!selectedProduct) {
      setImageError('No product selected.');
      return;
    }

    if ((selectedProduct.cover_image ?? selectedProduct.image) === imageUrl) return;

    setIsUploadingImages(true);
    setImageError(null);
    setImageMessage(null);

    const { error: updateError } = await supabase
      .from('products')
      .update({ cover_image: imageUrl })
      .eq('id', selectedProduct.id);

    setIsUploadingImages(false);

    if (updateError) {
      setImageError(`Unable to set cover image: ${updateError.message}`);
      return;
    }

    setImageMessage('Cover image updated successfully.');
    setFormValues((current) => ({
      ...current,
      cover_image: imageUrl,
      image: imageUrl,
    }));

    setProductList((current) =>
      current.map((item) =>
        item.id === selectedProduct.id
          ? {
              ...item,
              cover_image: imageUrl,
              image: imageUrl,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedProduct) {
      setImageError('No product selected.');
      return;
    }

    const confirmed = window.confirm('Delete this image from the product?');
    if (!confirmed) return;

    setIsUploadingImages(true);
    setImageError(null);
    setImageMessage(null);

    const remainingImages = (selectedProduct.image_urls ?? selectedProduct.images ?? []).filter((src) => src !== imageUrl);
    const currentCover = selectedProduct.cover_image ?? selectedProduct.image ?? '';
    const nextCover = currentCover === imageUrl ? remainingImages[0] ?? '' : currentCover;

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_urls: remainingImages, cover_image: nextCover })
      .eq('id', selectedProduct.id);

    setIsUploadingImages(false);

    if (updateError) {
      setImageError(`Unable to delete image: ${updateError.message}`);
      return;
    }

    setImageMessage('Image deleted successfully.');
    setFormValues((current) => ({
      ...current,
      image_urls: remainingImages,
      cover_image: nextCover,
      images: remainingImages,
      image: nextCover,
    }));

    setProductList((current) =>
      current.map((item) =>
        item.id === selectedProduct.id
          ? {
              ...item,
              image_urls: remainingImages,
              cover_image: nextCover,
              images: remainingImages,
              image: nextCover,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    const storageDeleted = await deleteStorageFile(imageUrl);
    if (!storageDeleted) {
      setImageError('Image removed from the product, but storage cleanup failed.');
    }
  };

  const handleReplaceImage = async (oldImageUrl: string, files: FileList | null) => {
    if (!selectedProduct) {
      setImageError('No product selected.');
      return;
    }

    if (!files?.length) return;

    const singleFile = files[0];
    const { validFiles, errors } = validateImageFiles([singleFile]);

    if (errors.length > 0) {
      setImageError(errors.join(' '));
      return;
    }

    setIsUploadingImages(true);
    setImageError(null);
    setImageMessage(null);

    try {
      const uploadedUrls = await uploadImagesToStorage([singleFile], selectedProduct.id);
      const [newUrl] = uploadedUrls;
      const currentImages = selectedProduct.image_urls ?? selectedProduct.images ?? [];
      const updatedImages = currentImages.map((src) => (src === oldImageUrl ? newUrl : src));
      const isReplacingCover = (selectedProduct.cover_image ?? selectedProduct.image) === oldImageUrl;
      const nextCover = isReplacingCover ? newUrl : selectedProduct.cover_image ?? selectedProduct.image ?? updatedImages[0] ?? '';

      const { error } = await supabase
        .from('products')
        .update({ image_urls: updatedImages, cover_image: nextCover })
        .eq('id', selectedProduct.id);

      if (error) {
        throw error;
      }

      setImageMessage('Image replaced successfully.');
      setFormValues((current) => ({
        ...current,
        image_urls: updatedImages,
        cover_image: nextCover,
        images: updatedImages,
        image: nextCover,
      }));

      setProductList((current) =>
        current.map((item) =>
          item.id === selectedProduct.id
            ? {
                ...item,
                image_urls: updatedImages,
                cover_image: nextCover,
                images: updatedImages,
                image: nextCover,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setGalleryOrder(updatedImages);
      galleryOrderRef.current = updatedImages;
      await deleteStorageFile(oldImageUrl);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Unable to replace image.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      setSaveMessage(null);
      setSaveError('No product selected.');
      addToast('No product selected to update.', 'error');
      return;
    }

    const errors = validateForm(formValues, false);
    if (Object.keys(errors).length > 0) {
      setSaveMessage(null);
      setSaveError('Please fix the highlighted fields.');
      addToast('Please fix the highlighted fields before saving.', 'error');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const updatedDimensions = buildDimensionsString(formValues);
    const updatePayload: Partial<Product> = omitUndefined({
      name: safeString(formValues.name),
      slug: safeString(formValues.slug),
      category: safeString(formValues.category),
      status: safeString(formValues.status),
      price: normalizePriceValue(formValues.price),
      price_label: safeString(formValues.price_label),
      material: safeString(formValues.material),
      finish: safeString(formValues.finish),
      colour: safeString(formValues.colour),
      dimensions: updatedDimensions,
      description: safeString(formValues.description),
      features: parseMultilineList(formFeaturesText),
      specifications: parseMultilineList(formSpecificationsText),
      image_urls: formValues.image_urls ?? formValues.images ?? [],
      cover_image: formValues.cover_image ?? formValues.image ?? '',
    });

    const { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', selectedProduct?.id);

    setIsSaving(false);

    if (updateError) {
      setSaveError(`Unable to save product: ${updateError.message}`);
      addToast(`Unable to save product: ${updateError.message}`, 'error');
      return;
    }

    setSaveMessage('Product saved successfully.');
    setSaveError(null);
    addToast('Product updated successfully.', 'success');

    setProductList((current) =>
      current.map((item) =>
        item.id === selectedProduct.id
          ? {
              ...item,
              ...updatePayload,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
    setDrawerMode(null);
  };

  const handleCreate = async () => {
    const errors = validateForm(createFormValues, true);
    if (Object.keys(errors).length > 0) {
      const message = 'Please fix the highlighted fields before creating a product.';
      setCreateMessage(null);
      setCreateError('Please fix the highlighted fields.');
      addToast(message, 'error');
      return;
    }

    setIsProcessing(true);
    setCreateMessage(null);
    setCreateError(null);

    const insertPayload: Partial<Product> = omitUndefined({
      name: safeString(createFormValues.name),
      slug: slugEdited.create ? safeString(createFormValues.slug) : await ensureUniqueSlug(createFormValues.name),
      category: safeString(createFormValues.category),
      status: safeString(createFormValues.status),
      price: normalizePriceValue(createFormValues.price),
      price_label: safeString(createFormValues.price_label),
      material: safeString(createFormValues.material),
      finish: safeString(createFormValues.finish),
      colour: safeString(createFormValues.colour),
      dimensions: buildDimensionsString(createFormValues),
      description: safeString(createFormValues.description),
      features: parseMultilineList(createFeaturesText),
      specifications: parseMultilineList(createSpecificationsText),
      image_urls: createFormValues.image_urls ?? [],
      cover_image: createFormValues.cover_image ?? '',
    });

    // Ensure we do not send an explicit `id` field in the insert payload
    const payloadToInsert = { ...insertPayload } as Partial<Product>;
    delete (payloadToInsert as any).id;

    const { data, error: insertError } = await supabase
      .from('products')
      .insert([payloadToInsert])
      .select('*')
      .single();

    if (insertError || !data) {
      setIsProcessing(false);
      const errorMessage = `Unable to create product: ${insertError?.message ?? 'Unknown error'}`;
      setCreateError(errorMessage);
      addToast(errorMessage, 'error');
      return;
    }

    let newProduct = data as Product;
    let imageUploadFailed = false;

    if (selectedImageFiles.length > 0) {
      try {
        const uploadedUrls = await uploadImagesToStorage(selectedImageFiles, newProduct.id);
        const imageUrls = [...(newProduct.image_urls ?? []), ...uploadedUrls];
        const coverImage = newProduct.cover_image || uploadedUrls[selectedUploadCoverIndex] || uploadedUrls[0] || '';
        const { error: imageUpdateError } = await supabase
          .from('products')
          .update({ image_urls: imageUrls, cover_image: coverImage })
          .eq('id', newProduct.id);
        if (imageUpdateError) throw new Error(imageUpdateError.message);
        newProduct = { ...newProduct, image_urls: imageUrls, cover_image: coverImage };
        setSelectedImageFiles([]);
        setSelectedUploadCoverIndex(0);
        setUploadProgress(null);
      } catch (error) {
        imageUploadFailed = true;
        const errorMessage = `Product created, but images could not be saved: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setCreateError(null);
        addToast(errorMessage, 'error');
      }
    }

    setIsProcessing(false);
    setProductList((current) => [newProduct, ...current]);
    setSelectedProductId(newProduct.id);
    setDrawerMode(null);
    setCreateFormValues(blankProductValues);
    setCreateFeaturesText('');
    setCreateSpecificationsText('');

    if (!imageUploadFailed) {
      addToast('Product created successfully.', 'success');
    }
  };

  const handleArchive = async (productToArchive: Product | null = selectedProduct) => {
    if (!productToArchive) {
      setActionMessage(null);
      setActionError('No product selected to archive.');
      return;
    }

    setIsProcessing(true);
    setActionMessage(null);
    setActionError(null);

    const targetProductId = (productToArchive?.id ?? selectedProduct?.id ?? '').trim();
    if (!targetProductId) {
      setActionMessage(null);
      setActionError('Unable to archive product: invalid product ID.');
      return;
    }

    const { error: archiveError } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', targetProductId);

    setIsProcessing(false);

    if (archiveError) {
      addToast(`Unable to archive product: ${archiveError.message}`, 'error');
      setActionError(`Unable to archive product: ${archiveError.message}`);
      return;
    }

    addToast(`${productToArchive.name} archived successfully.`, 'success');
    setActionMessage('Product archived successfully.');
    setConfirmation(null);
    setProductList((current) =>
      current.map((item) =>
        item.id === productToArchive.id
          ? {
              ...item,
              status: 'archived',
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleDelete = async (productToDelete: Product | null = selectedProduct) => {
    if (!productToDelete) {
      setActionMessage(null);
      setActionError('No product selected to delete.');
      addToast('No product selected to delete.', 'error');
      return;
    }

    const idToDelete = productToDelete.id?.trim();
    if (!idToDelete) {
      setActionMessage(null);
      setActionError('Unable to delete product: invalid product ID.');
      return;
    }

    const targetProductId = (productToDelete?.id ?? selectedProduct?.id ?? '').trim();

    // If the ID is not a UUID (e.g. seeded slug id), skip server call and remove locally.
    if (!isValidUuid(idToDelete)) {
      setProductList((current) => {
        const updated = current.filter((item) => item.id !== idToDelete);
        if (selectedProductId === idToDelete) {
          setSelectedProductId(updated[0]?.id ?? null);
          setDrawerMode(null);
        }
        return updated;
      });
      setIsProcessing(false);
      setActionMessage('Product deleted locally.');
      setConfirmation(null);
      addToast(`${productToDelete.name} deleted successfully.`, 'success');
      return;
    }

    setIsProcessing(true);
    setActionMessage(null);
    setActionError(null);

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', targetProductId);

    if (deleteError) {
      setIsProcessing(false);
      addToast(`Unable to delete product: ${deleteError.message}`, 'error');
      setActionError(`Unable to delete product: ${deleteError.message}`);
      return;
    }

    addToast(`${productToDelete.name} deleted successfully.`, 'success');
    setProductList((current) => {
      const updated = current.filter((item) => item.id !== idToDelete);
      if (selectedProductId === idToDelete) {
        setSelectedProductId(updated[0]?.id ?? null);
        setDrawerMode(null);
      }
      return updated;
    });

    setIsProcessing(false);
    setActionMessage('Product deleted successfully.');
    setConfirmation(null);
  };

  const safeString = (value?: string | null) => (value ?? '').trim();
  const normalizePriceValue = (value?: string | null) => {
    const trimmed = safeString(value).replace(/,/g, '');
    return trimmed === '' ? undefined : trimmed;
  };
  const isValidPrice = (value?: string | null) => {
    const normalized = normalizePriceValue(value);
    if (!normalized) return false;
    return /^\d+(?:\.\d+)?$/.test(normalized);
  };
  const omitUndefined = <T extends Record<string, unknown>>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;

  const isCreate = drawerMode === 'create';
  const currentFormValues = isCreate ? createFormValues : formValues;
  const currentFormErrors = isCreate ? createFormErrors : formErrors;
  const currentFeaturesText = isCreate ? createFeaturesText : formFeaturesText;
  const currentSpecificationsText = isCreate ? createSpecificationsText : formSpecificationsText;
  const currentError = (field: keyof Product) => currentFormErrors[field] ?? '';
  const currentValue = (field: keyof Product) => {
    const value = currentFormValues[field];
    return Array.isArray(value) ? value.join(', ') : value ?? '';
  };
  const isSlugEdited = slugEdited[drawerMode === 'create' ? 'create' : 'edit'];
  const handleCurrentInputChange = (field: keyof Product, value: string) => {
    if (drawerMode === 'create') {
      handleCreateInputChange(field, value);
    } else {
      handleInputChange(field, value);
    }
  };
  const fieldInputClass = (field: keyof Product) =>
    `mt-3 w-full rounded-[1.25rem] border px-4 py-3 text-base text-bark outline-none transition focus:ring-4 ${
      currentError(field)
        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
        : 'border-bark/10 bg-white focus:border-oak-600 focus:ring-oak-200'
    }`;
  const fieldTextAreaClass = (field: keyof Product) =>
    `mt-3 w-full rounded-[1.25rem] border px-4 py-3 text-base text-bark outline-none transition focus:ring-4 ${
      currentError(field)
        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
        : 'border-bark/10 bg-white focus:border-oak-600 focus:ring-oak-200'
    }`;
  const renderProductFormFields = () => (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Name</span>
          <input
            value={currentValue('name')}
            onChange={(event) => handleCurrentInputChange('name', event.target.value)}
            className={fieldInputClass('name')}
          />
          {currentError('name') ? <p className="mt-2 text-sm text-red-700">{currentError('name')}</p> : null}
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Slug</span>
          <input
            value={currentValue('slug')}
            readOnly
            className={`${fieldInputClass('slug')} cursor-not-allowed bg-bark/5`}
            placeholder="auto-generated from name"
          />
          <p className="mt-3 text-sm text-bark/60">
            Automatically generated from the product name.
          </p>
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Category</span>
          <select
            value={currentValue('category')}
            onChange={(event) => handleCurrentInputChange('category', event.target.value)}
            className={fieldInputClass('category')}
          >
            <option value="">Select category</option>
            {optionsWithCurrentValue(productCategoryOptions, currentValue('category')).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {currentError('category') ? <p className="mt-2 text-sm text-red-700">{currentError('category')}</p> : null}
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Status</span>
          <select
            value={currentValue('status')}
            onChange={(event) => handleCurrentInputChange('status', event.target.value)}
            className={fieldInputClass('status')}
          >
            <option value="">Select status</option>
            {optionsWithCurrentValue(productStatusOptions, currentValue('status')).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {currentError('status') ? <p className="mt-2 text-sm text-red-700">{currentError('status')}</p> : null}
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Price</span>
          <input
            type="text"
            value={currentValue('price')}
            onChange={(event) => handleCurrentInputChange('price', event.target.value)}
            placeholder="e.g. 450000"
            className={fieldInputClass('price')}
          />
          {currentError('price') ? <p className="mt-2 text-sm text-red-700">{currentError('price')}</p> : null}
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Price label</span>
          <input
            type="text"
            value={currentValue('price_label')}
            onChange={(event) => handleCurrentInputChange('price_label', event.target.value)}
            placeholder="e.g. Contact for Quote"
            className={fieldInputClass('price_label')}
          />
          <p className="mt-3 text-sm text-bark/60">Optional label that will display instead of the numeric price.</p>
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Material</span>
          <select
            value={currentValue('material')}
            onChange={(event) => handleCurrentInputChange('material', event.target.value)}
            className={fieldInputClass('material')}
          >
            <option value="">Select material</option>
            {optionsWithCurrentValue(productMaterialOptions, currentValue('material')).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Finish</span>
          <select
            value={currentValue('finish')}
            onChange={(event) => handleCurrentInputChange('finish', event.target.value)}
            className={fieldInputClass('finish')}
          >
            <option value="">Select finish</option>
            {optionsWithCurrentValue(productFinishOptions, currentValue('finish')).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Colour</span>
          <select
            value={currentValue('colour')}
            onChange={(event) => handleCurrentInputChange('colour', event.target.value)}
            className={fieldInputClass('colour')}
          >
            <option value="">Select colour</option>
            {optionsWithCurrentValue(productColourOptions, currentValue('colour')).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 sm:col-span-2 min-w-0">
        <label className="min-w-0 rounded-[1.5rem] border border-bark/10 bg-sand p-3">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Height</span>
          <input
            value={currentValue('height')}
            onChange={(event) => handleCurrentInputChange('height', event.target.value)}
            placeholder="Optional"
            className={fieldInputClass('height')}
          />
        </label>
        <label className="min-w-0 rounded-[1.5rem] border border-bark/10 bg-sand p-3">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Width</span>
          <input
            value={currentValue('width')}
            onChange={(event) => handleCurrentInputChange('width', event.target.value)}
            placeholder="Optional"
            className={fieldInputClass('width')}
          />
        </label>
        <label className="min-w-0 rounded-[1.5rem] border border-bark/10 bg-sand p-3">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Depth</span>
          <input
            value={currentValue('depth')}
            onChange={(event) => handleCurrentInputChange('depth', event.target.value)}
            placeholder="Optional"
            className={fieldInputClass('depth')}
          />
        </label>
        <label className="min-w-0 rounded-[1.5rem] border border-bark/10 bg-sand p-3">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Unit</span>
          <select
            value={currentValue('dimensionUnit')}
            onChange={(event) => handleCurrentInputChange('dimensionUnit', event.target.value)}
            className={fieldInputClass('dimensionUnit')}
          >
            <option value="">Unit</option>
            {productDimensionUnits.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4">
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Description</span>
          <textarea
            value={currentValue('description')}
            onChange={(event) => handleCurrentInputChange('description', event.target.value)}
            rows={5}
            className={fieldTextAreaClass('description')}
          />
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Features</span>
          <textarea
            value={currentFeaturesText}
            onChange={(event) => {
              if (drawerMode === 'create') {
                setCreateFeaturesText(event.target.value);
              } else {
                setFormFeaturesText(event.target.value);
              }
            }}
            rows={5}
            placeholder="Enter features, one per line"
            className={fieldTextAreaClass('features')}
          />
          <p className="mt-3 text-sm text-bark/60">Free-form text with one item per line.</p>
        </label>
        <label className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <span className="text-xs uppercase tracking-[0.35em] text-bark/60">Specifications</span>
          <textarea
            value={currentSpecificationsText}
            onChange={(event) => {
              if (drawerMode === 'create') {
                setCreateSpecificationsText(event.target.value);
              } else {
                setFormSpecificationsText(event.target.value);
              }
            }}
            rows={5}
            placeholder="Enter specifications, one per line"
            className={fieldTextAreaClass('specifications')}
          />
          <p className="mt-3 text-sm text-bark/60">Free-form text with one item per line.</p>
        </label>
      </div>
    </>
  );

  const renderMediaManager = () => {
    const isCreateMode = drawerMode === 'create';
    const existingImages = selectedProduct ? galleryImages : [];
    const selectedCoverImage = isCreateMode
      ? imagePreviews[selectedUploadCoverIndex] ?? ''
      : selectedProduct ? selectedProduct.cover_image ?? selectedProduct.image ?? '' : '';

    return (
      <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-5">
        <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
          <label className="block text-sm font-semibold text-bark">Product images</label>
          <div
            onDragEnter={handleDropzoneDragEnter}
            onDragLeave={handleDropzoneDragLeave}
            onDragOver={handleDropzoneDragOver}
            onDrop={handleDropzoneDrop}
            className={`mt-3 rounded-[1.25rem] border border-bark/10 bg-sand px-4 py-8 text-center transition ${isDragActive ? 'border-oak-500 bg-oak-50' : ''}`}
          >
            <p className="text-sm text-bark/60">Drag images here or use the file selector.</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFilesChange}
              disabled={isProcessing || isUploadingImages}
              className="mx-auto mt-4 block w-full cursor-pointer rounded-[1.25rem] border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none"
            />
          </div>

          {imagePreviews.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  className={`relative overflow-hidden rounded-[1rem] border-2 ${selectedUploadCoverIndex === index ? 'border-oak-600' : 'border-transparent'}`}
                  draggable
                  onDragStart={() => handlePreviewDragStart(index)}
                  onDragOver={(event) => handlePreviewDragOver(event, index)}
                  onDragEnd={handlePreviewDragEnd}
                >
                  <img src={preview} alt={`Selected preview ${index + 1}`} className="h-24 w-full object-cover" />
                  <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-2 rounded-full bg-bark/75 px-2 py-1 text-[0.65rem] text-white">
                    <button
                      type="button"
                      onClick={() => setSelectedUploadCoverIndex(index)}
                      className="font-semibold"
                    >
                      {selectedUploadCoverIndex === index ? 'Cover' : 'Set cover'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedFile(index)}
                      className="font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isCreateMode && selectedImageFiles.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleUploadImages}
                disabled={isUploadingImages || isProcessing}
                className="rounded-full px-5 py-3"
              >
                {isUploadingImages ? 'Saving images...' : 'Save images'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedImageFiles([]);
                  setImagePreviews([]);
                  setSelectedUploadCoverIndex(0);
                  setImageError(null);
                  setImageMessage(null);
                }}
                disabled={isUploadingImages || isProcessing}
                className="rounded-full px-5 py-3"
              >
                Cancel
              </Button>
            </div>
          ) : null}

          {uploadProgress ? <p className="mt-3 text-sm text-bark/70">{uploadProgress}</p> : null}
          {imageError ? <p className="mt-3 text-sm text-red-700">{imageError}</p> : null}
          {imageMessage ? <p className="mt-3 text-sm text-emerald-700">{imageMessage}</p> : null}
        </div>

        {!isCreateMode ? (
          <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-bark">Existing images</p>
              <span className="text-xs text-bark/60">{existingImages.length} image{existingImages.length === 1 ? '' : 's'}</span>
            </div>
            {existingImages.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {existingImages.map((src, index) => {
                  const isCover = selectedCoverImage === src;
                  return (
                    <div
                      key={`${src}-${index}`}
                      draggable
                      onDragStart={() => handleGalleryDragStart(index)}
                      onDragOver={(event) => handleGalleryDragOver(event, index)}
                      onDragEnd={handleGalleryDragEnd}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-bark/10 bg-sand"
                    >
                      <img src={src} alt={`${selectedProduct?.name} image ${index + 1}`} className="h-40 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em]">
                          <span>{isCover ? 'Cover' : 'Image'}</span>
                          <span>{`#${index + 1}`}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!isCover ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleSetCoverImage(src)}
                              disabled={isUploadingImages || isSaving || isProcessing}
                              className="rounded-full px-3 py-2 text-[0.7rem]"
                            >
                              Set cover
                            </Button>
                          ) : null}
                          <label className="inline-flex cursor-pointer rounded-full bg-white/10 px-3 py-2 text-[0.7rem] font-semibold transition hover:bg-white/20">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => handleReplaceImage(src, event.target.files)}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleDeleteImage(src)}
                            disabled={isUploadingImages || isSaving || isProcessing}
                            className="rounded-full px-3 py-2 text-[0.7rem]"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-bark/75">No images available.</p>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const selectedStatus = currentValue('status') || selectedProduct?.status || 'Not provided';

  const validateFormValues = (values: Product) => {
    const errors: Record<string, string> = {};
    if (!safeString(values.name)) errors.name = 'Name is required.';
    if (!safeString(values.category)) errors.category = 'Category is required.';
    if (!safeString(values.status)) errors.status = 'Status is required.';
    const hasPriceLabel = Boolean(safeString(values.price_label));
    if (!hasPriceLabel && !safeString(values.price)) {
      errors.price = 'Price is required unless a price label is provided.';
    } else if (safeString(values.price) && !isValidPrice(values.price)) {
      errors.price = 'Price must be a valid number.';
    }
    return errors;
  };

  const validateForm = (values: Product, isCreateMode: boolean) => {
    const errors = validateFormValues(values);
    if (isCreateMode) {
      setCreateFormErrors(errors);
    } else {
      setFormErrors(errors);
    }
    return errors;
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Admin Products | Oak Cherry Kraft</title>
        <meta name="description" content="Admin product catalog with a read-only product detail panel for Oak Cherry Kraft." />
      </Helmet>

      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className={
                `max-w-sm rounded-[1.5rem] border border-bark/10 px-5 py-4 shadow-soft ${toastVariantClass(toast.variant)}`
              }
            >
              <p className="text-sm font-semibold">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn} className="space-y-6">
        <div className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-bark">Products</h2>
              <p className="mt-2 text-sm leading-7 text-bark/70">Manage the product catalog with a quick read-only detail view for every item.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => {
                  setDrawerMode('create');
                  setCreateFormValues(blankProductValues);
                  setCreateFeaturesText('');
                  setCreateSpecificationsText('');
                  setCreateError(null);
                  setCreateMessage(null);
                }}
                className="rounded-full px-5 py-3"
              >
                New product
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-bark/10 bg-sand px-4 py-2 text-sm font-semibold text-bark">
                <Check size={16} aria-hidden="true" /> View-only product details
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-bark">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-bark/20 text-oak-700 focus:ring-oak-500"
                />
                {isAllSelected ? 'Deselect all' : 'Select all'}
              </label>
              {selectedCount > 0 ? (
                <span className="rounded-full bg-oak-100 px-3 py-1 text-sm font-semibold text-oak-700">
                  {selectedCount} selected
                </span>
              ) : (
                <span className="text-sm text-bark/70">Select products to apply bulk actions.</span>
              )}
            </div>
            <div className="relative flex-1 min-w-[240px]">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bark/50" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products by name, category, or summary"
                className="w-full rounded-full border border-bark/10 bg-white py-3 pl-12 pr-4 text-sm text-bark outline-none transition focus:border-oak-500 focus:ring-4 focus:ring-oak-100"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleBulkPublish}
              disabled={!selectedCount || isProcessing}
              className="rounded-full px-4 py-2"
            >
              Publish
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBulkDraft}
              disabled={!selectedCount || isProcessing}
              className="rounded-full px-4 py-2"
            >
              Draft
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBulkArchive}
              disabled={!selectedCount || isProcessing}
              className="rounded-full px-4 py-2"
            >
              Archive
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              disabled={!selectedCount || isProcessing}
              className="rounded-full px-4 py-2"
            >
              Delete
            </Button>
          </div>
          {actionError ? <p className="mt-3 text-sm text-red-700">{actionError}</p> : null}
          {actionMessage ? <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p> : null}
        </div>

        {isLoadingProducts ? (
          <LoadingState title="Loading products" description="Please wait while we load the product catalog." className="w-full" />
        ) : loadProductsError ? (
          <EmptyState
            title="Unable to load products"
            description={loadProductsError}
            action={
              <Button type="button" onClick={fetchAllProducts} className="rounded-full px-5 py-3">
                Retry
              </Button>
            }
            className="w-full"
          />
        ) : filteredProductList.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No search results' : 'No products yet'}
            description={
              searchQuery
                ? `No products matched '${searchQuery}'. Try another keyword or clear your search.`
                : 'Create your first product to start filling the catalog.'
            }
            action={
              searchQuery ? (
                <Button type="button" variant="secondary" onClick={() => setSearchQuery('')} className="rounded-full px-5 py-3">
                  Clear search
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setDrawerMode('create');
                    setCreateFormValues(blankProductValues);
                    setCreateFeaturesText('');
                    setCreateSpecificationsText('');
                    setCreateError(null);
                    setCreateMessage(null);
                  }}
                  className="rounded-full px-5 py-3"
                >
                  Add product
                </Button>
              )
            }
            className="w-full"
          />
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProductList.map((product, index) => {
              const isSelected = selectedProductIds.includes(product.id);
              return (
                <motion.article
                  key={product.id}
                  variants={fadeIn}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`group overflow-hidden rounded-[1.5rem] border transition duration-300 hover:shadow-medium ${
                    isSelected ? 'border-oak-500 bg-oak-50 shadow-medium' : 'border-bark/10 bg-white shadow-card'
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-strong">
                    <img
                      src={product.cover_image || product.image || product.image_urls?.[0] || ''}
                      alt={product.name}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                    />
                    <label className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-bark shadow-soft">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="h-4 w-4 rounded border-bark/20 text-oak-700 focus:ring-oak-500"
                      />
                      {isSelected ? 'Selected' : 'Select'}
                    </label>
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-bark shadow-soft">
                      <Check size={13} className="text-oak-600" aria-hidden="true" />
                      {product.status ?? 'Not provided'}
                    </span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{product.category}</p>
                    <h2 className="mt-3 font-display text-3xl font-semibold text-bark">{product.name}</h2>
                    <p className="mt-3 text-sm leading-7 text-bark/70">{product.summary ?? 'Not provided'}</p>
                    <div className="mt-6 flex flex-col gap-3 border-t border-bark/10 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 text-bark/65"><Clock3 size={15} aria-hidden="true" />{product.wood ?? detailValue(product.material)}</span>
                      <span className="font-semibold text-bark">{getDisplayPrice(product)}</span>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-bark/70">
                        <span className="font-semibold">Status:</span> {product.status ?? 'Draft'}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openProductPanel(product.id, 'view')}
                          className="rounded-full px-3 py-2"
                          icon={<Eye size={15} aria-hidden="true" />}
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openProductPanel(product.id, 'edit')}
                          className="rounded-full px-3 py-2"
                          icon={<Pencil size={15} aria-hidden="true" />}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openConfirmation('archive', product)}
                          disabled={isProcessing}
                          className="rounded-full px-3 py-2"
                          icon={<Archive size={15} aria-hidden="true" />}
                        >
                          Archive
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => openConfirmation('delete', product)}
                          disabled={isProcessing}
                          className="rounded-full px-3 py-2"
                          icon={<Trash2 size={15} aria-hidden="true" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {drawerMode ? (
          <>
            <motion.div
              key="drawer-overlay"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={overlayVariants}
              className="fixed inset-0 z-40 bg-bark/35 backdrop-blur-[2px]"
              onClick={() => setDrawerMode(null)}
            />
            <motion.aside
              key="drawer-panel"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              aria-label="Product drawer"
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
            >
              <div className="min-h-full space-y-6 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-bark/60">
                      {drawerMode === 'create' ? 'New product' : drawerMode === 'view' ? 'Product details' : 'Product editor'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-bark">
                      {drawerMode === 'create' ? 'Create a product' : drawerMode === 'view' ? selectedProduct?.name : 'Edit selected product'}
                    </h2>
                  </div>
                  <span className={`rounded-full px-3 py-2 text-xs font-semibold ${statusBadgeClass(drawerMode === 'create' ? createFormValues.status : selectedStatus)}`}>
                    {drawerMode === 'create' ? createFormValues.status || 'Draft' : selectedStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerMode(null)}
                    aria-label="Close product drawer"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-bark/10 text-bark transition hover:bg-sand"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                {drawerMode === 'create' ? (
                  <div className="mt-6 space-y-6">
                    {renderProductFormFields()}
                    {renderMediaManager()}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-bark">Create product</p>
                        <p className="mt-1 text-sm text-bark/70">Images upload after the product is created.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setDrawerMode(null)}
                          className="rounded-full px-5 py-3"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreate}
                          disabled={isProcessing}
                          className="rounded-full px-5 py-3"
                        >
                          {isProcessing ? 'Creating...' : 'Save product'}
                        </Button>
                      </div>
                    </div>
                    {createError ? <p className="mt-3 text-sm text-red-700">{createError}</p> : null}
                    {createMessage ? <p className="mt-3 text-sm text-emerald-700">{createMessage}</p> : null}
                  </div>
                ) : selectedProduct ? drawerMode === 'view' ? (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-[1.5rem] border border-bark/10 bg-sand">
                      {galleryImages.length > 0 ? (
                        <div>
                          <ImageCarousel images={galleryImages} alt={selectedProduct.name} />
                          <div className="p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{selectedProduct.category}</p>
                            <p className="mt-2 text-sm leading-7 text-bark/70">{selectedProduct.summary ?? 'Not provided'}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex aspect-[4/3] items-center justify-center text-sm text-bark/60">No images available</div>
                          <div className="p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{selectedProduct.category}</p>
                            <p className="mt-2 text-sm leading-7 text-bark/70">{selectedProduct.summary ?? 'Not provided'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['Status', selectedProduct.status],
                        ['Price', getDisplayPrice(selectedProduct)],
                        ['Material', selectedProduct.material ?? selectedProduct.wood],
                        ['Finish', selectedProduct.finish],
                        ['Colour', selectedProduct.colour],
                        ['Dimensions', selectedProduct.dimensions],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                          <p className="text-xs uppercase tracking-[0.35em] text-bark/60">{label}</p>
                          <p className="mt-2 text-base font-semibold text-bark">{detailValue(value)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-sand p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Description</p>
                        <p className="mt-2 text-sm leading-7 text-bark/75">{detailValue(selectedProduct.description)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Features</p>
                        <p className="mt-2 text-sm leading-7 text-bark/75">{detailValue(selectedProduct.features)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Specifications</p>
                        <p className="mt-2 text-sm leading-7 text-bark/75">{detailValue(selectedProduct.specifications)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[1.5rem] border border-bark/10 bg-sand p-5">
                      <div className="text-sm text-bark/70">
                        <p>Created {formatDate(selectedProduct.created_at)}</p>
                        <p className="mt-1">Updated {formatDate(selectedProduct.updated_at)}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setDrawerMode('edit')}
                        className="rounded-full px-5 py-3"
                        icon={<Pencil size={16} aria-hidden="true" />}
                      >
                        Edit product
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {renderProductFormFields()}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Created</p>
                        <p className="mt-2 text-base font-semibold text-bark">{formatDate(selectedProduct.created_at)}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Updated</p>
                        <p className="mt-2 text-base font-semibold text-bark">{formatDate(selectedProduct.updated_at)}</p>
                      </div>
                    </div>

                    <div className="sticky top-0 z-10 rounded-[1.5rem] border border-bark/10 bg-sand/95 p-5 backdrop-blur-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-bark">Save changes</p>
                          <p className="mt-1 text-sm text-bark/70">Product metadata is saved here; image edits are saved instantly as you replace, delete, or upload files.</p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving || isProcessing}
                          className="rounded-full px-5 py-3"
                        >
                          {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                      </div>
                      {saveError ? <p className="mt-3 text-sm text-red-700">{saveError}</p> : null}
                      {saveMessage ? <p className="mt-3 text-sm text-emerald-700">{saveMessage}</p> : null}
                    </div>

                    <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-bark">Manage product</p>
                          <p className="mt-1 text-sm text-bark/70">Archive or delete this product.</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => selectedProduct && openConfirmation('archive', selectedProduct)}
                            disabled={isSaving || isProcessing}
                            className="rounded-full px-5 py-3"
                          >
                            {isProcessing ? 'Archiving...' : 'Archive'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => selectedProduct && openConfirmation('delete', selectedProduct)}
                            disabled={isSaving || isProcessing}
                            className="rounded-full px-5 py-3"
                          >
                            {isProcessing ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                      {actionError ? <p className="mt-3 text-sm text-red-700">{actionError}</p> : null}
                      {actionMessage ? <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p> : null}
                    </div>

                    {renderMediaManager()}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-sm text-bark/70">
                    Select a product to edit its details.
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-bark/50 backdrop-blur-sm" onClick={closeConfirmation} />
            <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-bark/10 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Confirm action</p>
                  <h3 className="mt-3 text-2xl font-semibold text-bark">{confirmation.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 text-bark transition hover:bg-sand"
                  aria-label="Close confirmation dialog"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-5 text-sm leading-7 text-bark/75">{confirmation.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={closeConfirmation} className="rounded-full px-5 py-3">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={confirmation?.action === 'delete' ? 'danger' : 'primary'}
                  onClick={handleConfirmAction}
                  disabled={isProcessing || !confirmation?.product}
                  className="rounded-full px-5 py-3"
                >
                  {isProcessing ? 'Processing...' : confirmation?.confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
