import React, { useCallback, useEffect, useMemo, useState } from 'react';

type OnboardingStep = {
  title: string;
  body: React.ReactNode;
};

export function OnboardingModal(props: {
  open: boolean;
  onComplete: () => void;
}): React.JSX.Element | null {
  const { open, onComplete } = props;
  const [stepIndex, setStepIndex] = useState(0);

  // ESC key handler
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        title: 'Welcome to Aetherius',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">
              You are about to run a character-driven Skyrim roleplay campaign. This short tutorial shows the core loop.
            </p>
            <div className="p-3 bg-black/30 border border-skyrim-border rounded">
              <p className="text-gray-300 text-sm font-sans">
                Tip: You can skip anytime. The tutorial wonâ€™t show again after you finish or skip.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Create Your Hero',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">
              Start by creating your first character.
            </p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li>Create a character (race, archetype, identity, stats, etc.).</li>
              <li>Select a character to enter the main game UI.</li>
            </ul>
            <div className="p-3 bg-blue-900/20 border border-blue-600/40 rounded mt-3">
              <p className="text-blue-200 text-sm font-sans font-semibold mb-2">
                Multiple ways to create characters:
              </p>
              <ul className="text-blue-200 text-xs font-sans list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Scribe Chat</span>: Use AI to help design your character through conversation.</li>
                <li><span className="font-semibold">Manual</span>: Fill out all fields yourself for full control.</li>
                <li><span className="font-semibold">Full Random</span>: Generate a complete character with background instantly.</li>
                <li><span className="font-semibold">Import Text</span>: Paste character information to auto-fill details.</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        title: 'Tabs: What Each One Does',
        body: (
          <div className="space-y-3">
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li><span className="text-gray-200 font-semibold">Hero</span>: character sheet and progression.</li>
              <li><span className="text-gray-200 font-semibold">Equipment</span>: inventory and equipment.</li>
              <li><span className="text-gray-200 font-semibold">Quests</span>: quests and objectives.</li>
              <li><span className="text-gray-200 font-semibold">Story</span>: chapters and notes (long-term narrative).</li>
              <li><span className="text-gray-200 font-semibold">Journal</span>: first-person log entries.</li>
              <li><span className="text-gray-200 font-semibold">Adventure</span>: the AI-driven tabletop-style play loop.</li>
            </ul>
            <div className="p-3 bg-black/30 border border-skyrim-border rounded">
              <p className="text-gray-300 text-sm font-sans">
                Most gameplay happens in <span className="text-gray-200 font-semibold">Adventure</span>. The rest are your tools.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Adventure: The Core Loop',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">
              In Adventure, you speak as your character. The GM replies and may propose clickable choices.
            </p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li>Type what you do or say (â€œI knock and ask about the missing caravanâ€¦â€).</li>
              <li>Use choice buttons if the GM offers them.</li>
              <li>Game updates (items/quests/story/time/needs) are applied via the same update pipeline.</li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Time & Survival',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">
              Time can advance and your needs change (hunger, thirst, fatigue).
            </p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li><span className="text-gray-200 font-semibold">Rest</span> reduces fatigue and advances time.</li>
              <li><span className="text-gray-200 font-semibold">Eat/Drink</span> lowers hunger/thirst and consumes a matching item if possible.</li>
              <li>You can see time and needs on the Hero tab.</li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Saving',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">
              Your data is stored under your account. Most changes auto-save; you can also use manual save.
            </p>
            <div className="p-3 bg-black/30 border border-skyrim-border rounded">
              <p className="text-gray-300 text-sm font-sans">
                Youâ€™re ready. Create your first hero, then begin in Adventure.
              </p>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  if (!open) return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      onClick={(e) => { if (e.target === e.currentTarget) onComplete(); }}
    >
      <div className="w-full max-w-2xl bg-black/50 border border-skyrim-border rounded-lg shadow-2xl">
        <div className="p-5 sm:p-6 border-b border-skyrim-border flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-skyrim-text font-sans">Tutorial</div>
            <h2 className="text-lg sm:text-xl font-serif text-skyrim-gold">{step.title}</h2>
            <div className="mt-1 text-xs text-skyrim-text font-sans">
              Step {stepIndex + 1} of {steps.length}
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="px-3 py-1 bg-black/30 text-gray-200 border border-skyrim-border rounded hover:bg-black/40 text-sm"
          >
            Skip
          </button>
        </div>

        <div className="p-5 sm:p-6">{step.body}</div>

        <div className="p-5 sm:p-6 border-t border-skyrim-border flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2 bg-black/30 text-gray-200 border border-skyrim-border rounded hover:bg-black/40 disabled:opacity-40 disabled:hover:bg-black/30"
          >
            Back
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded hover:bg-skyrim-goldHover"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded hover:bg-skyrim-goldHover"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

