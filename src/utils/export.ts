import jsPDF from 'jspdf';
import type { Project, AssumptionWithCalculations } from '../types';
import { CATEGORY_LABELS } from '../types';

export function exportToCSV(
  project: Project,
  assumptions: AssumptionWithCalculations[]
): void {
  const headers = [
    'Assumption Text',
    'Category',
    'Average Importance',
    'Average Confidence',
    'Risk Score',
    'Consequence',
    'Existing Knowledge',
    'Individual Scores',
    'Notes',
  ];

  const rows = assumptions.map((assumption) => {
    const scoresText = assumption.scores
      .map(
        (s) => `${s.person}:I:${s.importance}:C:${s.confidence}`
      )
      .join('; ');

    return [
      assumption.text,
      CATEGORY_LABELS[assumption.category],
      assumption.averageImportance.toFixed(2),
      assumption.averageConfidence.toFixed(2),
      assumption.riskScore.toFixed(2),
      assumption.consequence || '',
      assumption.existingKnowledge || '',
      scoresText,
      assumption.notes || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${project.name.replace(/\s+/g, '_')}_assumptions.csv`;
  link.click();
}

export function exportToPDF(
  project: Project,
  assumptions: AssumptionWithCalculations[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Title page
  doc.setFontSize(20);
  doc.text('Riskiest Assumption Testing', margin, yPos);
  yPos += 15;

  doc.setFontSize(14);
  doc.text(project.name, margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Team: ${project.team}`, margin, yPos);
  yPos += 6;
  doc.text(`Phase: ${project.phase}`, margin, yPos);
  yPos += 6;
  doc.text(`Date: ${project.date}`, margin, yPos);
  yPos += 15;

  // Sort by risk score (highest first)
  const sortedAssumptions = [...assumptions].sort((a, b) => b.riskScore - a.riskScore);

  doc.setFontSize(12);
  doc.text('Assumptions by Risk Score', margin, yPos);
  yPos += 10;

  // Add assumptions
  sortedAssumptions.forEach((assumption, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${CATEGORY_LABELS[assumption.category]}`, margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(assumption.text, pageWidth - 2 * margin);
    doc.text(textLines, margin + 5, yPos);
    yPos += textLines.length * 5;

    doc.setFontSize(9);
    doc.text(
      `Risk Score: ${assumption.riskScore.toFixed(1)} | Importance: ${assumption.averageImportance.toFixed(1)} | Confidence: ${assumption.averageConfidence.toFixed(1)}`,
      margin + 5,
      yPos
    );
    yPos += 8;
  });

  doc.save(`${project.name.replace(/\s+/g, '_')}_assumptions.pdf`);
}

export function exportToJSON(
  project: Project,
  assumptions: AssumptionWithCalculations[]
): void {
  const data = {
    project,
    assumptions,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${project.name.replace(/\s+/g, '_')}_assumptions.json`;
  link.click();
}
