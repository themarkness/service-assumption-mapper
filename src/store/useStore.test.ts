import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import type { Project, Assumption } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset Zustand store to initial state before each test */
function resetStore() {
  useStore.setState({
    projects: [],
    assumptions: [],
    currentProjectId: null,
    userName: null,
    viewMode: 'category',
    isProjectModalOpen: false,
    isAssumptionModalOpen: false,
    isScoreModalOpen: false,
    editingAssumption: null,
    scoringAssumption: null,
  });
}

function getState() {
  return useStore.getState();
}

function makeProjectData(): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Test Project',
    team: 'Alpha Team',
    phase: 'Discovery',
    date: '2024-01-01',
  };
}

function makeAssumptionData(
  projectId = 'proj-1'
): Omit<Assumption, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    projectId,
    text: 'Users will adopt the service',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetStore();
  // localStorage is cleared by global setup in src/test/setup.ts
});

// ---------------------------------------------------------------------------
// loadData
// ---------------------------------------------------------------------------

describe('loadData', () => {
  it('loads empty state when localStorage is empty', () => {
    getState().loadData();
    const { projects, assumptions, currentProjectId, userName } = getState();
    expect(projects).toEqual([]);
    expect(assumptions).toEqual([]);
    expect(currentProjectId).toBeNull();
    expect(userName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setUserName
// ---------------------------------------------------------------------------

describe('setUserName', () => {
  it('updates userName in the store', () => {
    getState().setUserName('Alice');
    expect(getState().userName).toBe('Alice');
  });

  it('persists the user name across loadData calls', () => {
    getState().setUserName('Bob');
    resetStore();
    getState().loadData();
    expect(getState().userName).toBe('Bob');
  });
});

// ---------------------------------------------------------------------------
// Project actions
// ---------------------------------------------------------------------------

describe('createProject', () => {
  it('adds a new project to the store', () => {
    getState().createProject(makeProjectData());
    expect(getState().projects).toHaveLength(1);
  });

  it('sets the new project as the current project', () => {
    getState().createProject(makeProjectData());
    const { projects, currentProjectId } = getState();
    expect(currentProjectId).toBe(projects[0].id);
  });

  it('switches the view to category mode', () => {
    useStore.setState({ viewMode: 'grid' });
    getState().createProject(makeProjectData());
    expect(getState().viewMode).toBe('category');
  });

  it('assigns an auto-generated id to the project', () => {
    getState().createProject(makeProjectData());
    expect(getState().projects[0].id).toBeDefined();
    expect(typeof getState().projects[0].id).toBe('string');
  });

  it('creates multiple projects with unique ids', () => {
    getState().createProject(makeProjectData());
    getState().createProject({ ...makeProjectData(), name: 'Second' });
    const [p1, p2] = getState().projects;
    expect(p1.id).not.toBe(p2.id);
  });
});

describe('updateProject', () => {
  it('updates the project name in the store', () => {
    getState().createProject(makeProjectData());
    const project = getState().projects[0];

    getState().updateProject({ ...project, name: 'Updated Name' });

    expect(getState().projects[0].name).toBe('Updated Name');
  });

  it('does not increase the number of projects', () => {
    getState().createProject(makeProjectData());
    const project = getState().projects[0];
    getState().updateProject({ ...project, name: 'Changed' });
    expect(getState().projects).toHaveLength(1);
  });
});

describe('deleteProject', () => {
  it('removes the project from the store', () => {
    getState().createProject(makeProjectData());
    const { projects } = getState();
    getState().deleteProject(projects[0].id);
    expect(getState().projects).toHaveLength(0);
  });

  it('sets currentProjectId to null when all projects are deleted', () => {
    getState().createProject(makeProjectData());
    const { projects } = getState();
    getState().deleteProject(projects[0].id);
    expect(getState().currentProjectId).toBeNull();
  });

  it('selects the first remaining project after deletion', () => {
    getState().createProject(makeProjectData());
    getState().createProject({ ...makeProjectData(), name: 'Second' });
    const firstId = getState().projects[0].id;
    getState().deleteProject(firstId);
    expect(getState().currentProjectId).toBe(getState().projects[0].id);
  });
});

describe('setCurrentProject', () => {
  it('updates currentProjectId', () => {
    getState().createProject(makeProjectData());
    const id = getState().projects[0].id;
    useStore.setState({ currentProjectId: null });

    getState().setCurrentProject(id);
    expect(getState().currentProjectId).toBe(id);
  });
});

describe('Project modal', () => {
  it('openProjectModal sets isProjectModalOpen to true', () => {
    getState().openProjectModal();
    expect(getState().isProjectModalOpen).toBe(true);
  });

  it('closeProjectModal sets isProjectModalOpen to false', () => {
    getState().openProjectModal();
    getState().closeProjectModal();
    expect(getState().isProjectModalOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Assumption actions
// ---------------------------------------------------------------------------

describe('createAssumption', () => {
  it('adds a new assumption to the store', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    expect(getState().assumptions).toHaveLength(1);
  });

  it('assigns an auto-generated id', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    expect(getState().assumptions[0].id).toBeDefined();
  });
});

describe('updateAssumption', () => {
  it('updates the assumption text in the store', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumption = getState().assumptions[0];

    getState().updateAssumption({ ...assumption, text: 'Updated text' });

    expect(getState().assumptions[0].text).toBe('Updated text');
  });
});

describe('deleteAssumption', () => {
  it('removes the assumption from the store', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumptionId = getState().assumptions[0].id;

    getState().deleteAssumption(assumptionId);

    expect(getState().assumptions).toHaveLength(0);
  });
});

describe('Assumption modal', () => {
  it('openAssumptionModal without argument sets isAssumptionModalOpen true with no editingAssumption', () => {
    getState().openAssumptionModal();
    expect(getState().isAssumptionModalOpen).toBe(true);
    expect(getState().editingAssumption).toBeNull();
  });

  it('openAssumptionModal with an assumption sets editingAssumption', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumption = getState().assumptions[0];

    getState().openAssumptionModal(assumption);
    expect(getState().editingAssumption).toEqual(assumption);
  });

  it('closeAssumptionModal clears modal state', () => {
    getState().openAssumptionModal();
    getState().closeAssumptionModal();
    expect(getState().isAssumptionModalOpen).toBe(false);
    expect(getState().editingAssumption).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Score actions
// ---------------------------------------------------------------------------

describe('addScore', () => {
  it('adds a score to the assumption', () => {
    getState().setUserName('Alice');
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumptionId = getState().assumptions[0].id;

    getState().addScore(assumptionId, { importance: 7, confidence: 4 });

    const updated = getState().assumptions[0];
    expect(updated.scores).toHaveLength(1);
    expect(updated.scores[0].importance).toBe(7);
    expect(updated.scores[0].confidence).toBe(4);
    expect(updated.scores[0].person).toBe('Alice');
  });

  it('replaces an existing score from the same user', () => {
    getState().setUserName('Alice');
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumptionId = getState().assumptions[0].id;

    getState().addScore(assumptionId, { importance: 5, confidence: 5 });
    getState().addScore(assumptionId, { importance: 9, confidence: 2 });

    const scores = getState().assumptions[0].scores;
    expect(scores).toHaveLength(1);
    expect(scores[0].importance).toBe(9);
  });

  it('uses "Anonymous" when no userName is set', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumptionId = getState().assumptions[0].id;

    getState().addScore(assumptionId, { importance: 6, confidence: 6 });

    expect(getState().assumptions[0].scores[0].person).toBe('Anonymous');
  });

  it('does nothing when the assumption does not exist', () => {
    getState().addScore('nonexistent-id', { importance: 5, confidence: 5 });
    // Should not throw and assumptions array stays the same
    expect(getState().assumptions).toHaveLength(0);
  });

  it('allows multiple different users to score the same assumption', () => {
    getState().setUserName('Alice');
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumptionId = getState().assumptions[0].id;

    getState().addScore(assumptionId, { importance: 8, confidence: 3 });

    getState().setUserName('Bob');
    getState().addScore(assumptionId, { importance: 6, confidence: 7 });

    expect(getState().assumptions[0].scores).toHaveLength(2);
  });
});

describe('Score modal', () => {
  it('openScoreModal sets isScoreModalOpen true and scoringAssumption', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumption = getState().assumptions[0];

    getState().openScoreModal(assumption);

    expect(getState().isScoreModalOpen).toBe(true);
    expect(getState().scoringAssumption).toEqual(assumption);
  });

  it('closeScoreModal clears modal state', () => {
    getState().createProject(makeProjectData());
    const projectId = getState().projects[0].id;
    getState().createAssumption(makeAssumptionData(projectId));
    const assumption = getState().assumptions[0];

    getState().openScoreModal(assumption);
    getState().closeScoreModal();

    expect(getState().isScoreModalOpen).toBe(false);
    expect(getState().scoringAssumption).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

describe('setViewMode', () => {
  it('updates viewMode to grid', () => {
    getState().setViewMode('grid');
    expect(getState().viewMode).toBe('grid');
  });

  it('updates viewMode to projects', () => {
    getState().setViewMode('projects');
    expect(getState().viewMode).toBe('projects');
  });

  it('updates viewMode back to category', () => {
    getState().setViewMode('grid');
    getState().setViewMode('category');
    expect(getState().viewMode).toBe('category');
  });
});
