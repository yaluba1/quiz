import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionEditor } from '../../src/components/studio/QuestionEditor';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { Question } from '../../src/types/quiz';

const mockQuestion: Question = {
  orderIndex: 0,
  questionText: 'What is the capital of France?',
  questionType: 'MULTIPLE_CHOICE',
  timeLimitSeconds: 20,
  pointsMultiplier: '1.00',
  showAnswersOnDevice: false,
  answerOptions: [
    { orderIndex: 0, optionText: 'Paris', isCorrect: true, colorShapeIndex: 0 },
    { orderIndex: 1, optionText: 'London', isCorrect: false, colorShapeIndex: 1 },
    { orderIndex: 2, optionText: 'Berlin', isCorrect: false, colorShapeIndex: 2 },
    { orderIndex: 3, optionText: 'Madrid', isCorrect: false, colorShapeIndex: 3 },
  ],
};

describe('QuestionEditor Component Tests', () => {
  it('modifies question text, type, time limit, and options', () => {
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <QuestionEditor question={mockQuestion} questionNumber={1} onChange={onChange} />
      </I18nProvider>
    );

    // Edit text
    const textInput = screen.getByTestId('question-text-input');
    fireEvent.change(textInput, { target: { value: 'Updated Question?' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ questionText: 'Updated Question?' })
    );

    // Switch to True/False
    fireEvent.click(screen.getByTestId('type-true-false'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        questionType: 'TRUE_FALSE',
        answerOptions: expect.arrayContaining([
          expect.objectContaining({ optionText: 'True', isCorrect: true }),
          expect.objectContaining({ optionText: 'False', isCorrect: false }),
        ]),
      })
    );

    // Change time limit
    const timeSelect = screen.getByTestId('time-limit-select');
    fireEvent.change(timeSelect, { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ timeLimitSeconds: 60 })
    );

    // Toggle show on device
    fireEvent.click(screen.getByTestId('show-on-device-toggle'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ showAnswersOnDevice: true })
    );

    // Add option
    fireEvent.click(screen.getByTestId('add-option-button'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        answerOptions: expect.any(Array),
      })
    );
  });
});

