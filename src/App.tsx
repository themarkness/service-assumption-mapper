import { useEffect } from 'react';
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
  const { userName, viewMode, currentProjectId } = useStore();

  // Subscribe to real-time Firestore updates for this session
  useSessionSync(sessionId);

  // If no name yet, prompt for it before showing the session
  if (!userName) {
    return <JoinSessionPage sessionId={sessionId!} />;
  }

  // Project not yet loaded from Firestore (first render)
  if (!currentProjectId) {
    return (
      <div className="min-h-screen bg-gds-light-grey flex items-center justify-center">
        <p className="text-gray-600">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gds-light-grey">
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
