'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameModeConfig } from './gameModes';
import { ScoreBreakdown } from './scoring';

export interface RoundData {
  verse: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
  };
  guess: {
    book: string;
    chapter: number;
    verse: number;
  };
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface GameSession {
  mode: string;
  modeConfig: GameModeConfig;
  totalRounds: number;
  currentRound: number;
  rounds: RoundData[];
  selectedBook?: string;
  gameState: 'setup' | 'playing' | 'result' | 'summary';
}

interface GameContextType {
  session: GameSession | null;
  startGame: (config: Omit<GameSession, 'rounds' | 'currentRound' | 'gameState'>) => void;
  submitGuess: (
    guess: RoundData['guess'],
    verse: RoundData['verse'],
    score: number,
    breakdown: ScoreBreakdown
  ) => void;
  nextRound: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);

  const startGame = (config: Omit<GameSession, 'rounds' | 'currentRound' | 'gameState'>) => {
    setSession({
      ...config,
      rounds: [],
      currentRound: 1,
      gameState: 'playing',
    });
  };

  const submitGuess = (
    guess: RoundData['guess'],
    verse: RoundData['verse'],
    score: number,
    breakdown: ScoreBreakdown
  ) => {
    setSession(prev => {
      if (!prev) return null;
      const newRound: RoundData = { verse, guess, score, scoreBreakdown: breakdown };
      return { ...prev, rounds: [...prev.rounds, newRound], gameState: 'result' };
    });
  };

  const nextRound = () => {
    setSession(prev => {
      if (!prev) return null;
      const nextRoundNum = prev.currentRound + 1;
      if (nextRoundNum > prev.totalRounds) {
        return { ...prev, gameState: 'summary' };
      }
      return { ...prev, currentRound: nextRoundNum, gameState: 'playing' };
    });
  };

  const resetGame = () => setSession(null);

  return (
    <GameContext.Provider value={{ session, startGame, submitGuess, nextRound, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
