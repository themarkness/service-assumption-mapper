import React, { useState } from 'react';
import { useStore } from '../store/useStore';

interface JoinSessionPageProps {
  sessionId: string;
}

export const JoinSessionPage: React.FC<JoinSessionPageProps> = ({ sessionId }) => {
  const { setUserName } = useStore();
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
    }
  };

  return (
    <div className="min-h-screen bg-gds-light-grey flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gds-black mb-2">
          Join session
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          You've been invited to collaborate on a RAT session.
          Enter your name to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="joinName"
            className="block text-sm font-medium text-gds-black mb-2"
          >
            Your name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="joinName"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input-field flex-1"
              placeholder="Enter your name"
              autoFocus
              required
            />
            <button type="submit" className="btn-primary">
              Join
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Session ID: <code className="bg-gray-100 px-1 rounded">{sessionId}</code>
        </p>
      </div>
    </div>
  );
};
