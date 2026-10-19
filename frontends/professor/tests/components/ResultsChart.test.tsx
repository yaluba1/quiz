import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsChart } from '../../src/components/host/ResultsChart';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { QuestionActivePayload, QuestionResultHostPayload } from '../../src/types/socket';

const mockQuestion: QuestionActivePayload = {
  questionId: 'q-1',
  questionIndex: 0,
  totalQuestions: 1,
  questionText: 'What is 1 + 1?',
  questionType: 'MULTIPLE_CHOICE',
  timeLimitSeconds: 20,
  options: [
    { id: 'opt-1', orderIndex: 0, optionText: '2', colorShapeIndex: 0 },
    { id: 'opt-2', orderIndex: 1, optionText: '3', colorShapeIndex: 1 },
  ],
};

const mockResult: QuestionResultHostPayload = {
  questionId: 'q-1',
  correctOptionId: 'opt-1',
  distribution: { 'opt-1': 15, 'opt-2': 3 },
  answeredCount: 18,
  totalPlayers: 20,
};

describe('ResultsChart Component Tests', () => {
  it('renders answer distribution bars and triggers leaderboard transition', () => {
    const onShowLeaderboard = vi.fn();

    render(
      <I18nProvider>
        <ResultsChart
          question={mockQuestion}
          resultData={mockResult}
          onShowLeaderboard={onShowLeaderboard}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('results-chart')).toBeInTheDocument();
    expect(screen.getByText('What is 1 + 1?')).toBeInTheDocument();
    expect(screen.getByTestId('result-bar-0')).toHaveTextContent('15');
    expect(screen.getByTestId('result-bar-1')).toHaveTextContent('3');
    expect(screen.getByTestId('result-bar-empty')).toHaveTextContent('0');

    // Click show leaderboard
    fireEvent.click(screen.getByTestId('show-leaderboard-button'));
    expect(onShowLeaderboard).toHaveBeenCalled();
  });

  it('renders empty answers count in ResultsChart', () => {
    const onShowLeaderboard = vi.fn();
    const resultWithEmpty: QuestionResultHostPayload = {
      ...mockResult,
      emptyCount: 2,
    };

    render(
      <I18nProvider>
        <ResultsChart
          question={mockQuestion}
          resultData={resultWithEmpty}
          onShowLeaderboard={onShowLeaderboard}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('result-bar-empty')).toHaveTextContent('2');
  });
});

