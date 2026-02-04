import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sword, Shield, Heart, Sparkles, Package, Map, Users, Settings, MessageSquare, ShoppingBag, Sun, Flame, Snowflake, Volume2, HelpCircle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

type OnboardingStep = {
  title: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
};

export function OnboardingModal(props: {
  open: boolean;
  onComplete: () => void;
}): React.JSX.Element | null {
  const { open, onComplete } = props;
  const [stepIndex, setStepIndex] = useState(0);


  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        title: 'Welcome to Aetherius',
        icon: <Sparkles className="text-skyrim-gold" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed text-base">
              Welcome, adventurer! <span className="text-skyrim-gold font-semibold">Aetherius</span> is an AI-powered
              Skyrim roleplay experience where <span className="italic">you</span> are the hero of your own story.
            </p>
            <div className="p-4 bg-gradient-to-r from-skyrim-gold/10 to-transparent border-l-4 border-skyrim-gold rounded-r">
              <p className="text-skyrim-text text-sm font-sans">
                <span className="font-bold text-skyrim-gold">What is this?</span> This is a text-based RPG where an AI Game Master
                narrates your adventures in the world of Skyrim. You type what your character does, and the AI responds
                with immersive storytelling.
              </p>
            </div>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-sm font-sans">
                💡 <strong>Tip:</strong> You can skip this tutorial anytime with ESC or clicking outside.
                Access it again from the Settings menu.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Creating Your Character',
        icon: <Users className="text-skyrim-gold" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              Your adventure begins with creating a unique character. You have several options:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-900/20 border border-blue-600/40 rounded">
                <p className="text-blue-200 text-sm font-sans">
                  <span className="font-bold">🤖 AI Scribe</span><br />
                  Chat with AI to design your character collaboratively. Describe your vision and it will help create the details.
                </p>
              </div>
              <div className="p-3 bg-green-900/20 border border-green-600/40 rounded">
                <p className="text-green-200 text-sm font-sans">
                  <span className="font-bold">✏️ Quick Create</span><br />
                  Enter a name, choose race/class, and start immediately. Perfect for quick starts.
                </p>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-600/40 rounded">
                <p className="text-purple-200 text-sm font-sans">
                  <span className="font-bold">🎲 Full Random</span><br />
                  Let the AI generate a complete character with backstory, personality, and stats.
                </p>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-600/40 rounded">
                <p className="text-amber-200 text-sm font-sans">
                  <span className="font-bold">📄 Import Text</span><br />
                  Paste existing character info and the AI will parse it into your character sheet.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'The Main Interface',
        icon: <Map className="text-skyrim-gold" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              Once you select a character, you'll see the main game interface with these tabs:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Adventure</span>
                <span className="text-gray-300">Your main gameplay area. Chat with the AI Game Master here.</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Hero</span>
                <span className="text-gray-300">Character sheet with stats, skills, perks, and backstory.</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Equipment</span>
                <span className="text-gray-300">Manage your inventory, equip weapons and armor.</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Quests</span>
                <span className="text-gray-300">Track active quests, objectives, and completed missions.</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Journal</span>
                <span className="text-gray-300">Write diary entries from your character's perspective.</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-skyrim-paper/20 rounded">
                <span className="text-skyrim-gold font-bold w-24">Story</span>
                <span className="text-gray-300">Long-term narrative chapters and major story beats.</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Playing the Adventure',
        icon: <MessageSquare className="text-skyrim-gold" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              The <span className="text-skyrim-gold font-semibold">Adventure</span> tab is where the magic happens.
              Here's how to play:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans mb-2">
                  <span className="font-bold text-skyrim-gold">1. Type your actions</span>
                </p>
                <p className="text-gray-400 text-xs italic">
                  "I approach the old merchant and ask about rumors in town..."
                </p>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans mb-2">
                  <span className="font-bold text-skyrim-gold">2. The AI responds</span>
                </p>
                <p className="text-gray-400 text-xs">
                  The Game Master will narrate what happens, describe NPCs, and present choices.
                </p>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans mb-2">
                  <span className="font-bold text-skyrim-gold">3. Click choice buttons</span>
                </p>
                <p className="text-gray-400 text-xs">
                  When presented with options, click buttons or type your own response.
                  <span className="text-amber-300"> Hover over choices to preview what you'll say.</span>
                </p>
              </div>
            </div>
            <div className="p-3 bg-amber-900/20 border border-amber-600/40 rounded">
              <p className="text-amber-200 text-xs font-sans">
                <strong>💰 Important:</strong> Some choices may cost gold. The transaction only happens
                when you select the option, not when previewing.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Combat System',
        icon: <Sword className="text-red-400" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              When enemies appear, combat begins automatically. Here's what you need to know:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-red-900/20 border border-red-600/40 rounded">
                <p className="text-red-200 text-sm font-sans">
                  <span className="font-bold flex items-center gap-1"><Sword size={14} /> Attack</span>
                  Use weapons to deal damage. Damage scales with weapon stats and your skills.
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-600/40 rounded">
                <p className="text-blue-200 text-sm font-sans">
                  <span className="font-bold flex items-center gap-1"><Shield size={14} /> Defend</span>
                  Block incoming attacks. Reduces damage taken and may stagger enemies.
                </p>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-600/40 rounded">
                <p className="text-purple-200 text-sm font-sans">
                  <span className="font-bold flex items-center gap-1"><Sparkles size={14} /> Magic</span>
                  Cast spells using magicka. Unlock more spells as you progress.
                </p>
              </div>
              <div className="p-3 bg-green-900/20 border border-green-600/40 rounded">
                <p className="text-green-200 text-sm font-sans">
                  <span className="font-bold flex items-center gap-1"><Package size={14} /> Items</span>
                  Use potions and consumables during combat for healing or buffs.
                </p>
              </div>
            </div>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-xs font-sans">
                <strong>Companions:</strong> Recruit allies who fight alongside you. Manage them from the Companions menu.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Survival & Needs',
        icon: <Heart className="text-red-400" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              Your character has basic needs that affect gameplay:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-600/40 rounded">
                <span className="text-2xl">🍖</span>
                <div>
                  <p className="text-red-200 font-bold text-sm">Hunger</p>
                  <p className="text-gray-400 text-xs">Eat food from your inventory or buy at shops.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-600/40 rounded">
                <span className="text-2xl">💧</span>
                <div>
                  <p className="text-blue-200 font-bold text-sm">Thirst</p>
                  <p className="text-gray-400 text-xs">Drink water, mead, or other beverages.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-600/40 rounded">
                <span className="text-2xl">😴</span>
                <div>
                  <p className="text-purple-200 font-bold text-sm">Fatigue</p>
                  <p className="text-gray-400 text-xs">Rest at inns or use camping gear to recover.</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-900/20 border border-amber-600/40 rounded">
              <p className="text-amber-200 text-xs font-sans">
                <strong>🔥 Bonfire:</strong> Click the campfire icon in Actions to rest, eat, drink, or make camp.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Shops & Economy',
        icon: <ShoppingBag className="text-skyrim-gold" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              Manage your gold and equipment through the shop system:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans">
                  <span className="font-bold text-skyrim-gold">🛒 General Store</span><br />
                  Buy weapons, armor, potions, food, and camping supplies.
                  Item availability improves as you level up.
                </p>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans">
                  <span className="font-bold text-skyrim-gold">⚒️ Blacksmith</span><br />
                  Upgrade your weapons and armor. Improves damage and armor ratings.
                </p>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <p className="text-skyrim-text text-sm font-sans">
                  <span className="font-bold text-skyrim-gold">💰 Selling Items</span><br />
                  Sell unwanted items for gold. Loot enemies and explore to find valuable treasures.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Perks & Progression',
        icon: <Sparkles className="text-purple-400" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              As you gain experience and level up, you unlock new abilities:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-purple-900/20 border border-purple-600/40 rounded">
                <p className="text-purple-200 text-sm font-sans">
                  <span className="font-bold">⭐ Perk Points</span><br />
                  Earn 1 perk point per level. Spend them in the Perk Tree to unlock permanent bonuses.
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-600/40 rounded">
                <p className="text-blue-200 text-sm font-sans">
                  <span className="font-bold">📈 Skills</span><br />
                  Skills improve as you use them. Higher skills unlock better perks and abilities.
                </p>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-600/40 rounded">
                <p className="text-amber-200 text-sm font-sans">
                  <span className="font-bold">🔮 Spells</span><br />
                  Unlock new spells as you level up. Visit the Spells menu to see available magic.
                </p>
              </div>
            </div>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-xs font-sans">
                <strong>Note:</strong> Regeneration perks unlock at level 10. Before that, you regenerate health/magicka/stamina passively.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Settings & Customization',
        icon: <Settings className="text-gray-400" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed">
              Customize your experience with these options:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded flex items-center gap-3">
                <Sun size={20} className="text-yellow-400" />
                <div>
                  <p className="text-skyrim-text text-sm font-bold">Theme</p>
                  <p className="text-gray-400 text-xs">Switch between dark and light modes.</p>
                </div>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded flex items-center gap-3">
                <Volume2 size={20} className="text-green-400" />
                <div>
                  <p className="text-skyrim-text text-sm font-bold">Music & Sound</p>
                  <p className="text-gray-400 text-xs">Toggle ambient music and sound effects.</p>
                </div>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded flex items-center gap-3">
                <Snowflake size={20} className="text-blue-300" />
                <div>
                  <p className="text-skyrim-text text-sm font-bold">Weather Effects</p>
                  <p className="text-gray-400 text-xs">Snow, rain, or clear skies.</p>
                </div>
              </div>
              <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded flex items-center gap-3">
                <HelpCircle size={20} className="text-skyrim-gold" />
                <div>
                  <p className="text-skyrim-text text-sm font-bold">Help & Tutorial</p>
                  <p className="text-gray-400 text-xs">Access this tutorial again anytime.</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
              <p className="text-skyrim-text text-xs font-sans">
                <strong>⌨️ Console:</strong> Type "console" anywhere to open developer console for advanced commands.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Begin Your Adventure!',
        icon: <Flame className="text-orange-400" size={28} />,
        body: (
          <div className="space-y-4">
            <p className="text-gray-200 font-sans leading-relaxed text-base">
              You're ready to explore the world of Skyrim! Here are some tips to get started:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-skyrim-gold">1.</span>
                <span className="text-gray-300">Create your first character using any method you prefer.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-skyrim-gold">2.</span>
                <span className="text-gray-300">Go to the Adventure tab and introduce yourself to the world.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-skyrim-gold">3.</span>
                <span className="text-gray-300">Explore, fight, trade, and make choices that shape your story.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-skyrim-gold">4.</span>
                <span className="text-gray-300">Your progress saves automatically. Come back anytime!</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-skyrim-gold/20 to-amber-900/20 border border-skyrim-gold/40 rounded text-center">
              <p className="text-skyrim-gold text-lg font-serif italic">
                "May the Divines guide your path, Dragonborn."
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
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <ModalWrapper open={open} onClose={onComplete} zIndex="z-[60]" className="backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-skyrim-paper border border-skyrim-border rounded-lg shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-skyrim-dark">
          <div
            className="h-full bg-skyrim-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 sm:p-6 border-b border-skyrim-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {step.icon}
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 font-sans">Tutorial</div>
              <h2 className="text-lg sm:text-xl font-serif text-skyrim-gold">{step.title}</h2>
              <div className="mt-1 text-xs text-gray-500 font-sans">
                Step {stepIndex + 1} of {steps.length}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="px-3 py-1 bg-skyrim-paper/30 text-skyrim-text border border-skyrim-border rounded hover:bg-skyrim-paper/50 text-sm transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto">{step.body}</div>

        <div className="p-5 sm:p-6 border-t border-skyrim-border flex items-center justify-between gap-3 bg-skyrim-dark/20">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2 bg-skyrim-paper/30 text-skyrim-text border border-skyrim-border rounded hover:bg-skyrim-paper/50 disabled:opacity-40 disabled:hover:bg-skyrim-paper/30 transition-colors"
          >
            Back
          </button>

          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === stepIndex ? 'bg-skyrim-gold' : 'bg-skyrim-border hover:bg-skyrim-gold/50'}`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded hover:bg-skyrim-goldHover font-semibold transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded hover:bg-skyrim-goldHover font-semibold transition-colors"
            >
              Start Adventure
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
