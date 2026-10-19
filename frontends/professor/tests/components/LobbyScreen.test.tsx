import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LobbyScreen } from '../../src/components/host/LobbyScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('LobbyScreen Component Tests', () => {
  it('displays PIN, QR code, joined players, and launches game', () => {
    const onStartGame = vi.fn();
    const players = [
      { playerId: 'p1', nickname: 'Alice' },
      { playerId: 'p2', nickname: 'Bob' },
    ];

    render(
      <I18nProvider>
        <LobbyScreen
          pin="948271"
          sessionTitle="Class 4B Midterm"
          players={players}
          onStartGame={onStartGame}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('game-pin-display')).toHaveTextContent('948271');
    expect(screen.getByTestId('lobby-qr-code')).toBeInTheDocument();
    expect(screen.getByTestId('players-count')).toHaveTextContent('2');
    expect(screen.getByTestId('player-badge-p1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('player-badge-p2')).toHaveTextContent('Bob');

    // Click Start Game
    const startButton = screen.getByTestId('start-game-button');
    fireEvent.click(startButton);
    expect(onStartGame).toHaveBeenCalled();
  });
});

