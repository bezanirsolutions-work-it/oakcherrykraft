import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

interface ProjectToast {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}
import { Plus } from 'lucide-react';
import { Button, EmptyState, LoadingState } from '../../components/ui';
import { ProjectTable } from '../../components/admin/projects/ProjectTable';
import { ProjectForm } from '../../components/admin/projects/ProjectForm';
import type { Project } from '../../lib/projects';
import {
  createProject,
  deleteProject,
  fetchProjects,
  normalizeProjectSlug,
  updateProject,
  uploadProjectAsset,
  unsetOtherFeaturedProjects,
  unsetOtherProjectOfMonth,
} from '../../lib/projects';

const pageMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const blankProject: Project = {
  id: '',
  slug: '',
  title: '',
  description: '',
  category: '',
  client_name: '',
  location: '',
  status: 'Planning',
  cover_image: '',
  gallery_images: [],
  budget_range: '',
  duration: '',
  completion_date: '',
  featured_project: false,
  wood_species: '',
  finish: '',
  project_of_the_month: false,
  show_in_gallery: false,
  created_at: '',
  updated_at: '',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formValues, setFormValues] = useState<Project>(blankProject);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState<ProjectToast[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Unable to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const selectedProjectId = selectedProject?.id ?? null;
  const isEditing = Boolean(selectedProjectId);

  const prepareProjectForForm = (project: Project | null) => {
    if (!project) return blankProject;
    return {
      ...blankProject,
      ...project,
      gallery_images: project.gallery_images ?? [],
      featured_project: Boolean(project.featured_project),
      project_of_the_month: Boolean(project.project_of_the_month),
      show_in_gallery: Boolean(project.show_in_gallery),
    };
  };

  const resetForm = () => {
    setSelectedProject(null);
    setFormValues(blankProject);
    setCoverFile(null);
    setGalleryFiles([]);
    setBeforeFile(null);
    setAfterFile(null);
    setErrors({});
    setShowForm(false);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setFormValues(prepareProjectForForm(project));
    setCoverFile(null);
    setBeforeFile(null);
    setAfterFile(null);
    setGalleryFiles([]);
    setShowForm(true);
  };

  const handleInputChange = (field: keyof Project, value: unknown) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formValues.title?.trim()) next.title = 'Title is required.';
    if (!formValues.slug?.trim()) next.slug = 'Slug is required.';
    if (!formValues.description?.trim()) next.description = 'Project description is required.';
    if (!formValues.category?.trim()) next.category = 'Category is required.';
    if (!formValues.location?.trim()) next.location = 'Location is required.';
    if (!formValues.status) next.status = 'Status is required.';
    if (formValues.slug?.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formValues.slug.trim())) {
      next.slug = 'Slug must use lowercase letters, numbers, and hyphens only.';
    }
    const normalizedSlug = normalizeProjectSlug(formValues.slug);
    const slugConflict = projects.some(
      (project) => project.slug === normalizedSlug && project.id !== selectedProjectId,
    );
    if (slugConflict) next.slug = 'Slug already exists. Please choose another.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const addToast = (toast: Omit<ProjectToast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  };

  const showProjectError = (error: unknown) => {
    console.error(error);

    const message = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : JSON.stringify(error));

    setActionError(message);
    addToast({
      type: 'error',
      title: 'Project Error',
      message,
    });
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setFormValues(blankProject);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const projectId = isEditing ? selectedProjectId! : crypto.randomUUID();
      const normalizedSlug = normalizeProjectSlug(formValues.slug);
      const payload: Project = {
        ...formValues,
        id: projectId,
        slug: normalizedSlug,
        featured_project: Boolean(formValues.featured_project),
        project_of_the_month: Boolean(formValues.project_of_the_month),
        show_in_gallery: Boolean(formValues.show_in_gallery),
        gallery_images: formValues.gallery_images ?? [],
        created_at: formValues.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (coverFile) {
        try {
          payload.cover_image = await uploadProjectAsset(projectId, coverFile, 'cover');
        } catch (error) {
          showProjectError(error);
          return;
        }
      }
      if (beforeFile) {
        try {
          payload.before_image = await uploadProjectAsset(projectId, beforeFile, 'before');
        } catch (error) {
          showProjectError(error);
          return;
        }
      }
      if (afterFile) {
        try {
          payload.after_image = await uploadProjectAsset(projectId, afterFile, 'after');
        } catch (error) {
          showProjectError(error);
          return;
        }
      }
      if (galleryFiles.length > 0) {
        try {
          const uploadedGallery = await Promise.all(
            galleryFiles.map((file) => uploadProjectAsset(projectId, file, 'gallery')),
          );
          payload.gallery_images = [...(payload.gallery_images ?? []), ...uploadedGallery];
        } catch (error) {
          showProjectError(error);
          return;
        }
      }

      try {
        if (payload.project_of_the_month) {
          await unsetOtherProjectOfMonth(projectId);
        }
      } catch (error) {
        showProjectError(error);
        return;
      }

      let savedProject: Project;
      try {
        if (isEditing) {
          savedProject = await updateProject(projectId, payload);
        } else {
          savedProject = await createProject(payload);
        }
      } catch (error) {
        showProjectError(error);
        return;
      }

      try {
        if (savedProject.featured_project) {
          await unsetOtherFeaturedProjects(savedProject.id);
        }
      } catch (error) {
        showProjectError(error);
        return;
      }

      if (isEditing) {
        setProjects((current) => current.map((project) => (project.id === savedProject.id ? savedProject : project)));
        setActionMessage('Project updated successfully.');
      } else {
        setProjects((current) => [savedProject, ...current]);
        setActionMessage('Project created successfully.');
      }

      setSelectedProject(savedProject);
      setFormValues(prepareProjectForForm(savedProject));
      setCoverFile(null);
      setBeforeFile(null);
      setAfterFile(null);
      setGalleryFiles([]);
      setShowForm(false);
    } catch (error) {
      showProjectError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      if (selectedProjectId === project.id) resetForm();
      setActionMessage('Project deleted successfully.');
    } catch (error) {
      showProjectError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const featuredCount = useMemo(() => projects.filter((project) => project.featured_project).length, [projects]);
  const projectOfMonthCount = useMemo(() => projects.filter((project) => project.project_of_the_month).length, [projects]);

  return (
    <motion.div {...pageMotion} className="space-y-8">
      <Helmet>
        <title>Admin | Projects | Oak Cherry Kraft</title>
      </Helmet>

      <div className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bark/70">Projects</p>
            <h1 className="mt-2 text-3xl font-semibold text-bark">Project Management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/70">
              Create, edit, and manage studio projects with gallery, status, and homepage feature controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={handleCreate} icon={<Plus size={16} aria-hidden="true" />}>
              New Project
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              Close Form
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-bark/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-bark/70">Total projects</p>
          <p className="mt-3 text-3xl font-semibold text-bark">{projects.length}</p>
        </div>
        <div className="rounded-[1.75rem] border border-bark/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-bark/70">Featured on homepage</p>
          <p className="mt-3 text-3xl font-semibold text-bark">{featuredCount}</p>
        </div>
        <div className="rounded-[1.75rem] border border-bark/10 bg-white p-5 shadow-soft">
          <p className="text-sm text-bark/70">Project of the Month</p>
          <p className="mt-3 text-3xl font-semibold text-bark">{projectOfMonthCount}</p>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">{actionMessage}</div>
      ) : null}
      {actionError ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">{actionError}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-bark/70">Project list</p>
                <h2 className="mt-2 text-xl font-semibold text-bark">All projects</h2>
              </div>
              <div className="text-sm text-bark/70">{isLoading ? 'Loading…' : `${projects.length} total`}</div>
            </div>

            {isLoading ? (
              <LoadingState title="Fetching projects…" description="Please wait while we load the project list." />
            ) : projects.length === 0 ? (
              <EmptyState title="No projects yet" description="Add your first project to begin managing the portfolio." />
            ) : (
              <ProjectTable
                projects={projects}
                isLoading={isLoading}
                onEdit={(project) => {
                  handleProjectSelect(project);
                }}
                onDelete={(project) => void handleDelete(project)}
                onView={(project) => handleProjectSelect(project)}
              />
            )}
          </div>
        </section>

        <section className="space-y-6">
          {showForm ? (
            <div className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-bark/70">{isEditing ? 'Edit project' : 'New project'}</p>
                  <h2 className="mt-2 text-xl font-semibold text-bark">{isEditing ? selectedProject?.title || 'Editing project' : 'Create a project'}</h2>
                </div>
                <div className="text-sm text-bark/70">Last updated {formatDate(selectedProject?.updated_at)}</div>
              </div>

              <ProjectForm
                values={formValues}
                errors={errors}
                isSubmitting={isSaving}
                onChange={handleInputChange}
                onCoverUpload={(file) => setCoverFile(file)}
                onBeforeUpload={(file) => setBeforeFile(file)}
                onAfterUpload={(file) => setAfterFile(file)}
                onGalleryUpload={(files) => setGalleryFiles(Array.from(files))}
                onRemoveGalleryImage={(index) => setGalleryFiles((current) => current.filter((_, idx) => idx !== index))}
                onRemoveGalleryFile={(index) => setGalleryFiles((current) => current.filter((_, idx) => idx !== index))}
                onRemoveCoverImage={() => setCoverFile(null)}
                onRemoveBeforeImage={() => setBeforeFile(null)}
                onRemoveAfterImage={() => setAfterFile(null)}
                coverFile={coverFile}
                beforeFile={beforeFile}
                afterFile={afterFile}
                galleryFiles={galleryFiles}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-bark/70">
                  {isEditing ? 'Update the project to save changes.' : 'Complete the form to add a new project.'}
                </div>
                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <Button variant="secondary" size="sm" onClick={resetForm} disabled={isSaving}>
                      Cancel
                    </Button>
                  ) : null}
                  <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
                    {isEditing ? 'Save Changes' : 'Create Project'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={`max-w-sm rounded-[1.5rem] border px-5 py-4 shadow-soft ${toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm leading-6">{toast.message}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
