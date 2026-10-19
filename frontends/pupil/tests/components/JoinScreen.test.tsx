import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinScreen } from '../../src/components/game/JoinScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('JoinScreen component', () => {
  it('renders 6 PIN digit boxes and nickname input', () => {
    render(
      <I18nProvider>
        <JoinScreen isConnecting={false} errorMessage={null} onJoin={vi.fn()} />
      </I18nProvider>
    );

    expect(screen.getByLabelText('Digit 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Digit 6')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., Alex, Maya/i)).toBeInTheDocument();
  });

  it('validates PIN length and triggers onJoin when valid', () => {
    const handleJoin = vi.fn();
    render(
      <I18nProvider>
        <JoinScreen initialPin="123456" isConnecting={false} errorMessage={null} onJoin={handleJoin} />
      </I18nProvider>
    );

    const nickInput = screen.getByPlaceholderText(/e\.g\., Alex, Maya/i);
    fireEvent.change(nickInput, { target: { value: 'Alex' } });

    const submitBtn = screen.getByRole('button', { name: /Join Quiz/i });
    fireEvent.click(submitBtn);

    expect(handleJoin).toHaveBeenCalledWith('123456', 'Alex');
  });

  it('blocks profane nickname input', () => {
    const handleJoin = vi.fn();
    render(
      <I18nProvider>
        <JoinScreen initialPin="123456" isConnecting={false} errorMessage={null} onJoin={handleJoin} />
      </I18nProvider>
    );

    const nickInput = screen.getByPlaceholderText(/e\.g\., Alex, Maya/i);
    fireEvent.change(nickInput, { target: { value: 'bad_fuck_name' } });

    const submitBtn = screen.getByRole('button', { name: /Join Quiz/i });
    fireEvent.click(submitBtn);

    expect(handleJoin).not.toHaveBeenCalled();
    expect(screen.getByText(/Please choose an appropriate nickname/i)).toBeInTheDocument();
  });

  it('handles paste of full PIN and backspace navigation', () => {
    render(
      <I18nProvider>
        <JoinScreen isConnecting={false} errorMessage={null} onJoin={vi.fn()} />
      </I18nProvider>
    );

    const firstInput = screen.getByLabelText('Digit 1');
    fireEvent.paste(firstInput, {
      clipboardData: { getData: () => '654321' },
    });

    expect(screen.getByLabelText('Digit 6')).toHaveValue('1');

    const secondInput = screen.getByLabelText('Digit 2');
    fireEvent.keyDown(secondInput, { key: 'Backspace' });
  });

  it('validates empty nickname', () => {
    render(
      <I18nProvider>
        <JoinScreen initialPin="123456" isConnecting={false} errorMessage={null} onJoin={vi.fn()} />
      </I18nProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Join Quiz/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Nickname must be between 1 and 50 characters/i)).toBeInTheDocument();
  });
});
