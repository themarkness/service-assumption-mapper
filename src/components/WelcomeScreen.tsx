import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const WelcomeScreen: React.FC = () => {
  const { userName, setUserName, openProjectModal } = useStore();
  const navigate = useNavigate();
  const [nameInput, setNameInput] = useState(userName || '');
  const [showNameInput, setShowNameInput] = useState(!userName);
  const [joinInput, setJoinInput] = useState('');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setShowNameInput(false);
    }
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    const value = joinInput.trim();
    if (!value) return;

    // Accept full URL or bare session ID
    const match = value.match(/\/session\/([^/#?]+)/);
    const sessionId = match ? match[1] : value;
    navigate(`/session/${sessionId}`);
  };

  const handleCreate = () => {
    openProjectModal();
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
          <form onSubmit={handleNameSubmit} className="mb-6">
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Create session */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-bold text-gds-black mb-2">
                  Start a new session
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Create a shareable session and invite your team to collaborate.
                </p>
                <button
                  onClick={handleCreate}
                  className="btn-primary w-full"
                  aria-label="Create session"
                >
                  Create session
                </button>
              </div>

              {/* Join session */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-bold text-gds-black mb-2">
                  Join a session
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Paste an invite link or session ID to collaborate with others.
                </p>
                <form onSubmit={handleJoinSession} className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    className="input-field"
                    placeholder="Paste invite link or session ID"
                    aria-label="Invite link or session ID"
                  />
                  <button type="submit" className="btn-primary">
                    Join session
                  </button>
                </form>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-bold text-gds-black mb-3">Getting Started</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Create a session and fill in context (service name, team, phase)</li>
                <li>Share the invite link with your team</li>
                <li>Add assumption cards in 8 categorized columns</li>
                <li>Score each assumption for Importance and Confidence</li>
                <li>View prioritization in Category or Grid view</li>
                <li>Export results for documentation</li>
              </ol>
            </div>
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
