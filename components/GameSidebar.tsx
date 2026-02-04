/**
 * GameSidebar - Collapsible sidebar for game features
 * Contains: Crafting, Magic & Powers, World, Companions, Achievements
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Trophy,
  Flame,
  Sparkles,
  Map,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { ActionBarToggle } from './ActionBar';
import { useLocalization } from '../services/localization';

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  render?: React.ReactNode;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  color: string;
}

const GameSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => ({
    crafting: false,
    magic: false,
    world: false,
    social: false,
    'ai-tools': false,
    progress: false,
  }));

  // Bug reports count badge
  const [bugCount, setBugCount] = useState<number>(0);
  useEffect(() => {
    try {
      const br = require('../services/bugReportService');
      const all = br.getBugReports();
      setBugCount(all.filter((r: any) => r.status === 'open' || r.status === 'tracking').length);
    } catch (e) { }
  }, [isOpen]);

  const {
    openCompanions,
    openAchievements,
    openAlchemy,
    openCooking,
    openTravel,
    openFactions,
    openShouts,
    openEnchanting,
    openStandingStones,
    openBounty,
    openTraining,
    openTransformation,
    openHousing,
    openAIScribe,
    openBugReport,
  } = useAppContext();

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const { t } = useLocalization();

  const handleItemClick = (onClick: () => void) => {
    onClick();
    if (isMobile) setIsOpen(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sections: SidebarSection[] = [
    {
      id: 'crafting',
      title: t('sidebar.crafting'),
      icon: <Flame size={16} className="text-orange-400" />,
      items: [
        { id: 'alchemy', label: t('sidebar.alchemy'), icon: '🧪', onClick: () => openAlchemy?.(), color: 'green' },
        { id: 'cooking', label: t('sidebar.cooking'), icon: '🍳', onClick: () => openCooking?.(), color: 'orange' },
        { id: 'enchanting', label: t('sidebar.enchanting'), icon: '✨', onClick: () => openEnchanting?.(), color: 'purple' },
      ],
    },
    {
      id: 'magic',
      title: t('sidebar.magic'),
      icon: <Sparkles size={16} className="text-cyan-400" />,
      items: [
        { id: 'shouts', label: t('sidebar.shouts'), icon: '🗣️', onClick: () => openShouts?.(), color: 'cyan' },
        { id: 'stones', label: t('sidebar.standingStones'), icon: '🪨', onClick: () => openStandingStones?.(), color: 'indigo' },
        { id: 'transform', label: t('sidebar.transformations'), icon: '🐺', onClick: () => openTransformation?.(), color: 'red' },
      ],
    },
    {
      id: 'world',
      title: t('sidebar.world'),
      icon: <Map size={16} className="text-blue-400" />,
      items: [
        { id: 'travel', label: t('sidebar.travel'), icon: '🏰', onClick: () => openTravel?.(), color: 'blue' },
        { id: 'factions', label: t('sidebar.factions'), icon: '⚔️', onClick: () => openFactions?.(), color: 'red' },
        { id: 'bounty', label: t('sidebar.bounty'), icon: '⚖️', onClick: () => openBounty?.(), color: 'yellow' },
        { id: 'training', label: t('sidebar.training'), icon: '📚', onClick: () => openTraining?.(), color: 'emerald' },
        { id: 'housing', label: t('sidebar.housing'), icon: '🏠', onClick: () => openHousing?.(), color: 'amber' },
      ],
    },
    {
      id: 'social',
      title: t('sidebar.social'),
      icon: <Users size={16} className="text-purple-400" />,
      items: [
        { id: 'companions', label: t('sidebar.companions'), icon: '👥', onClick: openCompanions, color: 'purple' },
      ],
    },
    {
      id: 'ai-tools',
      title: t('sidebar.aiTools'),
      icon: <Sparkles size={16} className="text-cyan-400" />,
      items: [
        { id: 'ai-scribe', label: t('sidebar.gameMaster'), icon: '🧙', onClick: () => openAIScribe?.(), color: 'cyan' },
        { id: 'bug_reports', label: t('sidebar.bugReports'), icon: '🐞', onClick: () => openBugReport?.(), color: 'red' },
      ],
    },
    {
      id: 'progress',
      title: t('sidebar.progress'),
      icon: <Trophy size={16} className="text-amber-400" />,
      items: [
        { id: 'achievements', label: t('sidebar.achievements'), icon: '🏆', onClick: openAchievements, color: 'amber' },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      green: 'border-green-600/50 glass-panel-lighter text-green-200 hover:bg-green-900/40',
      orange: 'border-orange-600/50 glass-panel-lighter text-orange-200 hover:bg-orange-900/40',
      purple: 'border-purple-600/50 glass-panel-lighter text-purple-200 hover:bg-purple-900/40',
      cyan: 'border-cyan-600/50 glass-panel-lighter text-cyan-200 hover:bg-cyan-900/40',
      indigo: 'border-indigo-600/50 glass-panel-lighter text-indigo-200 hover:bg-indigo-900/40',
      red: 'border-red-600/50 glass-panel-lighter text-red-200 hover:bg-red-900/40',
      blue: 'border-blue-600/50 glass-panel-lighter text-blue-200 hover:bg-blue-900/40',
      yellow: 'border-yellow-600/50 glass-panel-lighter text-yellow-200 hover:bg-yellow-900/40',
      emerald: 'border-emerald-600/50 glass-panel-lighter text-emerald-200 hover:bg-emerald-900/40',
      amber: 'border-amber-600/50 glass-panel-lighter text-amber-200 hover:bg-amber-900/40',
    };
    return colors[color] || colors.purple;
  };

  // Toggle button (always visible)
  const toggleButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`fixed top-20 z-50 p-2 rounded-r-lg transition-all duration-300 shadow-lg ${isOpen
        ? 'left-64 glass-panel border border-l-0 border-zinc-700/50'
        : 'left-0 bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:pl-4 shadow-gold'
        }`}
      aria-label={isOpen ? t('common.close') : t('common.settings')} // Using simpler common keys for toggle ARIA
    >
      {isOpen ? (
        <ChevronLeft size={20} className="text-skyrim-gold" />
      ) : (
        <ChevronRight size={20} />
      )}
    </button>
  );

  // Sidebar content
  const sidebarContent = (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 glass-panel z-40 transform transition-transform duration-300 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-skyrim-border bg-gradient-to-r from-skyrim-dark/30 to-transparent">
        <h2 className="text-lg font-serif text-skyrim-gold tracking-wide">{t('nav.gameMenu')}</h2>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-skyrim-text hover:text-skyrim-gold transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Scrollable sections */}
      <div className="h-[calc(100%-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-skyrim-gold/30 scrollbar-track-transparent">
        {sections.map((section) => (
          <div key={section.id} className="p-3 border-b border-skyrim-border/50">
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={!!expandedSections[section.id]}
              className="w-full flex items-center gap-2 mb-2 text-left group"
            >
              <span
                className={`transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`}
              >
                <ChevronDown size={14} className="text-skyrim-gold/80" />
              </span>
              {typeof section.icon === 'function' ? (section.icon as any)() : section.icon}
              <span className="text-xs font-bold text-skyrim-gold uppercase tracking-wider">
                {section.title}
              </span>
              <span className="ml-auto text-[10px] text-skyrim-text/50">
                {expandedSections[section.id] ? t('common.hide') : t('common.show')}
              </span>
            </button>

            {/* Section items */}
            {expandedSections[section.id] && (
              <div className="grid gap-1.5">
                {section.render}
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.onClick)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${getColorClasses(item.color)}`}
                  >
                    <span className="text-base">{typeof item.icon === 'function' ? (item.icon as any)() : item.icon}</span>
                    <span>{item.label}</span>
                    {item.id === 'bug_reports' && bugCount > 0 && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-700 text-white">{bugCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-[10px] text-gray-500 italic">
            {t('app.title')}
          </p>
        </div>
      </div>
    </div>
  );

  // Mobile overlay backdrop
  const backdrop = isMobile && isOpen ? (
    <div
      className="fixed inset-0 bg-black/50 z-30"
      onClick={() => setIsOpen(false)}
    />
  ) : null;

  return createPortal(
    <>
      {backdrop}
      {sidebarContent}
      {toggleButton}
    </>,
    document.body
  );
};

// Export ActionButton as a named export for navbar use
export const ActionButton = ActionBarToggle;

export default GameSidebar;
