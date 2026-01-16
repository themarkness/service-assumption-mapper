import React from 'react';
import { useStore } from '../store/useStore';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    currentProjectId,
    setCurrentProject,
    openProjectModal,
    deleteProject,
    setViewMode,
  } = useStore();

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId);
    setViewMode('category');
  };

  const handleCreateNew = () => {
    openProjectModal();
  };

  const handleDelete = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated assumptions.`)) {
      deleteProject(projectId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="min-h-screen bg-gds-light-grey py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gds-black mb-2">Your Projects</h1>
            <p className="text-gds-grey">
              {projects.length === 0
                ? 'No projects yet. Create your first project to get started.'
                : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-gds-blue text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition-colors"
          >
            + Create New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gds-black mb-3">
                Get started with your first project
              </h2>
              <p className="text-gds-grey mb-6">
                Create a project to start mapping and prioritizing your service assumptions
                using the Hypothesis Prioritization Canvas framework.
              </p>
              <button
                onClick={handleCreateNew}
                className="bg-gds-blue text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gds-black mb-2">
                      {project.name}
                      {currentProjectId === project.id && (
                        <span className="ml-3 text-sm font-normal text-white bg-gds-blue px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </h2>
                    <div className="flex gap-4 text-sm text-gds-grey mb-3">
                      <span>
                        <strong>Team:</strong> {project.team}
                      </span>
                      <span>
                        <strong>Phase:</strong> {project.phase}
                      </span>
                      <span>
                        <strong>Date:</strong> {project.date}
                      </span>
                    </div>
                    <div className="text-xs text-gds-grey">
                      Last updated: {formatDate(project.updatedAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {currentProjectId !== project.id && (
                      <button
                        onClick={() => handleSelectProject(project.id)}
                        className="bg-gds-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Open Project
                      </button>
                    )}
                    {currentProjectId === project.id && (
                      <button
                        onClick={() => setViewMode('category')}
                        className="bg-gds-blue text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continue Working
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
