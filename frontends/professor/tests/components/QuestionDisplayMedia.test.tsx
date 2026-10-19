import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionDisplay } from '../../src/components/host/QuestionDisplay';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { QuestionActivePayload } from '../../src/types/socket';

describe('QuestionDisplay Multimedia Rendering', () => {
  const baseQuestion: QuestionActivePayload = {
    questionId: 'q-1',
    questionIndex: 0,
    totalQuestions: 5,
    questionText: 'Identify this European Flag',
    questionType: 'MULTIPLE_CHOICE',
    timeLimitSeconds: 20,
    options: [
      { id: 'opt-1', orderIndex: 0, optionText: 'France', colorShapeIndex: 0 },
      { id: 'opt-2', orderIndex: 1, optionText: 'Italy', colorShapeIndex: 1 },
    ],
  };

  it('renders image when mediaType is IMAGE', () => {
    const question: QuestionActivePayload = {
      ...baseQuestion,
      mediaUrl: 'https://quiz.example.com/media/questions/flag.webp',
      mediaType: 'IMAGE',
    };

    render(
      <I18nProvider>
        <QuestionDisplay question={question} answeredCount={0} totalPlayers={10} />
      </I18nProvider>
    );

    expect(screen.getByTestId('host-media-image')).toBeDefined();
    expect(screen.getByTestId('host-image-element').getAttribute('src')).toBe(
      'https://quiz.example.com/media/questions/flag.webp'
    );
  });

  it('renders audio player and animated badge when mediaType is AUDIO', () => {
    const question: QuestionActivePayload = {
      ...baseQuestion,
      questionText: 'Name this Anthem',
      mediaUrl: 'https://quiz.example.com/media/questions/anthem.mp3',
      mediaType: 'AUDIO',
    };

    render(
      <I18nProvider>
        <QuestionDisplay question={question} answeredCount={0} totalPlayers={10} />
      </I18nProvider>
    );

    expect(screen.getByTestId('host-media-audio')).toBeDefined();
    expect(screen.getByTestId('host-audio-player').getAttribute('src')).toBe(
      'https://quiz.example.com/media/questions/anthem.mp3'
    );
  });

  it('renders video player when mediaType is VIDEO', () => {
    const question: QuestionActivePayload = {
      ...baseQuestion,
      questionText: 'What reaction is occurring in this video?',
      mediaUrl: 'https://quiz.example.com/media/questions/clip.mp4',
      mediaType: 'VIDEO',
    };

    render(
      <I18nProvider>
        <QuestionDisplay question={question} answeredCount={0} totalPlayers={10} />
      </I18nProvider>
    );

    expect(screen.getByTestId('host-media-video')).toBeDefined();
    expect(screen.getByTestId('host-video-player').getAttribute('src')).toBe(
      'https://quiz.example.com/media/questions/clip.mp4'
    );
  });
});

