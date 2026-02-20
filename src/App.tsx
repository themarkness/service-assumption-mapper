import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useSessionSync } from './hooks/useSessionSync';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TopNav } from './components/TopNav';
import { ProjectModal } from './components/ProjectModal';
import { AssumptionModal } from './components/AssumptionModal';
import { ScoreModal } from './components/ScoreModal';
import { CategoryView } from './components/CategoryView';
import { GridView } from './components/GridView';
import { JoinSessionPage } from './components/JoinSessionPage';
import { SessionBanner } from './components/SessionBanner';

/** Renders the session workspace for a given sessionId URL param. */
function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { userName, viewMode, currentProjectId, sessionError, setSessionError, setCurrentProject } = useStore();
  const navigate = useNavigate();

  // Subscribe to real-time Firestore updates for this session
  useSessionSync(sessionId);

  // Reset session state when navigating to a different session. This ensures
  // currentProjectId from the previous session doesn't prevent the timeout
  // from starting for the new session.
  useEffect(() => {
    if (!sessionId) return;
    // Reset session state when sessionId changes
    setSessionError(null);
    // Reset currentProjectId if it doesn't match the new sessionId
    // This allows the timeout to start for the new session
    if (currentProjectId && currentProjectId !== sessionId) {
      setCurrentProject(null);
    }
  }, [sessionId, currentProjectId, setSessionError, setCurrentProject]);

  // Start a timeout once we're in the "waiting for Firestore" state (name set,
  // project not yet loaded). If no data arrives within 8 s the session probably
  // doesn't exist in Firestore (e.g. the save failed silently).
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    // Reset timeout state when sessionId changes
    setLoadingTimedOut(false);
    
    // Only start timer if we have a userName and no currentProjectId
    if (!userName || currentProjectId) return;
    
    const timer = setTimeout(() => setLoadingTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [userName, currentProjectId, sessionId]);

  // If no name yet, prompt for it before showing the session
  if (!userName) {
    return <JoinSessionPage sessionId={sessionId!} />;
  }

  // Project not yet loaded from Firestore (first render)
  if (!currentProjectId) {
    if (sessionError || loadingTimedOut) {
      return (
        <div className="min-h-screen bg-gds-light-grey flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-gray-700 font-medium">Session not found</p>
            <p className="text-gray-500 text-sm">
              {sessionError ?? 'This session could not be loaded. It may have been deleted or the link may be invalid.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mt-2"
            >
              Go to home
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gds-light-grey flex items-center justify-center">
        <p className="text-gray-600">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gds-light-grey">
      {sessionError && (
        <div className="bg-yellow-50 border-b border-yellow-300 px-6 py-2 text-sm text-yellow-800">
          ⚠ {sessionError}
        </div>
      )}
      <SessionBanner />
      <TopNav />
      <main className="h-[calc(100vh-140px)]">
        {viewMode === 'category' ? <CategoryView /> : <GridView />}
      </main>
      <ProjectModal />
      <AssumptionModal />
      <ScoreModal />
    </div>
  );
}

/** Home view — enter name, create a new session, or follow an invite link. */
function HomeView() {
  const { loadData } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <WelcomeScreen />
      <ProjectModal onCreated={(id) => navigate(`/session/${id}`)} />
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/session/:sessionId" element={<SessionView />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
