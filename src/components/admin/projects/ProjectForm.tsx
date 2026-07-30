import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Image, Upload, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { Project } from '../../../lib/projects';
import { projectCategories, projectStatuses, normalizeProjectSlug } from '../../../lib/projects';

interface ProjectFormProps {
  values: Project;
  errors: Record<string, string>;
  isSubmitting?: boolean;
  coverFile?: File | null;
  beforeFile?: File | null;
  afterFile?: File | null;
  galleryFiles: File[];
  onChange: (field: keyof Project, value: unknown) => void;
  onCoverUpload: (file: File) => void;
  onBeforeUpload: (file: File) => void;
  onAfterUpload: (file: File) => void;
  onGalleryUpload: (files: FileList) => void;
  onRemoveGalleryImage: (index: number) => void;
  onRemoveGalleryFile: (index: number) => void;
  onRemoveCoverImage: () => void;
  onRemoveBeforeImage: () => void;
  onRemoveAfterImage: () => void;
}

export function ProjectForm({
  values,
  errors,
  isSubmitting,
  coverFile,
  beforeFile,
  afterFile,
  galleryFiles,
  onChange,
  onCoverUpload,
  onBeforeUpload,
  onAfterUpload,
  onGalleryUpload,
  onRemoveGalleryImage,
  onRemoveGalleryFile,
  onRemoveCoverImage,
  onRemoveBeforeImage,
  onRemoveAfterImage,
}: ProjectFormProps) {
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (autoSlug) {
      onChange('slug', normalizeProjectSlug(values.title || values.slug || ''));
    }
  }, [autoSlug, values.title]);

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);
  const beforePreview = useMemo(() => (beforeFile ? URL.createObjectURL(beforeFile) : null), [beforeFile]);
  const afterPreview = useMemo(() => (afterFile ? URL.createObjectURL(afterFile) : null), [afterFile]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
    };
  }, [coverPreview, beforePreview, afterPreview]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-bark">Project Title</label>
            <input
              id="title"
              type="text"
              value={values.title}
              onChange={(event) => onChange('title', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
            {errors.title ? <p className="mt-2 text-sm text-red-700">{errors.title}</p> : null}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="slug" className="mb-2 block text-sm font-semibold text-bark">Slug</label>
              <Button variant="ghost" size="sm" type="button" onClick={() => setAutoSlug((current) => !current)}>
                {autoSlug ? 'Manual edit' : 'Auto generate'}
              </Button>
            </div>
            <input
              id="slug"
              type="text"
              value={values.slug}
              onChange={(event) => {
                setAutoSlug(false);
                onChange('slug', event.target.value);
              }}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
            {errors.slug ? <p className="mt-2 text-sm text-red-700">{errors.slug}</p> : null}
          </div>
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-bark">Description</label>
            <textarea
              id="description"
              value={values.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
            {errors.description ? <p className="mt-2 text-sm text-red-700">{errors.description}</p> : null}
          </div>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-bark">Category</label>
            <select
              id="category"
              value={values.category}
              onChange={(event) => onChange('category', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            >
              <option value="">Select category</option>
              {projectCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category ? <p className="mt-2 text-sm text-red-700">{errors.category}</p> : null}
          </div>
          <div>
            <label htmlFor="client_name" className="mb-2 block text-sm font-semibold text-bark">Client Name (optional)</label>
            <input
              id="client_name"
              type="text"
              value={values.client_name || ''}
              onChange={(event) => onChange('client_name', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-semibold text-bark">Location</label>
            <input
              id="location"
              type="text"
              value={values.location}
              onChange={(event) => onChange('location', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
            {errors.location ? <p className="mt-2 text-sm text-red-700">{errors.location}</p> : null}
          </div>
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-semibold text-bark">Status</label>
            <select
              id="status"
              value={values.status}
              onChange={(event) => onChange('status', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            >
              <option value="">Select status</option>
              {projectStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            {errors.status ? <p className="mt-2 text-sm text-red-700">{errors.status}</p> : null}
          </div>
          <div>
            <label htmlFor="completion_date" className="mb-2 block text-sm font-semibold text-bark">Completion Date</label>
            <input
              id="completion_date"
              type="date"
              value={values.completion_date ?? ''}
              onChange={(event) => onChange('completion_date', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div>
            <label htmlFor="wood_species" className="mb-2 block text-sm font-semibold text-bark">Wood Species</label>
            <input
              id="wood_species"
              type="text"
              value={values.wood_species ?? ''}
              onChange={(event) => onChange('wood_species', event.target.value)}
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
          <div>
            <label htmlFor="budget_range" className="mb-2 block text-sm font-semibold text-bark">Budget Range</label>
            <input
              id="budget_range"
              type="text"
              value={values.budget_range ?? ''}
              onChange={(event) => onChange('budget_range', event.target.value)}
              placeholder="e.g. ₦250k - ₦500k"
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
          <div>
            <label htmlFor="duration" className="mb-2 block text-sm font-semibold text-bark">Duration</label>
            <input
              id="duration"
              type="text"
              value={values.duration ?? ''}
              onChange={(event) => onChange('duration', event.target.value)}
              placeholder="e.g. 10 weeks"
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
          <div>
            <label htmlFor="finish" className="mb-2 block text-sm font-semibold text-bark">Finish</label>
            <input
              id="finish"
              type="text"
              value={values.finish ?? ''}
              onChange={(event) => onChange('finish', event.target.value)}
              placeholder="e.g. Hand-rubbed oil & wax"
              className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
            />
          </div>
          <div>
            <label htmlFor="cover_image" className="mb-2 block text-sm font-semibold text-bark">Cover Image</label>
            <input
              id="cover_image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                if (!event.target.files) return;
                onCoverUpload(event.target.files[0]);
              }}
              className="w-full text-sm text-bark"
            />
            {values.cover_image || values.cover_image === '' ? (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-bark/10 bg-sand p-3">
                <span className="text-sm text-bark/70">Cover image selected</span>
                <Button variant="ghost" size="sm" type="button" onClick={onRemoveCoverImage} icon={<X size={14} aria-hidden="true" />}>
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div className="rounded-2xl border border-bark/10 bg-sand p-4">
            <p className="text-sm font-semibold text-bark">Visibility</p>
            <div className="mt-4 grid gap-3">
              {[
                { field: 'featured_project', label: 'Featured on Homepage' },
                { field: 'project_of_the_month', label: 'Project of the Month' },
                { field: 'show_in_gallery', label: 'Show in Gallery' },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-center gap-3 rounded-2xl border border-bark/10 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(values[field as keyof Project])}
                    onChange={(event) => onChange(field as keyof Project, event.target.checked)}
                    className="h-5 w-5 rounded border-bark/10 text-oak-700 focus:ring-oak-500"
                  />
                  <span className="text-sm text-bark">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-bark/10 bg-sand p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-bark">Gallery Images</p>
                <p className="text-sm text-bark/70">Upload multiple images for the gallery.</p>
              </div>
              <Upload size={18} aria-hidden="true" />
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => {
                if (!event.target.files) return;
                onGalleryUpload(event.target.files);
              }}
              className="w-full text-sm text-bark"
            />
            {Array.isArray(values.gallery_images) && values.gallery_images.length > 0 ? (
              <div className="grid gap-3">
                {values.gallery_images.map((image, index) => (
                  <div key={image} className="flex items-center justify-between gap-3 rounded-2xl border border-bark/10 bg-white px-4 py-3">
                    <span className="truncate text-sm text-bark/70">{image}</span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => onRemoveGalleryImage(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-bark/10 bg-white px-4 py-6 text-center text-sm text-bark/60">
                <p className="inline-flex items-center gap-2"><Image size={16} aria-hidden="true" /> No gallery images yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <AlertCircle size={18} />
            <p className="text-sm font-semibold text-bark">Additional details</p>
          </div>
          <div className="grid gap-4">
            <div>
              <label htmlFor="wood_species" className="mb-2 block text-sm font-semibold text-bark">Wood Species</label>
              <input
                id="wood_species"
                type="text"
                value={values.wood_species ?? ''}
                onChange={(event) => onChange('wood_species', event.target.value)}
                className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
              />
            </div>
            <div>
              <label htmlFor="budget_range" className="mb-2 block text-sm font-semibold text-bark">Budget Range</label>
              <input
                id="budget_range"
                type="text"
                value={values.budget_range ?? ''}
                onChange={(event) => onChange('budget_range', event.target.value)}
                placeholder="e.g. ₦250k – ₦500k"
                className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
              />
            </div>
            <div>
              <label htmlFor="duration" className="mb-2 block text-sm font-semibold text-bark">Duration</label>
              <input
                id="duration"
                type="text"
                value={values.duration ?? ''}
                onChange={(event) => onChange('duration', event.target.value)}
                placeholder="e.g. 10 weeks"
                className="w-full rounded-2xl border border-bark/10 bg-sand px-4 py-3 text-sm text-bark outline-none focus:border-bark focus:ring-4 focus:ring-oak-100"
              />
            </div>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Please fix the highlighted fields before saving.
        </div>
      ) : null}
    </div>
  );
}
