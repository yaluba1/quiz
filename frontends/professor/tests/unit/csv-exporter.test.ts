import { describe, it, expect, vi } from 'vitest';
import {
  escapeCsvCell,
  generateSessionCsv,
  downloadCsvFile,
} from '../../src/lib/csv-exporter';
import { GameSessionDetail } from '../../src/types/session';

describe('CSV Exporter Unit Tests', () => {
  it('escapes CSV cells properly', () => {
    expect(escapeCsvCell('Simple text')).toBe('Simple text');
    expect(escapeCsvCell('Text with, comma')).toBe('"Text with, comma"');
    expect(escapeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
    expect(escapeCsvCell(42)).toBe('42');
  });

  it('generates complete CSV document from session detail', () => {
    const detail: GameSessionDetail = {
      session: {
        id: 'session-123',
        title: 'Midterm Exam, Group 1',
        classGroup: 'Class 4B',
        pin: '123456',
        status: 'FINISHED',
        totalParticipants: 30,
        startedAt: '2026-10-08T10:00:00Z',
        endedAt: '2026-10-08T10:30:00Z',
        averageScore: 4500,
        averageResponseTimeMs: 3500,
        overallAccuracyPercentage: 80,
      },
      questions: [
        {
          questionId: 'q-1',
          questionText: 'What is 2 + 2?',
          totalAnswers: 30,
          correctCount: 28,
          wrongCount: 2,
          correctPercentage: 93.3,
          averageResponseTimeMs: 2100,
          optionDistribution: { opt1: 28, opt2: 2 },
        },
      ],
    };

    const csv = generateSessionCsv(detail);
    expect(csv).toContain('SESSION METRICS REPORT');
    expect(csv).toContain('"Midterm Exam, Group 1"');
    expect(csv).toContain('123456');
    expect(csv).toContain('What is 2 + 2?');
    expect(csv).toContain('93.3%');
    expect(csv).toContain('2100');
  });

  it('triggers browser download link', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadCsvFile('report.csv', 'header1,header2\nval1,val2');

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});

