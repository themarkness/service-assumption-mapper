import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const SessionBanner: React.FC = () => {
  const { currentProjectId, assumptions, userName } = useStore();
  const [copied, setCopied] = useState(false);

  if (!currentProjectId) return null;

  const sessionUrl = `${window.location.origin}${window.location.pathname}#/session/${currentProjectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Collect unique participant names from all scores + current user
  const participants = new Set<string>();
  if (userName) participants.add(userName);
  assumptions
    .filter((a) => a.projectId === currentProjectId)
    .forEach((a) => {
      a.scores.forEach((s) => participants.add(s.person));
      if (a.createdBy) participants.add(a.createdBy);
    });

  const participantList = Array.from(participants);

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 text-blue-800">
        <span className="font-medium">Session</span>
        <code className="bg-white border border-blue-200 rounded px-2 py-0.5 text-xs font-mono">
          {currentProjectId}
        </code>
        {participantList.length > 0 && (
          <span className="text-blue-600">
            {participantList.length === 1
              ? `${participantList[0]}`
              : `${participantList.slice(0, 3).join(', ')}${participantList.length > 3 ? ` +${participantList.length - 3}` : ''}`}
          </span>
        )}
      </div>

      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
        title={sessionUrl}
      >
        {copied ? '✓ Copied!' : 'Copy invite link'}
      </button>
    </div>
  );
};
