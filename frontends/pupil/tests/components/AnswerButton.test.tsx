import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnswerButton } from '../../src/components/game/AnswerButton';

describe('AnswerButton component', () => {
  it('renders answer button with geometric shape and handles click', () => {
    const handleClick = vi.fn();
    render(
      <AnswerButton
        id="opt-1"
        colorShapeIndex={0}
        optionText="Option Text"
        onClick={handleClick}
      />
    );

    const btn = screen.getByRole('button', { name: /Triangle: Option Text/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('min-h-[72px]');

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledWith('opt-1');
  });

  it('disables click and dims when locked and unselected', () => {
    const handleClick = vi.fn();
    render(
      <AnswerButton
        id="opt-2"
        colorShapeIndex={1}
        optionText="Option 2"
        isLocked={true}
        isSelected={false}
        onClick={handleClick}
      />
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('opacity-30');

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('highlights when locked and selected', () => {
    render(
      <AnswerButton
        id="opt-3"
        colorShapeIndex={2}
        optionText="Option 3"
        isLocked={true}
        isSelected={true}
        onClick={vi.fn()}
      />
    );

    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('ring-4');
  });
});

