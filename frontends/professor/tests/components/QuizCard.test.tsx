import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizCard } from '../../src/components/library/QuizCard';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { Quiz } from '../../src/types/quiz';

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Genetics 101',
  description: 'Introductory biology quiz',
  subject: 'Biology',
  level: 'Grade 10',
  folder: 'Term 1 / Genetics',
  tags: ['dna', 'rna'],
  playCount: 12,
  createdAt: '2026-10-08T00:00:00Z',
  updatedAt: '2026-10-08T12:00:00Z',
};

describe('QuizCard Component Tests', () => {
  it('renders quiz details, badges, and triggers action callbacks', () => {
    const onHost = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();

    render(
      <I18nProvider>
        <QuizCard
          quiz={mockQuiz}
          onHost={onHost}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Genetics 101')).toBeInTheDocument();
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('Grade 10')).toBeInTheDocument();
    expect(screen.getByText('Term 1 / Genetics')).toBeInTheDocument();
    expect(screen.getByText('dna')).toBeInTheDocument();
    expect(screen.getByText('rna')).toBeInTheDocument();

    // Click Host
    fireEvent.click(screen.getByTestId('host-button-quiz-1'));
    expect(onHost).toHaveBeenCalledWith(mockQuiz);

    // Click Duplicate
    fireEvent.click(screen.getByTestId('duplicate-button-quiz-1'));
    expect(onDuplicate).toHaveBeenCalledWith('quiz-1');

    // Click Delete
    fireEvent.click(screen.getByTestId('delete-button-quiz-1'));
    expect(onDelete).toHaveBeenCalledWith('quiz-1');
  });
});
