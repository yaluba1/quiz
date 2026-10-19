import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionList } from '../../src/components/studio/QuestionList';
import { QuizMetadataForm } from '../../src/components/studio/QuizMetadataForm';
import { QuizStudio } from '../../src/components/studio/QuizStudio';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { Question } from '../../src/types/quiz';
import { apiClient } from '../../src/lib/api-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/teacher/en/quizzes/new',
}));

describe('Studio Sub-components Tests', () => {
  it('handles QuestionList navigation and reordering', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    const questions: Question[] = [
      {
        orderIndex: 0,
        questionText: 'First Question',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        pointsMultiplier: '1.00',
        answerOptions: [],
      },
      {
        orderIndex: 1,
        questionText: 'Second Question',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        pointsMultiplier: '1.00',
        answerOptions: [],
      },
    ];

    render(
      <I18nProvider>
        <QuestionList
          questions={questions}
          selectedIndex={0}
          onSelect={onSelect}
          onAdd={onAdd}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </I18nProvider>
    );

    expect(screen.getByText('First Question')).toBeInTheDocument();
    expect(screen.getByText('Second Question')).toBeInTheDocument();

    // Select item 1
    fireEvent.click(screen.getByTestId('question-item-1'));
    expect(onSelect).toHaveBeenCalledWith(1);

    // Click Move Down on item 0
    fireEvent.click(screen.getByTestId('move-down-0'));
    expect(onMoveDown).toHaveBeenCalledWith(0);

    // Click Move Up on item 1
    fireEvent.click(screen.getByTestId('move-up-1'));
    expect(onMoveUp).toHaveBeenCalledWith(1);

    // Click Add
    fireEvent.click(screen.getByTestId('sidebar-add-question'));
    expect(onAdd).toHaveBeenCalled();

    // Click Delete on item 0
    fireEvent.click(screen.getByTestId('delete-question-0'));
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('handles QuizMetadataForm inputs', () => {
    const onChange = vi.fn();
    render(
      <I18nProvider>
        <QuizMetadataForm
          quiz={{ title: 'My Quiz', subject: 'Math', tags: ['algebra'] }}
          themes={[{ name: 'Neon', primaryColor: '#000', secondaryColor: '#fff', backgroundColor: '#fff', fontFamily: 'Inter' }]}
          onChange={onChange}
        />
      </I18nProvider>
    );

    const titleInput = screen.getByTestId('quiz-title-input');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));

    const tagsInput = screen.getByTestId('quiz-tags-input') as HTMLInputElement;
    fireEvent.change(tagsInput, { target: { value: 'algebra, ' } });
    expect(tagsInput.value).toBe('algebra, ');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ['algebra'] }));

    fireEvent.change(tagsInput, { target: { value: 'algebra, linear ' } });
    expect(tagsInput.value).toBe('algebra, linear ');

    fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, ' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ['tag1', 'tag2'] }));

    fireEvent.blur(tagsInput);
    expect(tagsInput.value).toBe('tag1, tag2');

    const timeLimitSelect = screen.getByTestId('quiz-default-time-limit-select');
    fireEvent.change(timeLimitSelect, { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ defaultQuestionTimeLimitSeconds: 30 }));

    const modeSelect = screen.getByTestId('quiz-execution-mode-select');
    fireEvent.change(modeSelect, { target: { value: 'AUTOMATIC' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ defaultExecutionMode: 'AUTOMATIC' }));
  });

  it('handles apply time to all questions in QuizMetadataForm', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();
    render(
      <I18nProvider>
        <QuizMetadataForm
          quiz={{ title: 'My Quiz', defaultQuestionTimeLimitSeconds: 60 }}
          themes={[]}
          onChange={onChange}
          onApplyTimeToAllQuestions={onApply}
        />
      </I18nProvider>
    );

    const applyBtn = screen.getByTestId('apply-time-to-all-button');
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalledWith(60);
  });

  it('renders QuizStudio and validates before save', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'created-quiz-id' });
    const authModule = await import('../../src/hooks/useAuth');
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-1', email: 'prof@school.edu', name: 'Dr. Jane' },
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <QuizStudio isNew={true} />
      </I18nProvider>
    );

    expect(screen.getByTestId('quiz-studio')).toBeInTheDocument();
    expect(screen.getByTestId('quiz-author-badge')).toHaveTextContent('Dr. Jane (prof@school.edu)');

    // Try saving without title
    const saveBtn = screen.getByTestId('save-quiz-button');
    fireEvent.click(saveBtn);
    expect(screen.getByText(/Quiz title is required/i)).toBeInTheDocument();

    // Fill in title
    const titleInput = screen.getByTestId('quiz-title-input');
    fireEvent.change(titleInput, { target: { value: 'Great New Quiz' } });

    // Fill in question text
    const qTextInput = screen.getByTestId('question-text-input');
    fireEvent.change(qTextInput, { target: { value: 'What is water?' } });

    // Fill option texts
    const opt0 = screen.getByTestId('option-text-input-0');
    const opt1 = screen.getByTestId('option-text-input-1');
    const opt2 = screen.getByTestId('option-text-input-2');
    const opt3 = screen.getByTestId('option-text-input-3');
    fireEvent.change(opt0, { target: { value: 'H2O' } });
    fireEvent.change(opt1, { target: { value: 'CO2' } });
    fireEvent.change(opt2, { target: { value: 'NaCl' } });
    fireEvent.change(opt3, { target: { value: 'O2' } });

    expect(screen.getByTestId('quiz-author-badge')).toBeInTheDocument();

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Quiz saved successfully/i)).toBeInTheDocument();
    });
  });

  it('blocks saving and shows warning when professor is not logged in', async () => {
    const authModule = await import('../../src/hooks/useAuth');
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <QuizStudio isNew={true} />
      </I18nProvider>
    );

    expect(screen.getByTestId('quiz-not-logged-in-badge')).toBeInTheDocument();
    const saveBtn = screen.getByTestId('save-quiz-button');
    expect(saveBtn).toBeDisabled();
  });
});

