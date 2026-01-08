import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const WelcomeScreen: React.FC = () => {
  const { userName, setUserName, openProjectModal } = useStore();
  const [nameInput, setNameInput] = useState(userName || '');
  const [showNameInput, setShowNameInput] = useState(!userName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setShowNameInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-gds-light-grey flex items-center justify-center p-6">
      <div className="max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gds-black mb-4">
          Government Service Assumptions Mapping Tool
        </h1>

        <p className="text-gray-700 mb-6">
          Welcome to the Riskiest Assumption Testing (RAT) tool. This tool helps government
          product teams map, score, and prioritize service assumptions using the GDS
          methodology.
        </p>

        {showNameInput ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gds-black mb-2"
            >
              What's your name? (This will be used to track your scores)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="userName"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="input-field flex-1"
                placeholder="Enter your name"
                required
              />
              <button type="submit" className="btn-primary">
                Continue
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm">
              <strong>Welcome, {userName}!</strong>
              <button
                onClick={() => setShowNameInput(true)}
                className="ml-2 text-gds-blue hover:underline text-xs"
              >
                Change name
              </button>
            </p>
          </div>
        )}

        {!showNameInput && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gds-black mb-3">Getting Started</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Create a project and fill in context (service name, team, phase)</li>
                <li>Add assumption cards in 8 categorized columns</li>
                <li>Score each assumption for Importance and Confidence</li>
                <li>View prioritization in Category or Grid view</li>
                <li>Export results for documentation</li>
              </ol>
            </div>

            <button onClick={openProjectModal} className="btn-primary w-full text-lg py-3">
              Create Your First Project
            </button>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Based on the GDS Riskiest Assumption Testing methodology. Learn more at{' '}
            <a
              href="https://services.blog.gov.uk/2022/11/03/prioritise-the-riskiest-assumptions-in-big-problem-spaces/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gds-blue hover:underline"
            >
              GDS Blog
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
