import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportToCSV, exportToPDF, exportToJSON } from '../utils/export';
import { addCalculations } from '../utils/calculations';

export const TopNav: React.FC = () => {
  const {
    projects,
    currentProjectId,
    viewMode,
    setViewMode,
    openAssumptionModal,
    openProjectModal,
    assumptions,
  } = useStore();

  const [showExportMenu, setShowExportMenu] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations);

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    if (!currentProject) return;

    switch (format) {
      case 'csv':
        exportToCSV(currentProject, projectAssumptions);
        break;
      case 'pdf':
        exportToPDF(currentProject, projectAssumptions);
        break;
      case 'json':
        exportToJSON(currentProject, projectAssumptions);
        break;
    }
    setShowExportMenu(false);
  };

  if (!currentProject) return null;

  return (
    <nav className="bg-gds-blue text-white shadow-md">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Project info */}
          <div className="flex-1">
            <h1
              className="text-xl font-bold cursor-pointer hover:underline"
              onClick={openProjectModal}
              title="Edit project details"
            >
              {currentProject.name}
            </h1>
            <p className="text-sm text-blue-100">
              {currentProject.team} • {currentProject.phase} • {currentProject.date}
            </p>
          </div>

          {/* Center - View toggle */}
          <div className="flex gap-2 bg-white/10 rounded p-1">
            <button
              onClick={() => setViewMode('category')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'category'
                  ? 'bg-white text-gds-blue'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Category View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gds-blue'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Grid View
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex-1 flex justify-end gap-3">
            <button
              onClick={() => openAssumptionModal()}
              className="bg-white text-gds-blue px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              + Add Assumption
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-white/10 text-white px-4 py-2 rounded font-medium hover:bg-white/20 transition-colors"
              >
                Export ▾
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-50">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gds-black hover:bg-gds-light-grey"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gds-black hover:bg-gds-light-grey"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gds-black hover:bg-gds-light-grey"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
