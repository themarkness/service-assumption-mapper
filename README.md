# Government Service Assumptions Mapping Tool

A web-based collaborative tool for government product teams to map, score, and prioritize service assumptions using the GDS Riskiest Assumption Testing (RAT) methodology.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

This tool helps government product teams identify and prioritize their riskiest assumptions during service development. Based on the [GDS Riskiest Assumption Testing methodology](https://services.blog.gov.uk/2022/11/03/prioritise-the-riskiest-assumptions-in-big-problem-spaces/), it provides an intuitive interface for:

- Creating and managing assumption cards across 8 key categories
- Individual and team scoring of assumptions
- Automatic risk calculation: **Risk = Importance × (10 - Confidence)**
- Visual prioritization in both Category and Grid views
- Export capabilities for documentation and reporting

## Features

### Core Functionality

- **Project Management**: Create projects with context (service name, team, phase, date)
- **8 Category System**: Organize assumptions by:
  - Service
  - Product
  - Users
  - Business Case
  - Market Opportunity
  - Technology
  - Delivery Approach
  - Stakeholders

- **Collaborative Scoring**: Multiple team members can score assumptions independently
- **Automatic Risk Calculation**: Risk scores update automatically based on importance and confidence
- **Dual View Modes**:
  - **Category View**: Column-based organization by assumption type
  - **Grid View**: 2×2 prioritization matrix (Importance vs. Certainty)

- **Drag & Drop**: Move assumptions between categories easily
- **Export Options**: CSV, PDF, and JSON formats

### Technical Features

- Built with React 19 + TypeScript
- Styled with Tailwind CSS (GDS design system colors)
- Drag-and-drop powered by @dnd-kit
- State management with Zustand
- LocalStorage persistence (no backend required)
- Fully responsive design
- PDF generation with jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd service-assumption-mapper
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser to \`http://localhost:5173\`

### Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the \`dist/\` directory, ready to deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Usage Guide

### 1. Initial Setup

When you first open the app:
1. Enter your name (this will be used to track your scores)
2. Click "Create Your First Project"
3. Fill in project details:
   - Service/Product Name
   - Team/Department
   - Phase (Discovery, Alpha, Beta, or Live)
   - Date

### 2. Adding Assumptions

**Option 1**: Click the "+ Add assumption" button in any category column

**Option 2**: Click the "+ Add Assumption" button in the top navigation

Fill in:
- Assumption text (required)
- Category (required)
- Consequence if wrong (optional)
- Existing knowledge (optional)

### 3. Scoring Assumptions

1. Click on any assumption card
2. Use the sliders to set:
   - **Importance** (1-10): How critical is it if we get this wrong?
   - **Confidence** (1-10): How sure are you about this assumption?
3. Add optional notes
4. Click "Save Score"

The risk score is calculated automatically: **Risk = Importance × (10 - Confidence)**

### 4. View Modes

**Category View** (default):
- See all assumptions organized by category
- Drag cards between categories
- View count of assumptions per category

**Grid View**:
- See scored assumptions positioned on a 2×2 matrix
- X-axis: Certainty (Uncertain → Certain)
- Y-axis: Importance (Low → High)
- Four quadrants:
  - **Priority to Test** (top-left): Uncertain + Important
  - **Validate Confidence** (top-right): Certain + Important
  - **Defer for Now** (bottom-left): Uncertain + Unimportant
  - **Document as Axioms** (bottom-right): Certain + Unimportant

### 5. Exporting Results

Click the "Export" dropdown in the top navigation:

- **CSV**: Spreadsheet format with all assumption data
- **PDF**: Formatted report sorted by risk score
- **JSON**: Full data backup for transfer/archival

## Architecture

\`\`\`
src/
├── components/         # React components
│   ├── AssumptionCard.tsx
│   ├── AssumptionModal.tsx
│   ├── CategoryView.tsx
│   ├── GridView.tsx
│   ├── ProjectModal.tsx
│   ├── ScoreModal.tsx
│   ├── TopNav.tsx
│   └── WelcomeScreen.tsx
├── store/             # Zustand state management
│   └── useStore.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   ├── calculations.ts
│   ├── export.ts
│   └── storage.ts
├── App.tsx            # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
\`\`\`

## Data Model

### Project
\`\`\`typescript
{
  id: string;
  name: string;
  team: string;
  phase: 'Discovery' | 'Alpha' | 'Beta' | 'Live';
  date: string;
  createdAt: number;
  updatedAt: number;
}
\`\`\`

### Assumption
\`\`\`typescript
{
  id: string;
  projectId: string;
  text: string;
  category: AssumptionCategory;
  consequence?: string;
  existingKnowledge?: string;
  scores: Score[];
  notes?: string;
  manualPosition?: { x: number; y: number };
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
\`\`\`

### Score
\`\`\`typescript
{
  person: string;
  importance: number;  // 1-10
  confidence: number;  // 1-10
  notes?: string;
  timestamp: number;
}
\`\`\`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Persistence

All data is stored in browser localStorage:
- Persists across sessions
- Private to each browser/device
- No backend required
- Recommended to export regularly for backups

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- WCAG 2.1 AA compliant
- Focus management in modals

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## References

- [GDS Blog: Prioritise the riskiest assumptions](https://services.blog.gov.uk/2022/11/03/prioritise-the-riskiest-assumptions-in-big-problem-spaces/)
- [GDS Design System](https://design-system.service.gov.uk/)
- [Teresa Torres: Opportunity Solution Trees](https://www.producttalk.org/opportunity-solution-tree/)

## Support

For issues or questions:
- Open an issue on GitHub
- Check the GDS Service Manual for methodology questions

---

Built with ❤️ for government product teams
