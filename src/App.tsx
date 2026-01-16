import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TopNav } from './components/TopNav';
import { ProjectModal } from './components/ProjectModal';
import { AssumptionModal } from './components/AssumptionModal';
import { ScoreModal } from './components/ScoreModal';
import { CategoryView } from './components/CategoryView';
import { GridView } from './components/GridView';
import { ProjectsPage } from './components/ProjectsPage';

function App() {
  const { loadData, currentProjectId, viewMode, projects } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // If no projects exist at all, show welcome screen
  if (projects.length === 0) {
    return (
      <>
        <WelcomeScreen />
        <ProjectModal />
      </>
    );
  }

  // If viewing projects list
  if (viewMode === 'projects') {
    return (
      <>
        <ProjectsPage />
        <ProjectModal />
      </>
    );
  }

  // If no current project selected but projects exist, show projects page
  if (!currentProjectId) {
    return (
      <>
        <ProjectsPage />
        <ProjectModal />
      </>
    );
  }

  // Main app view with current project
  return (
    <div className="min-h-screen bg-gds-light-grey">
      <TopNav />

      <main className="h-[calc(100vh-100px)]">
        {viewMode === 'category' ? <CategoryView /> : <GridView />}
      </main>

      {/* Modals */}
      <ProjectModal />
      <AssumptionModal />
      <ScoreModal />
    </div>
  );
}

export default App;
