import { useEffect } from 'react';
import { diffWords } from 'diff';

interface DiffReviewProps {
  instruction: string;
  before: string;
  after: string;
  onAccept: () => void;
  onDiscard: () => void;
}

export function DiffReview({ instruction, before, after, onAccept, onDiscard }: DiffReviewProps) {
  // Enter accepts, Esc discards, matching the spec's keyboard contract for the review panel.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onAccept();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onDiscard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAccept, onDiscard]);

  const parts = diffWords(before, after);

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-3">&ldquo;{instruction}&rdquo;</p>
      <div className="text-base leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) =>
          part.added ? (
            <span key={i} className="bg-green-500/15">
              {part.value}
            </span>
          ) : part.removed ? (
            <span key={i} className="line-through text-muted-foreground bg-red-500/10">
              {part.value}
            </span>
          ) : (
            <span key={i}>{part.value}</span>
          ),
        )}
      </div>
    </div>
  );
}
