export type ProjectPhase = 'Discovery' | 'Alpha' | 'Beta' | 'Live';

export type AssumptionCategory =
  | 'service'
  | 'product'
  | 'users'
  | 'business_case'
  | 'market'
  | 'technology'
  | 'delivery'
  | 'stakeholders';

export interface Score {
  person: string;
  importance: number; // 1-10
  confidence: number; // 1-10
  notes?: string;
  timestamp: number;
}

export interface Assumption {
  id: string;
  projectId: string;
  text: string;
  category: AssumptionCategory;
  consequence?: string;
  existingKnowledge?: string;
  scores: Score[];
  notes?: string;
  manualPosition?: { x: number; y: number }; // For grid view overrides
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  team: string;
  phase: ProjectPhase;
  date: string;
  createdAt: number;
  updatedAt: number;
}

export interface AssumptionWithCalculations extends Assumption {
  averageImportance: number;
  averageConfidence: number;
  riskScore: number; // importance × (10 - confidence)
}

export type ViewMode = 'category' | 'grid';

export const CATEGORY_LABELS: Record<AssumptionCategory, string> = {
  service: 'Service',
  product: 'Product',
  users: 'Users',
  business_case: 'Business Case',
  market: 'Market Opportunity',
  technology: 'Technology',
  delivery: 'Delivery Approach',
  stakeholders: 'Stakeholders',
};

export const CATEGORY_DESCRIPTIONS: Record<AssumptionCategory, string> = {
  service: 'How the end-to-end service works across touchpoints',
  product: 'Specific digital product features and MVP scope',
  users: 'Who uses the service and their needs, behaviours, contexts',
  business_case: 'Costs, benefits, ROI, and demonstrating value',
  market: 'Demand, scale of problem, existing alternatives',
  technology: 'Technical feasibility, stack, integrations, capabilities',
  delivery: 'Team skills, ways of working, dependencies',
  stakeholders: 'Political support, departmental buy-in, policy requirements',
};

export const CATEGORY_COLORS: Record<AssumptionCategory, string> = {
  service: '#1d70b8',
  product: '#5694ca',
  users: '#00703c',
  business_case: '#912b88',
  market: '#f47738',
  technology: '#d4351c',
  delivery: '#ffdd00',
  stakeholders: '#4c2c92',
};
