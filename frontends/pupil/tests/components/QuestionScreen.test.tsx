import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionScreen } from '../../src/components/game/QuestionScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

const mockQuestion = {
  questionId: 'q-100',
  questionIndex: 2,
  totalQuestions: 10,
  questionText: 'What is the speed of light?',
  questionType: 'SINGLE_CHOICE',
  timeLimitSeconds: 30,
  showAnswersOnDevice: true,
  options: [
    { id: 'opt-a', orderIndex: 0, optionText: '300,000 km/s', colorShapeIndex: 0 },
    { id: 'opt-b', orderIndex: 1, optionText: '150,000 km/s', colorShapeIndex: 1 },
    { id: 'opt-c', orderIndex: 2, optionText: '400,000 km/s', colorShapeIndex: 2 },
    { id: 'opt-d', orderIndex: 3, optionText: 'None of the above', colorShapeIndex: 3 },
  ],
};

describe('QuestionScreen component', () => {
  it('renders question header, text, and 4 answer choices', () => {
    render(
      <I18nProvider>
        <QuestionScreen
          question={mockQuestion}
          selectedOptionId={null}
          isAnswerSubmitted={false}
          onSelectOption={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Question 3 of 10/i)).toBeInTheDocument();
    expect(screen.getByText('What is the speed of light?')).toBeInTheDocument();
    expect(screen.getByText('300,000 km/s')).toBeInTheDocument();
  });

  it('triggers onSelectOption when an option is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <I18nProvider>
        <QuestionScreen
          question={mockQuestion}
          selectedOptionId={null}
          isAnswerSubmitted={false}
          onSelectOption={handleSelect}
        />
      </I18nProvider>
    );

    const firstOption = screen.getByRole('button', { name: /300,000 km\/s/i });
    fireEvent.click(firstOption);
    expect(handleSelect).toHaveBeenCalledWith('opt-a');
  });

  it('displays lock-in status when an answer has been submitted', () => {
    render(
      <I18nProvider>
        <QuestionScreen
          question={mockQuestion}
          selectedOptionId="opt-a"
          isAnswerSubmitted={true}
          onSelectOption={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/Answer Locked In!/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for time to expire\.\.\./i)).toBeInTheDocument();
  });

  it('renders media image when mediaUrl is present', () => {
    render(
      <I18nProvider>
        <QuestionScreen
          question={{
            ...mockQuestion,
            mediaUrl: 'https://example.com/diagram.png',
          }}
          selectedOptionId={null}
          isAnswerSubmitted={false}
          onSelectOption={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByAltText('Question visual')).toBeInTheDocument();
  });

  it('renders audio player when mediaType is AUDIO', () => {
    render(
      <I18nProvider>
        <QuestionScreen
          question={{
            ...mockQuestion,
            mediaUrl: 'https://example.com/audio.mp3',
            mediaType: 'AUDIO',
          }}
          selectedOptionId={null}
          isAnswerSubmitted={false}
          onSelectOption={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('pupil-media-audio')).toBeInTheDocument();
    expect(screen.getByTestId('pupil-audio-player')).toBeInTheDocument();
  });

  it('renders video player when mediaType is VIDEO', () => {
    render(
      <I18nProvider>
        <QuestionScreen
          question={{
            ...mockQuestion,
            mediaUrl: 'https://example.com/video.mp4',
            mediaType: 'VIDEO',
          }}
          selectedOptionId={null}
          isAnswerSubmitted={false}
          onSelectOption={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('pupil-media-video')).toBeInTheDocument();
    expect(screen.getByTestId('pupil-video-player')).toBeInTheDocument();
  });
});
