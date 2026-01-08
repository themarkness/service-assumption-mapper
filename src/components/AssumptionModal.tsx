import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { AssumptionCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

export const AssumptionModal: React.FC = () => {
  const {
    isAssumptionModalOpen,
    closeAssumptionModal,
    editingAssumption,
    createAssumption,
    updateAssumption,
    currentProjectId,
    userName,
  } = useStore();

  const [formData, setFormData] = useState({
    text: '',
    category: 'service' as AssumptionCategory,
    consequence: '',
    existingKnowledge: '',
  });

  useEffect(() => {
    // Only pre-fill form if we're editing an existing assumption with an ID
    if (editingAssumption && editingAssumption.id) {
      setFormData({
        text: editingAssumption.text,
        category: editingAssumption.category,
        consequence: editingAssumption.consequence || '',
        existingKnowledge: editingAssumption.existingKnowledge || '',
      });
    } else if (editingAssumption && editingAssumption.category) {
      // New assumption with pre-selected category
      setFormData({
        text: '',
        category: editingAssumption.category,
        consequence: '',
        existingKnowledge: '',
      });
    } else {
      // Completely new assumption
      setFormData({
        text: '',
        category: 'service',
        consequence: '',
        existingKnowledge: '',
      });
    }
  }, [editingAssumption, isAssumptionModalOpen]);

  if (!isAssumptionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if we're editing an existing assumption (has a real ID)
    if (editingAssumption && editingAssumption.id) {
      updateAssumption({
        ...editingAssumption,
        ...formData,
      });
    } else {
      // Creating a new assumption
      if (!currentProjectId) return;
      createAssumption({
        ...formData,
        projectId: currentProjectId,
        scores: [],
        createdBy: userName || 'Anonymous',
      });
    }

    closeAssumptionModal();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay" onClick={closeAssumptionModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gds-black">
            {editingAssumption ? 'Edit Assumption' : 'Add New Assumption'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="text"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Assumption *
                </label>
                <textarea
                  id="text"
                  name="text"
                  required
                  value={formData.text}
                  onChange={handleChange}
                  className="input-field min-h-[100px]"
                  placeholder="Describe your assumption..."
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="consequence"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Consequence if wrong (optional)
                </label>
                <textarea
                  id="consequence"
                  name="consequence"
                  value={formData.consequence}
                  onChange={handleChange}
                  className="input-field min-h-[80px]"
                  placeholder="What happens if this assumption is wrong?"
                />
              </div>

              <div>
                <label
                  htmlFor="existingKnowledge"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Existing knowledge (optional)
                </label>
                <textarea
                  id="existingKnowledge"
                  name="existingKnowledge"
                  value={formData.existingKnowledge}
                  onChange={handleChange}
                  className="input-field min-h-[80px]"
                  placeholder="What do we already know about this?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">
                {editingAssumption ? 'Save Changes' : 'Add Assumption'}
              </button>
              <button
                type="button"
                onClick={closeAssumptionModal}
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
