import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProjects,
  loadProjects,
  saveProject,
  deleteProject,
  saveAssumptions,
  loadAssumptions,
  loadAssumptionsForProject,
  saveAssumption,
  deleteAssumption,
  setCurrentProject,
  getCurrentProjectId,
  saveUserName,
  loadUserName,
  generateId,
} from './storage';
import type { Project, Assumption } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    team: 'Alpha Team',
    phase: 'Discovery',
    date: '2024-01-01',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'assm-1',
    projectId: 'proj-1',
    text: 'Users will adopt the service',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

// localStorage is cleared before each test by the global setup.

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

describe('saveProjects / loadProjects', () => {
  it('returns an empty array when storage is empty', () => {
    expect(loadProjects()).toEqual([]);
  });

  it('persists and retrieves a list of projects', () => {
    const projects = [makeProject(), makeProject({ id: 'proj-2', name: 'Second' })];
    saveProjects(projects);
    expect(loadProjects()).toEqual(projects);
  });

  it('overwrites the existing list on every save', () => {
    saveProjects([makeProject()]);
    saveProjects([makeProject({ id: 'proj-2', name: 'New' })]);
    const result = loadProjects();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('proj-2');
  });
});

describe('saveProject', () => {
  it('appends a new project when it does not exist yet', () => {
    const p1 = makeProject({ id: 'proj-1' });
    const p2 = makeProject({ id: 'proj-2' });
    saveProject(p1);
    saveProject(p2);
    expect(loadProjects()).toHaveLength(2);
  });

  it('updates an existing project in-place', () => {
    const original = makeProject({ name: 'Original' });
    saveProject(original);

    const updated = { ...original, name: 'Updated' };
    saveProject(updated);

    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Updated');
  });
});

describe('deleteProject', () => {
  it('removes the specified project', () => {
    saveProject(makeProject({ id: 'proj-1' }));
    saveProject(makeProject({ id: 'proj-2' }));
    deleteProject('proj-1');

    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('proj-2');
  });

  it('also removes all assumptions belonging to the deleted project', () => {
    saveProject(makeProject({ id: 'proj-1' }));
    saveAssumption(makeAssumption({ id: 'a1', projectId: 'proj-1' }));
    saveAssumption(makeAssumption({ id: 'a2', projectId: 'proj-2' }));

    deleteProject('proj-1');

    const assumptions = loadAssumptions();
    expect(assumptions).toHaveLength(1);
    expect(assumptions[0].projectId).toBe('proj-2');
  });

  it('is a no-op when the project does not exist', () => {
    saveProject(makeProject({ id: 'proj-1' }));
    deleteProject('nonexistent');
    expect(loadProjects()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Assumptions
// ---------------------------------------------------------------------------

describe('saveAssumptions / loadAssumptions', () => {
  it('returns an empty array when storage is empty', () => {
    expect(loadAssumptions()).toEqual([]);
  });

  it('persists and retrieves a list of assumptions', () => {
    const assumptions = [
      makeAssumption({ id: 'a1' }),
      makeAssumption({ id: 'a2' }),
    ];
    saveAssumptions(assumptions);
    expect(loadAssumptions()).toEqual(assumptions);
  });
});

describe('loadAssumptionsForProject', () => {
  it('returns only assumptions for the specified project', () => {
    saveAssumption(makeAssumption({ id: 'a1', projectId: 'proj-1' }));
    saveAssumption(makeAssumption({ id: 'a2', projectId: 'proj-2' }));
    saveAssumption(makeAssumption({ id: 'a3', projectId: 'proj-1' }));

    const result = loadAssumptionsForProject('proj-1');
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.projectId === 'proj-1')).toBe(true);
  });

  it('returns an empty array when no assumptions exist for the project', () => {
    expect(loadAssumptionsForProject('proj-unknown')).toEqual([]);
  });
});

describe('saveAssumption', () => {
  it('appends a new assumption when it does not exist yet', () => {
    saveAssumption(makeAssumption({ id: 'a1' }));
    saveAssumption(makeAssumption({ id: 'a2' }));
    expect(loadAssumptions()).toHaveLength(2);
  });

  it('updates an existing assumption in-place', () => {
    const original = makeAssumption({ text: 'Original text' });
    saveAssumption(original);

    const updated = { ...original, text: 'Updated text' };
    saveAssumption(updated);

    const assumptions = loadAssumptions();
    expect(assumptions).toHaveLength(1);
    expect(assumptions[0].text).toBe('Updated text');
  });
});

describe('deleteAssumption', () => {
  it('removes the specified assumption', () => {
    saveAssumption(makeAssumption({ id: 'a1' }));
    saveAssumption(makeAssumption({ id: 'a2' }));
    deleteAssumption('a1');

    const assumptions = loadAssumptions();
    expect(assumptions).toHaveLength(1);
    expect(assumptions[0].id).toBe('a2');
  });

  it('is a no-op when the assumption does not exist', () => {
    saveAssumption(makeAssumption({ id: 'a1' }));
    deleteAssumption('nonexistent');
    expect(loadAssumptions()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Current Project
// ---------------------------------------------------------------------------

describe('setCurrentProject / getCurrentProjectId', () => {
  it('returns null when nothing has been set', () => {
    expect(getCurrentProjectId()).toBeNull();
  });

  it('stores and retrieves the current project ID', () => {
    setCurrentProject('proj-42');
    expect(getCurrentProjectId()).toBe('proj-42');
  });

  it('overwrites the previous value', () => {
    setCurrentProject('proj-1');
    setCurrentProject('proj-2');
    expect(getCurrentProjectId()).toBe('proj-2');
  });
});

// ---------------------------------------------------------------------------
// User Name
// ---------------------------------------------------------------------------

describe('saveUserName / loadUserName', () => {
  it('returns null when no user name has been saved', () => {
    expect(loadUserName()).toBeNull();
  });

  it('stores and retrieves a user name', () => {
    saveUserName('Alice');
    expect(loadUserName()).toBe('Alice');
  });

  it('overwrites the previous user name', () => {
    saveUserName('Alice');
    saveUserName('Bob');
    expect(loadUserName()).toBe('Bob');
  });
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('contains a hyphen separating timestamp and random part', () => {
    expect(generateId()).toContain('-');
  });
});
