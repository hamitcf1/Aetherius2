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
              You are about to run a character-driven Skyrim roleplay campaign. This short tutorial shows the core loop and features.
            </p>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-sm font-sans">
                Tip: You can skip anytime with ESC or by clicking outside. The tutorial won't show again after you finish or skip.
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
              Start by creating your first character with rich backstory and personality.
            </p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li>Choose race, archetype, identity, and starting stats.</li>
              <li>Define psychology, motivations, and relationships.</li>
              <li>Select a character from your roster to begin playing.</li>
            </ul>
            <div className="p-3 bg-blue-900/20 border border-blue-600/40 rounded mt-3">
              <p className="text-blue-200 text-sm font-sans font-semibold mb-2">
                Multiple ways to create characters:
              </p>
              <ul className="text-blue-200 text-xs font-sans list-disc pl-5 space-y-1">
                <li><span className="font-semibold">AI Scribe</span>: Chat with AI to design your character collaboratively.</li>
                <li><span className="font-semibold">Manual</span>: Fill out all fields yourself for full control.</li>
                <li><span className="font-semibold">Full Random</span>: Generate a complete character with background instantly.</li>
                <li><span className="font-semibold">Import Text</span>: Paste character information to auto-fill details.</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        title: 'Tabs Overview',
        body: (
          <div className="space-y-3">
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li><span className="text-skyrim-gold font-semibold">Hero</span>: Character sheet, stats, identity, and progression.</li>
              <li><span className="text-skyrim-gold font-semibold">Equipment</span>: Inventory management and equipment.</li>
              <li><span className="text-skyrim-gold font-semibold">Quests</span>: Active quests, objectives, and completion tracking.</li>
              <li><span className="text-skyrim-gold font-semibold">Story</span>: Chapters and narrative notes (long-term story).</li>
              <li><span className="text-skyrim-gold font-semibold">Journal</span>: First-person diary entries from your character's view.</li>
              <li><span className="text-skyrim-gold font-semibold">Adventure</span>: The AI Game Master â€“ your main gameplay tab.</li>
            </ul>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-sm font-sans">
                Most gameplay happens in <span className="text-skyrim-gold font-semibold">Adventure</span>. Other tabs are your management tools.
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
              In Adventure, you speak as your character and the AI Game Master responds with immersive narration.
            </p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li>Type what you do or say: <span className="text-skyrim-text italic">"I approach the merchant and ask about rumors..."</span></li>
              <li>Click choice buttons when the GM offers dialogue options.</li>
              <li><span className="text-skyrim-gold">Hover over choices</span> to preview what your character will say.</li>
              <li>Game updates (items, gold, quests, time) apply automatically.</li>
            </ul>
            <div className="p-3 bg-amber-900/20 border border-amber-600/40 rounded mt-2">
              <p className="text-amber-200 text-xs font-sans">
                <span className="font-semibold">Tip:</span> Choices may show gold costs. The transaction only happens when you select the option, not when viewing it.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Time & Survival',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">Time advances as you play. Your character has needs.</p>
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li><span className="text-red-400 font-semibold">Hunger</span>: Eat food items.</li>
              <li><span className="text-blue-400 font-semibold">Thirst</span>: Drink beverages.</li>
              <li><span className="text-purple-400 font-semibold">Fatigue</span>: Rest to recover.</li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Shop & Economy',
        body: (
          <div className="space-y-3">
            <ul className="text-gray-300 text-sm font-sans list-disc pl-5 space-y-1">
              <li>Visit Shop from Actions menu to buy/sell items.</li>
              <li>Item availability scales with your character level.</li>
            </ul>
          </div>
        ),
      },
      {
        title: 'Ready to Begin',
        body: (
          <div className="space-y-3">
            <p className="text-gray-200 font-sans leading-relaxed">Create your first hero and begin your adventure!</p>
            <div className="p-3 bg-skyrim-gold/20 border border-skyrim-gold/40 rounded">
              <p className="text-skyrim-gold text-sm font-sans text-center italic">May the Divines guide your path, Dragonborn.</p>
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
      className="fixed inset-0 z-[60] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      onClick={(e) => { if (e.target === e.currentTarget) onComplete(); }}
    >
      <div className="w-full max-w-2xl bg-skyrim-paper/50 border border-skyrim-border rounded-lg shadow-2xl">
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
            className="px-3 py-1 bg-skyrim-paper/30 text-skyrim-text border border-skyrim-border rounded hover:bg-skyrim-paper/40 text-sm"
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
            className="px-4 py-2 bg-skyrim-paper/30 text-skyrim-text border border-skyrim-border rounded hover:bg-skyrim-paper/40 disabled:opacity-40 disabled:hover:bg-skyrim-paper/30"
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

