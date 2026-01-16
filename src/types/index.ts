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
  service: 'The end-to-end journey works, users can complete their goal, online and offline touchpoints connect seamlessly',
  product: 'The features solve the problem, users can complete core tasks, the MVP is viable and can evolve',
  users: 'They need this, they can use it, they can access it, they understand what to do',
  business_case: 'It\'s worth the investment, it will deliver savings, we can evidence the value',
  market: 'There\'s demand at scale, it\'s different from alternatives, people will adopt it',
  technology: 'We can build it, it will integrate with existing systems, it meets security requirements',
  delivery: 'The team can deliver it with the capacity they have, we can prioritise the work, we can take lean, agile approaches as necessary',
  stakeholders: 'We have political buy-in, departments will align, policy and legal requirements are met',
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
