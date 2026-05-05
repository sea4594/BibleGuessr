'use client';
import { RoundData } from '@/lib/gameContext';

interface Props {
  round: RoundData;
  roundNumber: number;
  totalRounds: number;
  onNext: () => void;
  onHome: () => void;
  isLastRound: boolean;
}

function StatusBadge({ status }: { status: 'correct' | 'close' | 'wrong' }) {
  const styles = { correct: 'text-green-400', close: 'text-yellow-400', wrong: 'text-red-400' };
  const icons = { correct: '✓', close: '~', wrong: '✗' };
  return <span className={`font-bold ${styles[status]}`}>{icons[status]}</span>;
}

export default function RoundResult({ round, roundNumber, totalRounds, onNext, onHome, isLastRound }: Props) {
  const { verse, guess, score, scoreBreakdown } = round;
  const { feedback } = scoreBreakdown;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm">Round {roundNumber} of {totalRounds}</p>
          <h2 className="text-3xl font-bold text-white mt-1">Result</h2>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-amber-400">{score}</div>
          <div className="text-slate-400 text-sm mt-1">points</div>
        </div>

        {/* Answer comparison */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-2">
            <div className="text-slate-400 text-xs uppercase">Category</div>
            <div className="text-slate-400 text-xs uppercase">Correct</div>
            <div className="text-slate-400 text-xs uppercase">Your Guess</div>
          </div>

          {/* Book row */}
          <div className="grid grid-cols-3 gap-4 text-center py-2 border-t border-slate-700">
            <div className="text-slate-300 text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.book} /> Book
            </div>
            <div className="text-white font-medium text-sm">{verse.book}</div>
            <div className={`text-sm font-medium ${feedback.book === 'correct' ? 'text-green-400' : feedback.book === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.book}
            </div>
          </div>

          {/* Chapter row */}
          <div className="grid grid-cols-3 gap-4 text-center py-2 border-t border-slate-700">
            <div className="text-slate-300 text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.chapter} /> Chapter
            </div>
            <div className="text-white font-medium text-sm">{verse.chapter}</div>
            <div className={`text-sm font-medium ${feedback.chapter === 'correct' ? 'text-green-400' : feedback.chapter === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.chapter}
              {feedback.chaptersOff > 0 && (
                <span className="text-xs ml-1">({feedback.chaptersOff} off)</span>
              )}
            </div>
          </div>

          {/* Verse row */}
          <div className="grid grid-cols-3 gap-4 text-center py-2 border-t border-slate-700">
            <div className="text-slate-300 text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.verse} /> Verse
            </div>
            <div className="text-white font-medium text-sm">{verse.verse}</div>
            <div className={`text-sm font-medium ${feedback.verse === 'correct' ? 'text-green-400' : feedback.verse === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.verse}
              {feedback.versesOff > 0 && (
                <span className="text-xs ml-1">({feedback.versesOff} off)</span>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
          <h3 className="text-slate-400 text-xs uppercase mb-2">Score Breakdown</h3>
          {scoreBreakdown.testamentPoints !== undefined && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-300">Testament</span>
              <span className="text-amber-400">+{scoreBreakdown.testamentPoints}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-300">Book</span>
            <span className="text-amber-400">+{Math.round(scoreBreakdown.bookPoints)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-300">Chapter</span>
            <span className="text-amber-400">+{Math.round(scoreBreakdown.chapterPoints)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-300">Verse</span>
            <span className="text-amber-400">+{Math.round(scoreBreakdown.versePoints)}</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-t border-slate-700 mt-1 font-bold">
            <span className="text-white">Total</span>
            <span className="text-amber-400">{score}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg text-lg mb-3 transition-colors"
        >
          {isLastRound ? 'See Final Score' : 'Next Round →'}
        </button>
        <button
          onClick={onHome}
          className="w-full text-slate-400 hover:text-white py-2 transition-colors"
        >
          Exit to Home
        </button>
      </div>
    </div>
  );
}
