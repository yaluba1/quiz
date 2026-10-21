import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderTree } from '../../src/components/library/FolderTree';
import { LevelSelector } from '../../src/components/library/LevelSelector';
import { SubjectSelector } from '../../src/components/library/SubjectSelector';
import { TagFilterBar } from '../../src/components/library/TagFilterBar';
import { HostSessionModal } from '../../src/components/library/HostSessionModal';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { Quiz } from '../../src/types/quiz';

describe('Library Sub-components Tests', () => {
  it('handles FolderTree selection and clearing', () => {
    const onSelect = vi.fn();
    render(
      <FolderTree
        folders={['Term 1', 'Term 2']}
        selectedFolder="Term 1"
        onSelectFolder={onSelect}
      />
    );

    expect(screen.getByText('Term 1')).toBeInTheDocument();
    expect(screen.getByText('Term 2')).toBeInTheDocument();

    // Select Term 2
    fireEvent.click(screen.getByTestId('folder-Term 2'));
    expect(onSelect).toHaveBeenCalledWith('Term 2');

    // Click Clear
    fireEvent.click(screen.getByText('Clear'));
    expect(onSelect).toHaveBeenCalledWith(null);

    // Click All
    fireEvent.click(screen.getByTestId('folder-all'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('handles LevelSelector changes', () => {
    const onSelect = vi.fn();
    render(
      <LevelSelector
        levels={['Grade 10', 'Grade 11']}
        selectedLevel={null}
        onSelectLevel={onSelect}
      />
    );

    const select = screen.getByTestId('level-selector');
    fireEvent.change(select, { target: { value: 'Grade 10' } });
    expect(onSelect).toHaveBeenCalledWith('Grade 10');
  });

  it('handles SubjectSelector changes', () => {
    const onSelect = vi.fn();
    render(
      <SubjectSelector
        subjects={['Math', 'History']}
        selectedSubject={null}
        onSelectSubject={onSelect}
      />
    );

    const select = screen.getByTestId('subject-selector');
    fireEvent.change(select, { target: { value: 'Math' } });
    expect(onSelect).toHaveBeenCalledWith('Math');
  });

  it('handles TagFilterBar chip clicks and clearing', () => {
    const onSelect = vi.fn();
    render(
      <TagFilterBar
        tags={['dna', 'genetics']}
        selectedTag="dna"
        onSelectTag={onSelect}
      />
    );

    expect(screen.getByTestId('active-tag-chip')).toHaveTextContent('dna');

    // Deselect active tag
    fireEvent.click(screen.getByTestId('active-tag-chip'));
    expect(onSelect).toHaveBeenCalledWith(null);

    // Select other tag
    fireEvent.click(screen.getByTestId('tag-chip-genetics'));
    expect(onSelect).toHaveBeenCalledWith('genetics');
  });

  it('handles HostSessionModal launching and closing', () => {
    const onLaunch = vi.fn();
    const onClose = vi.fn();
    const mockQuiz: Quiz = {
      id: 'quiz-1',
      title: 'Science Quiz',
    };

    render(
      <I18nProvider>
        <HostSessionModal
          quiz={mockQuiz}
          isOpen={true}
          onClose={onClose}
          onLaunch={onLaunch}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('host-session-modal')).toBeInTheDocument();
    expect(screen.getByText('Science Quiz')).toBeInTheDocument();

    const titleInput = screen.getByTestId('session-name-input');
    const classInput = screen.getByTestId('class-cohort-input');
    const durInput = screen.getByTestId('duration-input');

    fireEvent.change(titleInput, { target: { value: 'Class 4B Exam' } });
    fireEvent.change(classInput, { target: { value: '4B' } });
    fireEvent.change(durInput, { target: { value: '' } });
    expect(durInput).toHaveValue(null);
    fireEvent.change(durInput, { target: { value: '45' } });

    fireEvent.click(screen.getByTestId('launch-session-button'));
    expect(onLaunch).toHaveBeenCalledWith({
      quizId: 'quiz-1',
      title: 'Class 4B Exam',
      classGroup: '4B',
      durationMinutes: 45,
      executionMode: 'MANUAL',
    });
  });

  it('handles HostSessionModal execution mode selection', () => {
    const onLaunch = vi.fn();
    const onClose = vi.fn();
    const mockQuiz: Quiz = {
      id: 'quiz-auto',
      title: 'Auto Quiz',
      defaultExecutionMode: 'AUTOMATIC',
    };

    render(
      <I18nProvider>
        <HostSessionModal
          quiz={mockQuiz}
          isOpen={true}
          onClose={onClose}
          onLaunch={onLaunch}
        />
      </I18nProvider>
    );

    fireEvent.click(screen.getByTestId('mode-manual-btn'));
    fireEvent.click(screen.getByTestId('mode-automatic-btn'));
    fireEvent.click(screen.getByTestId('launch-session-button'));

    expect(onLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        executionMode: 'AUTOMATIC',
      })
    );
  });
});

