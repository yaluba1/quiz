import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSummaryCard } from '../../src/components/analytics/SessionSummaryCard';
import { QuestionAnalyticsTable } from '../../src/components/analytics/QuestionAnalyticsTable';
import { ExportToolbar } from '../../src/components/analytics/ExportToolbar';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { GameSessionDetail } from '../../src/types/session';

const mockDetail: GameSessionDetail = {
  session: {
    id: 's-1',
    title: 'Midterm 4B',
    classGroup: 'Class 4B',
    pin: '998877',
    status: 'FINISHED',
    totalParticipants: 25,
    startedAt: '2026-10-08T10:00:00Z',
    endedAt: '2026-10-08T10:45:00Z',
    averageScore: 4200,
    averageResponseTimeMs: 4000,
    overallAccuracyPercentage: 75,
  },
  questions: [
    {
      questionId: 'q-1',
      questionText: 'What is H2O?',
      totalAnswers: 25,
      correctCount: 20,
      wrongCount: 5,
      correctPercentage: 80,
      averageResponseTimeMs: 3200,
      optionDistribution: { opt1: 20, opt2: 5 },
    },
  ],
};

describe('Analytics Components Tests', () => {
  it('renders SessionSummaryCard metrics correctly', () => {
    render(
      <I18nProvider>
        <SessionSummaryCard session={mockDetail.session} />
      </I18nProvider>
    );

    expect(screen.getByTestId('session-summary-card')).toBeInTheDocument();
    expect(screen.getByText('Midterm 4B')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('4200')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders QuestionAnalyticsTable rows', () => {
    render(
      <I18nProvider>
        <QuestionAnalyticsTable questions={mockDetail.questions} />
      </I18nProvider>
    );

    expect(screen.getByTestId('question-analytics-table')).toBeInTheDocument();
    expect(screen.getByText('What is H2O?')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByTestId('empty-count-0')).toHaveTextContent('0');
  });

  it('renders QuestionAnalyticsTable with empty or undefined questions safely', () => {
    const { rerender } = render(
      <I18nProvider>
        <QuestionAnalyticsTable questions={[]} />
      </I18nProvider>
    );

    expect(screen.getByTestId('question-analytics-table')).toBeInTheDocument();
    expect(screen.getByText('No question breakdown available')).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <QuestionAnalyticsTable questions={undefined as any} />
      </I18nProvider>
    );
    expect(screen.getByText('No question breakdown available')).toBeInTheDocument();
  });

  it('triggers CSV download and window print in ExportToolbar even if questions is undefined', () => {
    const detailWithoutQuestions = {
      ...mockDetail,
      questions: undefined as any,
    };

    render(
      <I18nProvider>
        <ExportToolbar detail={detailWithoutQuestions} />
      </I18nProvider>
    );

    expect(screen.getByTestId('export-toolbar')).toBeInTheDocument();

    const csvBtn = screen.getByTestId('export-csv-button');
    fireEvent.click(csvBtn);

    const printBtn = screen.getByTestId('print-report-button');
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();
  });
});

