import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { ProjectPhase } from '../types';

interface ProjectModalProps {
  /** Called with the new session ID after a session is created (home flow). */
  onCreated?: (sessionId: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ onCreated }) => {
  const {
    isProjectModalOpen,
    closeProjectModal,
    createProject,
    updateProject,
    currentProjectId,
    projects,
  } = useStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const [formData, setFormData] = useState({
    name: '',
    team: '',
    phase: 'Discovery' as ProjectPhase,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        team: currentProject.team,
        phase: currentProject.phase,
        date: currentProject.date,
      });
    }
  }, [currentProject]);

  if (!isProjectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProject) {
      await updateProject({ ...currentProject, ...formData });
      closeProjectModal();
      setFormData({
        name: '',
        team: '',
        phase: 'Discovery',
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      const sessionId = await createProject(formData);
      // Close and reset BEFORE navigating so the modal is hidden when
      // SessionView mounts — otherwise isProjectModalOpen stays true across
      // the route transition and the modal re-opens in Edit mode.
      closeProjectModal();
      setFormData({
        name: '',
        team: '',
        phase: 'Discovery',
        date: new Date().toISOString().split('T')[0],
      });
      if (onCreated) {
        onCreated(sessionId);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay" onClick={closeProjectModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gds-black">
            {currentProject ? 'Edit Session' : 'Create New Session'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Service/Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter service or product name"
                />
              </div>

              <div>
                <label
                  htmlFor="team"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Team/Department *
                </label>
                <input
                  type="text"
                  id="team"
                  name="team"
                  required
                  value={formData.team}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter team or department name"
                />
              </div>

              <div>
                <label
                  htmlFor="phase"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Phase *
                </label>
                <select
                  id="phase"
                  name="phase"
                  required
                  value={formData.phase}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Discovery">Discovery</option>
                  <option value="Alpha">Alpha</option>
                  <option value="Beta">Beta</option>
                  <option value="Live">Live</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">
                {currentProject ? 'Save Changes' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={closeProjectModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
