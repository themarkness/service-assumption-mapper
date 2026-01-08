import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TopNav } from './components/TopNav';
import { ProjectModal } from './components/ProjectModal';
import { AssumptionModal } from './components/AssumptionModal';
import { ScoreModal } from './components/ScoreModal';
import { CategoryView } from './components/CategoryView';
import { GridView } from './components/GridView';

function App() {
  const { loadData, currentProjectId, viewMode } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!currentProjectId) {
    return (
      <>
        <WelcomeScreen />
        <ProjectModal />
      </>
    );
  }

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
