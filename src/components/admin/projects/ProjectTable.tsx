import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import type { Project } from '../../../lib/projects';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
  isLoading: boolean;
}

const statusClass = (status?: string) => {
  switch (status) {
    case 'Planned':
      return 'bg-sand text-bark';
    case 'In Progress':
      return 'bg-amber-100 text-amber-800';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-sand text-bark';
  }
};

export function ProjectTable({ projects, onEdit, onDelete, onView, isLoading }: ProjectTableProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-bark/10 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm text-bark">
          <thead className="bg-sand text-xs uppercase tracking-[0.3em] text-bark/70">
            <tr>
              <th className="px-5 py-4">Cover</th>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Featured</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-bark/70">
                  {isLoading ? 'Loading projects…' : 'No projects available.'}
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="border-t border-bark/10">
                  <td className="px-5 py-4 align-top">
                    <div className="h-20 w-28 overflow-hidden rounded-3xl bg-sand">
                      {project.cover_image ? (
                        <img src={project.cover_image} alt={project.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-bark/50">No cover</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-bark">{project.title}</p>
                    <p className="text-sm text-bark/60">{project.description}</p>
                  </td>
                  <td className="px-5 py-4 align-top">{project.category}</td>
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">{project.featured_project ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4 align-top">{project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onView(project)} className="rounded-full px-3 py-2" icon={<Eye size={14} aria-hidden="true" />}>
                        View
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => onEdit(project)} className="rounded-full px-3 py-2" icon={<Pencil size={14} aria-hidden="true" />}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(project)} className="rounded-full px-3 py-2" icon={<Trash2 size={14} aria-hidden="true" />}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
