import { getCachedData } from './cache';
import { supabase } from './supabase';

export type ProjectStatus = 'Planning' | 'In Progress' | 'Completed' | 'Delivered';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  client_name?: string | null;
  location: string;
  status: ProjectStatus;
  cover_image?: string | null;
  before_image?: string | null;
  after_image?: string | null;
  gallery_images?: string[];
  budget_range?: string | null;
  duration?: string | null;
  completion_date?: string | null;
  featured_project?: boolean;
  project_of_the_month?: boolean;
  show_in_gallery?: boolean;
  wood_species?: string | null;
  finish?: string | null;
  created_at?: string;
  updated_at?: string;
}

const projectBucket = (import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'project-images').trim() || 'project-images';
const projectSelectColumns = [
  'id',
  'created_at',
  'updated_at',
  'title',
  'slug',
  'description',
  'category',
  'client_name',
  'location',
  'status',
  'completion_date',
  'budget_range',
  'wood_species',
  'finish',
  'duration',
  'cover_image',
  'before_image',
  'after_image',
  'gallery_images',
  'featured_project',
  'project_of_the_month',
  'show_in_gallery',
].join(',');

export const projectStatuses: ProjectStatus[] = ['Planning', 'In Progress', 'Completed', 'Delivered'];

export const projectCategories = [
  'Residential',
  'Commercial',
  'Hospitality',
  'Office',
  'Custom Furniture',
  'Outdoor',
  'Bedroom',
  'Living Room',
  'Dining',
  'Kitchen',
];

export const normalizeProjectSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || `project-${Date.now()}`;

const baseProjectQuery = () => supabase.from('projects').select(projectSelectColumns);

export const fetchProjects = async (): Promise<Project[]> => {
  return getCachedData<Project[]>(`projects:list`, 10 * 60 * 1000, async () => {
    const { data, error } = await baseProjectQuery()
      .order('updated_at', { ascending: false })
      .order('title', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown) as Project[];
  });
};

export const fetchFeaturedProjects = async (): Promise<Project[]> => {
  return getCachedData<Project[]>(`projects:featured`, 10 * 60 * 1000, async () => {
    const { data, error } = await baseProjectQuery()
      .eq('featured_project', true)
      .eq('show_in_gallery', true)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false })
      .order('title', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown) as Project[];
  });
};

export const fetchProjectOfMonth = async (): Promise<Project | null> => {
  return getCachedData<Project | null>(`projects:of-month`, 10 * 60 * 1000, async () => {
    const { data, error } = await baseProjectQuery()
      .eq('project_of_the_month', true)
      .eq('show_in_gallery', true)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false })
      .order('title', { ascending: true })
      .maybeSingle();

    if (error) throw error;
    return (data as Project | null) ?? null;
  });
};

export const fetchProject = async (slug: string): Promise<Project | null> => {
  return getCachedData<Project | null>(`projects:${slug}`, 10 * 60 * 1000, async () => {
    const { data, error } = await baseProjectQuery()
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return (data as Project | null) ?? null;
  });
};

const buildProjectPayload = (project: Partial<Project>): Partial<Project> => ({
  id: project.id,
  slug: project.slug,
  title: project.title,
  description: project.description,
  category: project.category,
  client_name: project.client_name?.trim() ? project.client_name : null,
  location: project.location,
  status: project.status,
  completion_date: project.completion_date?.trim() ? project.completion_date : null,
  budget_range: project.budget_range?.trim() ? project.budget_range : null,
  wood_species: project.wood_species?.trim() ? project.wood_species : null,
  finish: project.finish?.trim() ? project.finish : null,
  duration: project.duration?.trim() ? project.duration : null,
  cover_image: project.cover_image?.trim() ? project.cover_image : null,
  before_image: project.before_image?.trim() ? project.before_image : null,
  after_image: project.after_image?.trim() ? project.after_image : null,
  gallery_images: project.gallery_images ?? [],
  featured_project: Boolean(project.featured_project),
  project_of_the_month: Boolean(project.project_of_the_month),
  show_in_gallery: Boolean(project.show_in_gallery),
});

export const createProject = async (project: Project): Promise<Project> => {
  const payload = buildProjectPayload(project);

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select(projectSelectColumns)
    .single();

  if (error) throw error;
  return ((data ?? null) as unknown) as Project;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project> => {
  const payload = buildProjectPayload(updates);

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select(projectSelectColumns)
    .single();

  if (error) throw error;
  return ((data ?? null) as unknown) as Project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
};

export const uploadProjectAsset = async (projectId: string, file: File, folder = 'gallery'): Promise<string> => {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const storageFolder = folder === 'cover'
    ? 'cover'
    : folder === 'before' || folder === 'after' || folder === 'before-after'
      ? 'before-after'
      : 'gallery';
  const path = `projects/${projectId}/${storageFolder}/${timestamp}-${sanitizedName}`;
  const { error: uploadError } = await supabase.storage.from(projectBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(projectBucket).getPublicUrl(path);
  const publicUrl = (publicUrlData as any)?.publicUrl ?? null;
  if (!publicUrl) {
    throw new Error('Unable to get image public URL.');
  }

  return publicUrl;
};

export const uploadProjectAssets = async (projectId: string, files: File[], folder = 'gallery'): Promise<string[]> => {
  const uploadedUrls = await Promise.all(files.map((file) => uploadProjectAsset(projectId, file, folder)));
  return uploadedUrls;
};

export const unsetOtherFeaturedProjects = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .update({ featured_project: false })
    .neq('id', projectId)
    .eq('featured_project', true);

  if (error) throw error;
};

export const unsetOtherProjectOfMonth = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .update({ project_of_the_month: false })
    .neq('id', projectId)
    .eq('project_of_the_month', true);

  if (error) throw error;
};

export const deleteProjectImage = async (imageUrl: string): Promise<void> => {
  try {
    const url = new URL(imageUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    const publicIndex = segments.indexOf('public');
    const path = publicIndex >= 0 ? segments.slice(publicIndex + 2).join('/') : segments.slice(1).join('/');

    const { error } = await supabase.storage.from(projectBucket).remove([path]);
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};
