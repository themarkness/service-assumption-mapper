import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToJSON, exportToPDF } from './export';
import type { Project, AssumptionWithCalculations } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'My Project',
    team: 'Alpha Team',
    phase: 'Discovery',
    date: '2024-01-15',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeAssumption(overrides: Partial<AssumptionWithCalculations> = {}): AssumptionWithCalculations {
  return {
    id: 'a1',
    projectId: 'proj-1',
    text: 'Users will adopt the service',
    category: 'users',
    consequence: 'Service fails',
    existingKnowledge: 'User research conducted',
    notes: 'Follow up needed',
    scores: [{ person: 'Alice', importance: 8, confidence: 3, timestamp: 1000 }],
    createdBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    averageImportance: 8,
    averageConfidence: 3,
    riskScore: 56,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DOM mocks (link click + URL APIs)
// ---------------------------------------------------------------------------

function setupDomMocks() {
  const linkMock = {
    href: '',
    download: '',
    click: vi.fn(),
  };

  const createElementSpy = vi
    .spyOn(document, 'createElement')
    .mockReturnValue(linkMock as unknown as HTMLElement);

  const createObjectURLSpy = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:mock-url');

  const revokeObjectURLSpy = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => {});

  return { linkMock, createElementSpy, createObjectURLSpy, revokeObjectURLSpy };
}

/** Returns the string content passed to the first Blob constructor call. */
function getBlobContent(blobSpy: ReturnType<typeof vi.spyOn>): string {
  const [parts] = blobSpy.mock.calls[0] as [BlobPart[], BlobPropertyBag];
  return (parts as string[]).join('');
}

// ---------------------------------------------------------------------------
// exportToCSV
// ---------------------------------------------------------------------------

describe('exportToCSV', () => {
  let mocks: ReturnType<typeof setupDomMocks>;

  beforeEach(() => {
    mocks = setupDomMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers a file download by clicking a link', () => {
    exportToCSV(makeProject(), [makeAssumption()]);
    expect(mocks.linkMock.click).toHaveBeenCalledOnce();
  });

  it('sets the download filename based on the project name', () => {
    exportToCSV(makeProject({ name: 'My Project' }), [makeAssumption()]);
    expect(mocks.linkMock.download).toBe('My_Project_assumptions.csv');
  });

  it('replaces spaces in project name with underscores in filename', () => {
    exportToCSV(makeProject({ name: 'Complex Project Name' }), [makeAssumption()]);
    expect(mocks.linkMock.download).toBe('Complex_Project_Name_assumptions.csv');
  });

  it('creates a Blob with CSV MIME type', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToCSV(makeProject(), [makeAssumption()]);
    const [, options] = blobSpy.mock.calls[0] as [BlobPart[], BlobPropertyBag];
    expect(options?.type).toBe('text/csv;charset=utf-8;');
    blobSpy.mockRestore();
  });

  it('includes expected CSV headers in the blob content', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToCSV(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);

    expect(content).toContain('Assumption Text');
    expect(content).toContain('Category');
    expect(content).toContain('Risk Score');
    expect(content).toContain('Average Importance');
    expect(content).toContain('Average Confidence');
    blobSpy.mockRestore();
  });

  it('includes assumption text in the blob content', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToCSV(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    expect(content).toContain('Users will adopt the service');
    blobSpy.mockRestore();
  });

  it('includes the human-readable category label in the blob content', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToCSV(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    expect(content).toContain('Users'); // category label for 'users'
    blobSpy.mockRestore();
  });

  it('works with an empty assumptions array', () => {
    expect(() => exportToCSV(makeProject(), [])).not.toThrow();
    expect(mocks.linkMock.click).toHaveBeenCalledOnce();
  });

  it('encodes double-quotes in cell values to avoid breaking CSV format', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    const assumption = makeAssumption({ text: 'He said "hello"' });
    exportToCSV(makeProject(), [assumption]);
    const content = getBlobContent(blobSpy);
    // Double-quotes in CSV values must be escaped as ""
    expect(content).toContain('""hello""');
    blobSpy.mockRestore();
  });

  it('formats individual scores as person:I:importance:C:confidence', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    const assumption = makeAssumption({
      scores: [{ person: 'Alice', importance: 8, confidence: 3, timestamp: 1 }],
    });
    exportToCSV(makeProject(), [assumption]);
    const content = getBlobContent(blobSpy);
    expect(content).toContain('Alice:I:8:C:3');
    blobSpy.mockRestore();
  });

  it('handles assumptions without optional fields (consequence, existingKnowledge, notes)', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    // Omit all optional fields to exercise the `|| ''` fallback branches
    const assumption = makeAssumption({
      consequence: undefined,
      existingKnowledge: undefined,
      notes: undefined,
      scores: [],
    });
    exportToCSV(makeProject(), [assumption]);
    const content = getBlobContent(blobSpy);
    // Should still produce valid CSV without throwing
    expect(content).toContain('Assumption Text');
    blobSpy.mockRestore();
  });

  it('includes consequence and existing knowledge in the row', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToCSV(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    expect(content).toContain('Service fails');
    expect(content).toContain('User research conducted');
    blobSpy.mockRestore();
  });

  it('separates multiple scorer entries with a semicolon', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    const assumption = makeAssumption({
      scores: [
        { person: 'Alice', importance: 8, confidence: 3, timestamp: 1 },
        { person: 'Bob', importance: 6, confidence: 7, timestamp: 2 },
      ],
    });
    exportToCSV(makeProject(), [assumption]);
    const content = getBlobContent(blobSpy);
    expect(content).toContain('Alice:I:8:C:3; Bob:I:6:C:7');
    blobSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// exportToJSON
// ---------------------------------------------------------------------------

describe('exportToJSON', () => {
  let mocks: ReturnType<typeof setupDomMocks>;

  beforeEach(() => {
    mocks = setupDomMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers a file download by clicking a link', () => {
    exportToJSON(makeProject(), [makeAssumption()]);
    expect(mocks.linkMock.click).toHaveBeenCalledOnce();
  });

  it('sets the download filename based on the project name', () => {
    exportToJSON(makeProject({ name: 'My Project' }), [makeAssumption()]);
    expect(mocks.linkMock.download).toBe('My_Project_assumptions.json');
  });

  it('creates a Blob with JSON MIME type', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject(), [makeAssumption()]);
    const [, options] = blobSpy.mock.calls[0] as [BlobPart[], BlobPropertyBag];
    expect(options?.type).toBe('application/json');
    blobSpy.mockRestore();
  });

  it('includes project data in the JSON output', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject({ name: 'My Project' }), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    const parsed = JSON.parse(content);
    expect(parsed.project.name).toBe('My Project');
    blobSpy.mockRestore();
  });

  it('includes assumptions in the JSON output', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    const parsed = JSON.parse(content);
    expect(parsed.assumptions).toHaveLength(1);
    blobSpy.mockRestore();
  });

  it('includes an exportedAt timestamp', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject(), [makeAssumption()]);
    const content = getBlobContent(blobSpy);
    const parsed = JSON.parse(content);
    expect(parsed.exportedAt).toBeDefined();
    blobSpy.mockRestore();
  });

  it('produces valid, parseable JSON', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject(), [makeAssumption(), makeAssumption({ id: 'a2' })]);
    const content = getBlobContent(blobSpy);
    expect(() => JSON.parse(content)).not.toThrow();
    const parsed = JSON.parse(content);
    expect(parsed.assumptions).toHaveLength(2);
    blobSpy.mockRestore();
  });

  it('works with an empty assumptions array', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    exportToJSON(makeProject(), []);
    const content = getBlobContent(blobSpy);
    const parsed = JSON.parse(content);
    expect(parsed.assumptions).toEqual([]);
    blobSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// exportToPDF — smoke tests (jsPDF internals are not easily inspectable)
// ---------------------------------------------------------------------------

describe('exportToPDF', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when called with valid data', () => {
    expect(() => exportToPDF(makeProject(), [makeAssumption()])).not.toThrow();
  });

  it('does not throw when called with an empty assumptions list', () => {
    expect(() => exportToPDF(makeProject(), [])).not.toThrow();
  });

  it('does not throw when assumptions arrive in any order (sorts internally)', () => {
    const high = makeAssumption({ id: 'a1', riskScore: 80 });
    const low = makeAssumption({ id: 'a2', riskScore: 10 });
    expect(() => exportToPDF(makeProject(), [low, high])).not.toThrow();
  });

  it('handles assumptions with very long text without throwing', () => {
    const longText = 'A'.repeat(500);
    const assumption = makeAssumption({ text: longText });
    expect(() => exportToPDF(makeProject(), [assumption])).not.toThrow();
  });

  it('handles many assumptions that would span multiple pages', () => {
    const manyAssumptions = Array.from({ length: 50 }, (_, i) =>
      makeAssumption({ id: `a${i}`, riskScore: i * 2 })
    );
    expect(() => exportToPDF(makeProject(), manyAssumptions)).not.toThrow();
  });
});
