import { GameSessionDetail } from '../types/session';

/**
 * Escapes a single CSV value with RFC 4180 rules.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a full CSV string from a GameSessionDetail object.
 */
export function generateSessionCsv(detail: GameSessionDetail): string {
  const lines: string[] = [];

  // Metadata headers
  lines.push('--- SESSION METRICS REPORT ---');
  lines.push(`Session Title,${escapeCsvCell(detail.session.title || 'Untitled Session')}`);
  lines.push(`Class / Cohort,${escapeCsvCell(detail.session.classGroup || '-')}`);
  lines.push(`PIN,${escapeCsvCell(detail.session.pin)}`);
  lines.push(`Started At,${escapeCsvCell(detail.session.startedAt)}`);
  lines.push(`Total Participants,${escapeCsvCell(detail.session.totalParticipants)}`);
  lines.push(`Average Score,${escapeCsvCell(detail.session.averageScore)}`);
  lines.push(`Overall Accuracy (%),${escapeCsvCell(detail.session.overallAccuracyPercentage)}%`);
  lines.push(`Avg Response Time (ms),${escapeCsvCell(detail.session.averageResponseTimeMs)} ms`);
  lines.push('');

  // Per-question table
  lines.push('Question Number,Question Text,Total Answers,Correct Answers,Wrong Answers,Accuracy (%),Avg Response Time (ms)');
  (detail.questions || []).forEach((q, idx) => {
    lines.push([
      escapeCsvCell(idx + 1),
      escapeCsvCell(q.questionText),
      escapeCsvCell(q.totalAnswers),
      escapeCsvCell(q.correctCount),
      escapeCsvCell(q.wrongCount),
      escapeCsvCell(`${q.correctPercentage}%`),
      escapeCsvCell(q.averageResponseTimeMs),
    ].join(','));
  });

  return lines.join('\r\n');
}

/**
 * Triggers browser download of the CSV content.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

