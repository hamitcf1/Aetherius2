import React, { useState, useEffect, useRef, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { Save, Users, LogOut, Sparkles, Image as ImageIcon, Download, Upload, Loader2, Plus, Snowflake, CloudRain, CloudOff, ChevronDown, Volume2, VolumeX, Music, Music2, FileJson, Wind, Mic, Globe, SlidersHorizontal, Bot, Package } from 'lucide-react';
import type { SnowSettings, WeatherEffectType } from './SnowEffect';
import { useAppContext } from '../AppContext';
import { isFeatureEnabled, isFeatureWIP, getFeatureLabel } from '../featureFlags';
import { audioService } from '../services/audioService';
import { ThemeSelector, AIModelSelector } from './GameFeatures';
import { VOICE_OPTIONS, getVoiceSettings, saveVoiceSettings, getVoicesForLanguage, type VoiceSettings } from '../services/ttsService';
import { useLocalization, AVAILABLE_LANGUAGES, getLanguageFlag, type Language } from '../services/localization';

type SnowIntensity = SnowSettings['intensity'];

const SNOW_INTENSITY_OPTIONS: Array<{ value: SnowIntensity; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'blizzard', label: 'Blizzard' },
];

// Custom Voice Style Dropdown (matches app's dropdown design)
const VoiceStyleDropdown: React.FC<{
  gender: 'male' | 'female';
  currentVoice: string;
  onSelect: (voice: string) => void;
  language: string;
}> = ({ gender, currentVoice, onSelect, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const voices = getVoicesForLanguage(language)[gender] || [];
  const current = voices.find(v => v.name === currentVoice);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded bg-skyrim-paper/60 text-skyrim-text border border-skyrim-border hover:border-skyrim-gold transition-colors"
      >
        <span className="flex-1 text-left truncate text-sm">{current?.label || 'Default (Auto)'}</span>
        <ChevronDown size={14} className={`text-skyrim-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-skyrim-paper border border-skyrim-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          <button
            onClick={() => { onSelect(''); setIsOpen(false); }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-skyrim-paper/30 transition-colors ${!currentVoice ? 'text-skyrim-gold' : 'text-skyrim-text'}`}
          >
            Default (Auto)
            {!currentVoice && <span className="text-skyrim-gold">✓</span>}
          </button>
          {voices.map(voice => (
            <button
              key={voice.name}
              onClick={() => { onSelect(voice.name); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-skyrim-paper/30 transition-colors ${voice.name === currentVoice ? 'text-skyrim-gold' : 'text-skyrim-text'}`}
            >
              {voice.label}
              {voice.name === currentVoice && <span className="text-skyrim-gold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionBar: React.FC = () => {
  const {
    handleManualSave,
    isSaving,
    handleLogout,
    setCurrentCharacterId,
    handleExportPDF,
    isExporting,
    handleGenerateProfileImage,
    isGeneratingProfileImage,
    handleCreateImagePrompt,
    handleUploadPhoto,
    aiModel,
    setAiModel,
    isAnonymous,
    handleExportJSON,
    handleImportJSON,
    colorTheme,
    setColorTheme,
    weatherEffect,
    setWeatherEffect,
    weatherIntensity,
    setWeatherIntensity,
    effectsEnabled,
    setEffectsEnabled,
    userSettings,
    updateUserSettings,
    showQuantityControls,
    setShowQuantityControls,
  } = useAppContext();

  // Localization
  const { language, setLanguage, t } = useLocalization();

  const [open, setOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // Defer/hydrate heavy settings content to improve INP when opening modal
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const settingsHydrateRef = useRef<number | null>(null);


  // ESC key handler for settings modal
  useEffect(() => {
    if (!showSettingsModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // hydrate heavy settings sections during idle to avoid blocking the opening interaction
    if (settingsHydrateRef.current) {
      try { clearTimeout(settingsHydrateRef.current); } catch { }
    }
    if ((window as any).requestIdleCallback) {
      settingsHydrateRef.current = (window as any).requestIdleCallback(() => setSettingsHydrated(true));
    } else {
      settingsHydrateRef.current = window.setTimeout(() => setSettingsHydrated(true), 220) as any;
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      setSettingsHydrated(false);
      if (settingsHydrateRef.current) {
        try {
          if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(settingsHydrateRef.current);
          else clearTimeout(settingsHydrateRef.current as number);
        } catch { }
        settingsHydrateRef.current = null;
      }
    };
  }, [showSettingsModal]);

  // Music volume state
  const [musicVolume, setMusicVolume] = useState(() => audioService.getConfig().musicVolume);
  const [soundVolume, setSoundVolume] = useState(() => audioService.getConfig().soundEffectsVolume);

  // Voice settings state - load from ttsService (which has localStorage fallback)
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => getVoiceSettings().gender || 'male');
  const [voiceName, setVoiceName] = useState<string>(() => getVoiceSettings().voiceName || '');

  // Audio state - sync with audioService config
  const [soundEnabled, setSoundEnabled] = useState(() => audioService.getConfig().soundEffectsEnabled);
  const [musicEnabled, setMusicEnabled] = useState(() => audioService.getConfig().musicEnabled);

  // Load voice settings from userSettings (Firebase) on mount
  useEffect(() => {
    if (userSettings?.voiceGender) {
      setVoiceGender(userSettings.voiceGender);
      setVoiceName(userSettings.voiceName || '');
      // Also update the ttsService
      saveVoiceSettings({
        gender: userSettings.voiceGender,
        voiceName: userSettings.voiceName,
        pitch: userSettings.voicePitch,
        speakingRate: userSettings.voiceSpeakingRate,
      });
    }
  }, [userSettings]);

  // Handle voice gender change
  const handleVoiceGenderChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    setVoiceName(''); // Reset voice name when gender changes
    const newSettings: VoiceSettings = { gender, voiceName: undefined };
    saveVoiceSettings(newSettings);
    // Persist to Firebase
    updateUserSettings?.({ voiceGender: gender, voiceName: undefined });
  };

  // Handle voice name change
  const handleVoiceNameChange = (name: string) => {
    setVoiceName(name);
    const newSettings: VoiceSettings = { gender: voiceGender, voiceName: name || undefined };
    saveVoiceSettings(newSettings);
    // Persist to Firebase
    updateUserSettings?.({ voiceGender, voiceName: name || undefined });
  };

  // Toggle handlers that update both local state and audioService
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioService.setSoundEffectsEnabled(newState);
    updateUserSettings?.({ soundEffectsEnabled: newState });
  };

  const handleToggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    audioService.setMusicEnabled(newState);
    updateUserSettings?.({ musicEnabled: newState });
  };

  // Volume handlers
  const handleMusicVolumeChange = (volume: number) => {
    setMusicVolume(volume);
    audioService.setMusicVolume(volume);
  };

  const handleSoundVolumeChange = (volume: number) => {
    setSoundVolume(volume);
    audioService.setSoundEffectsVolume(volume);
  };

  // Weather mouse interaction toggle - initialize from userSettings (default true)
  const [weatherMouseInteractionEnabled, setWeatherMouseInteractionEnabled] = useState<boolean>(() => userSettings?.weatherMouseInteractionEnabled ?? true);

  useEffect(() => {
    // When userSettings load, sync the local toggle
    if (typeof userSettings?.weatherMouseInteractionEnabled === 'boolean') {
      setWeatherMouseInteractionEnabled(userSettings.weatherMouseInteractionEnabled);
    }
  }, [userSettings]);

  const handleToggleWeatherMouseInteraction = () => {
    const newState = !weatherMouseInteractionEnabled;
    setWeatherMouseInteractionEnabled(newState);
    updateUserSettings?.({ weatherMouseInteractionEnabled: newState });
  };

  // Ref for the button to align dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number, top: number, width: number }>({ left: 0, top: 0, width: 220 });
  // debounce ref for weather intensity to avoid repeated heavy renders
  const intensityTimerRef = useRef<number | null>(null);

  const updateDropdownPos = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth || 0;
      const padding = 8;
      const desiredWidth = Math.max(240, rect.width);
      const width = Math.max(0, Math.min(desiredWidth, viewportWidth - padding * 2));
      const maxLeft = Math.max(padding, viewportWidth - width - padding);
      const left = Math.min(Math.max(padding, rect.left), maxLeft);
      setDropdownPos({
        left,
        top: rect.bottom + 4,
        width
      });
    }
  };

  const handleToggle = () => {
    setOpen((o) => {
      if (!o) {
        updateDropdownPos();
        window.addEventListener('scroll', updateDropdownPos);
        window.addEventListener('resize', updateDropdownPos);
      } else {
        window.removeEventListener('scroll', updateDropdownPos);
        window.removeEventListener('resize', updateDropdownPos);
      }
      return !o;
    });
  };

  // Clean up listeners if component unmounts while open
  React.useEffect(() => {
    return () => {
      window.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking the button or inside the dropdown
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;

      setOpen(false);
      window.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };

    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="pop-in bg-skyrim-gold text-skyrim-dark px-3 py-2 rounded shadow-lg font-bold flex items-center gap-2 relative overflow-hidden shrink-0"
        aria-label={open ? t('common.close') : t('actions.label')}
      >
        <span style={{ position: 'relative', width: 20, height: 20, display: 'inline-block' }}>
          <Plus
            size={16}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: open ? 0 : 1,
              transform: open ? 'rotate(90deg) scale(0.7)' : 'rotate(0deg) scale(1)',
              transition: 'opacity 0.2s, transform 0.2s'
            }}
          />
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              opacity: open ? 1 : 0,
              transform: open ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.7)',
              transition: 'opacity 0.2s, transform 0.2s'
            }}
            aria-hidden={!open}
          >
            <rect x="5" y="11" width="14" height="2" rx="1" fill="currentColor" />
          </svg>
        </span>
        {t('actions.label')}
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-cheap p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
          style={{
            position: 'fixed',
            left: dropdownPos.left,
            top: dropdownPos.top,
            minWidth: dropdownPos.width,
            maxWidth: 'calc(100vw - 16px)',
            zIndex: 1000
          }}
        >
          {/* Settings Button - Opens comprehensive settings modal */}
          <button
            onClick={() => {
              setShowSettingsModal(true);
              setOpen(false);
            }}
            data-sfx="button_click"
            className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-skyrim-gold/20 to-skyrim-gold/10 border border-skyrim-gold rounded font-bold text-skyrim-gold hover:from-skyrim-gold/30 hover:to-skyrim-gold/20 transition-all"
          >
            <SlidersHorizontal size={16} /> {t('common.settings')}
            <span className="ml-auto text-xs text-skyrim-text/60">{getLanguageFlag(language)}</span>
          </button>

          {/* Theme Selector */}
          {colorTheme !== undefined && setColorTheme && (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-500 font-bold">{t('settings.theme')}</div>
              <ThemeSelector currentTheme={colorTheme} onSelect={setColorTheme} />
            </div>
          )}
          <button onClick={handleManualSave} disabled={isSaving} className="w-full flex items-center gap-2 px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold disabled:opacity-50">
            <Save size={16} /> {isSaving ? t('status.saving') : t('common.save')}
          </button>
          <button onClick={() => setCurrentCharacterId(null)} className="w-full flex items-center gap-2 px-3 py-2 bg-skyrim-dark text-skyrim-gold rounded font-bold">
            <Users size={16} /> {t('actions.switch')}
          </button>
          <button
            onClick={() => {
              if (isAnonymous) {
                setShowLogoutWarning(true);
              } else {
                handleLogout();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-red-700 text-white rounded font-bold"
          >
            <LogOut size={16} /> {isAnonymous ? t('actions.exitGuest') : t('actions.exit')}
          </button>
          <button onClick={handleCreateImagePrompt} className="w-full flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded font-bold">
            <Sparkles size={16} /> {t('actions.createImage')}
          </button>

          {isFeatureEnabled('photoUpload') && (
            <div className="relative">
              <label className="w-full flex items-center gap-2 px-3 py-2 rounded font-bold bg-green-700 text-white cursor-pointer hover:bg-green-600">
                <ImageIcon size={16} /> {t('actions.uploadPhoto')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadPhoto} />
              </label>
            </div>
          )}

          {/* Export PDF - show as disabled if feature not enabled */}
          <div className="relative group">
            <button
              onClick={isFeatureEnabled('exportPDF') ? handleExportPDF : undefined}
              disabled={!isFeatureEnabled('exportPDF') || isExporting}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded font-bold ${isFeatureEnabled('exportPDF')
                  ? 'bg-skyrim-gold text-skyrim-dark hover:bg-yellow-400 disabled:opacity-50'
                  : 'bg-gray-600 text-skyrim-text cursor-not-allowed opacity-60'
                }`}
            >
              <Download size={16} /> {isExporting ? t('actions.generating') : t('actions.export')}
            </button>
            {!isFeatureEnabled('exportPDF') && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {getFeatureLabel('exportPDF') || 'Work in Progress'}
              </div>
            )}
          </div>

          {/* Export/Import JSON - Character backup/restore */}
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded font-bold bg-green-700 text-white hover:bg-green-600"
              title="Export character as JSON backup"
            >
              <FileJson size={16} /> {t('actions.exportJson')}
            </button>
            <button
              onClick={handleImportJSON}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded font-bold bg-blue-700 text-white hover:bg-blue-600"
              title="Import character from JSON backup"
            >
              <Upload size={16} /> {t('actions.import')}
            </button>
          </div>

          {/* Shop Button - Now in Inventory section */}
          {/* Removed: Shop button moved to Inventory for better UX */}

          {/* AI Profile Image - hide entirely when feature is disabled */}
          {isFeatureEnabled('aiProfileImage') && (
            <div className="relative group">
              <button
                onClick={handleGenerateProfileImage}
                disabled={isGeneratingProfileImage}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded font-bold ${isGeneratingProfileImage ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-70' : 'bg-skyrim-accent text-white hover:bg-purple-700'
                  }`}
              >
                {isGeneratingProfileImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                {isGeneratingProfileImage ? t('actions.generating') : t('actions.generateProfile')}
              </button>
            </div>
          )}

          {/* Version and Credits */}
          <div className="border-t border-skyrim-border/60 pt-3 mt-2">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-sans">{t('actions.version')} 1.0.8</div>
              <div className="text-[10px] text-gray-600 font-sans mt-1">{t('actions.madeBy')} Hamit Can Fındık</div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Guest Logout Warning Modal */}
      {showLogoutWarning && createPortal(
        <div className="fixed inset-0 bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-skyrim-paper border-2 border-red-600 rounded-lg shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <LogOut size={20} className="text-red-400" />
              </div>
              <h3 className="text-xl font-serif text-red-400">Warning: Guest Account</h3>
            </div>

            <p className="text-skyrim-text mb-4">
              You are logged in as a <strong className="text-yellow-400">guest</strong>. If you exit now, you will <strong className="text-red-400">permanently lose all your data</strong> including:
            </p>

            <ul className="text-skyrim-text text-sm mb-6 space-y-1 ml-4">
              <li>• All characters and their progress</li>
              <li>• Inventory, gold, and items</li>
              <li>• Quest logs and journal entries</li>
              <li>• Story chapters and adventure history</li>
            </ul>

            <p className="text-yellow-400 text-sm mb-6">
              💡 Tip: Create an account to save your progress permanently!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutWarning(false)}
                className="flex-1 px-4 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-400 transition-colors"
              >
                Stay & Keep Playing
              </button>
              <button
                onClick={() => {
                  setShowLogoutWarning(false);
                  handleLogout();
                }}
                className="flex-1 px-4 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-600 transition-colors"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      {showSettingsModal && createPortal(
        <div className="fixed inset-0 bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-skyrim-gold flex items-center gap-2">
                <SlidersHorizontal size={20} /> {t('common.settings')}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-skyrim-text hover:text-skyrim-gold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Language Selection */}
            <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-skyrim-gold" />
                <span className="text-sm font-bold text-skyrim-gold uppercase">{t('settings.language')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${language === lang.code
                        ? 'bg-skyrim-gold text-skyrim-dark border-skyrim-gold font-bold'
                        : 'bg-skyrim-paper/40 text-skyrim-text border-skyrim-border hover:border-skyrim-gold'
                      }`}
                  >
                    <span className="text-lg">{getLanguageFlag(lang.code)}</span>
                    <span>{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Selection */}
            {typeof setAiModel === 'function' && (
              <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className="text-skyrim-gold" />
                  <span className="text-sm font-bold text-skyrim-gold uppercase">AI Model</span>
                </div>
                {settingsHydrated ? (
                  <>
                    <AIModelSelector currentModel={aiModel || 'gemma-3-27b-it'} onSelect={setAiModel} />
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      Choose the AI model powering your adventure
                    </p>
                  </>
                ) : (
                  <div className="p-3 text-sm text-gray-400">Loading…</div>
                )}
              </div>
            )}

            {/* Audio Settings */}
            <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
              <div className="flex items-center gap-2 mb-3">
                <Music2 size={16} className="text-skyrim-gold" />
                <span className="text-sm font-bold text-skyrim-gold uppercase">Audio</span>
              </div>

              {/* Music Volume */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-skyrim-text flex items-center gap-2">
                    <Music size={14} /> {t('settings.music')}
                  </label>
                  <span className="text-xs text-skyrim-gold">{Math.round(musicVolume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleMusic}
                    className={`p-2 rounded ${musicEnabled ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400'}`}
                  >
                    {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVolume}
                    onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-skyrim-gold"
                    disabled={!musicEnabled}
                  />
                </div>
              </div>

              {/* Sound Effects Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-skyrim-text flex items-center gap-2">
                    <Volume2 size={14} /> {t('settings.sound')}
                  </label>
                  <span className="text-xs text-skyrim-gold">{Math.round(soundVolume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSound}
                    className={`p-2 rounded ${soundEnabled ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400'}`}
                  >
                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundVolume}
                    onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-skyrim-gold"
                    disabled={!soundEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
              <div className="flex items-center gap-2 mb-3">
                <Mic size={16} className="text-skyrim-gold" />
                <span className="text-sm font-bold text-skyrim-gold uppercase">Voice (TTS)</span>
              </div>

              {settingsHydrated ? (
                <>
                  {/* Voice Gender */}
                  <div className="mb-3">
                    <label className="text-xs text-skyrim-text block mb-2">Voice Gender</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoiceGenderChange('male')}
                        className={`flex-1 px-3 py-2 rounded border transition-colors ${voiceGender === 'male'
                            ? 'bg-blue-700 text-white border-blue-600'
                            : 'bg-skyrim-paper/40 text-skyrim-text border-skyrim-border hover:border-blue-600'
                          }`}
                      >
                        Male
                      </button>
                      <button
                        onClick={() => handleVoiceGenderChange('female')}
                        className={`flex-1 px-3 py-2 rounded border transition-colors ${voiceGender === 'female'
                            ? 'bg-pink-700 text-white border-pink-600'
                            : 'bg-skyrim-paper/40 text-skyrim-text border-skyrim-border hover:border-pink-600'
                          }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  {/* Voice Style */}
                  <div className="mb-3">
                    <label className="text-xs text-skyrim-text block mb-2">Voice Style</label>
                    <VoiceStyleDropdown
                      gender={voiceGender}
                      currentVoice={voiceName}
                      onSelect={handleVoiceNameChange}
                      language={language}
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 mt-2 italic">
                    Voice language will match your selected language ({AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeName})
                  </p>
                </>
              ) : (
                <div className="p-3 text-sm text-gray-400">Loading…</div>
              )}
            </div>

            {/* Inventory Settings */}
            <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-skyrim-gold" />
                <span className="text-sm font-bold text-skyrim-gold uppercase">Inventory</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showQuantityControls}
                  onChange={() => setShowQuantityControls(!showQuantityControls)}
                  className="accent-skyrim-gold w-4 h-4"
                />
                <span className="text-sm text-skyrim-text">Show quantity controls</span>
              </label>
            </div>

            {/* Weather Effects (if enabled) */}
            {isFeatureEnabled('snowEffect') && (
              <div className="mb-6 p-4 bg-skyrim-dark/30 rounded border border-skyrim-border">
                <div className="flex items-center gap-2 mb-3">
                  <Snowflake size={16} className="text-skyrim-gold" />
                  <span className="text-sm font-bold text-skyrim-gold uppercase">{t('settings.weather')}</span>
                </div>

                {settingsHydrated ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'snow', icon: <Snowflake size={14} />, label: t('settings.weatherSnow') },
                        { value: 'rain', icon: <CloudRain size={14} />, label: t('settings.weatherRain') },
                        { value: 'sandstorm', icon: <Wind size={14} />, label: 'Sandstorm' },
                        { value: 'none', icon: <CloudOff size={14} />, label: t('settings.weatherClear') },
                      ].map(w => (
                        <button
                          key={w.value}
                          onClick={() => startTransition(() => setWeatherEffect(w.value as WeatherEffectType))}
                          className={`flex flex-col items-center gap-1 px-2 py-2 rounded border text-xs transition-colors ${weatherEffect === w.value
                              ? 'bg-skyrim-gold text-skyrim-dark border-skyrim-gold font-bold'
                              : 'bg-skyrim-paper/40 text-skyrim-text border-skyrim-border hover:border-skyrim-gold'
                            }`}
                        >
                          {w.icon}
                          <span>{w.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Weather Intensity (when weather is active) */}
                    {weatherEffect !== 'none' && (
                      <div className="mt-3">
                        <label className="text-xs text-skyrim-text block mb-2">Intensity</label>
                        <div className="grid grid-cols-4 gap-2">
                          {SNOW_INTENSITY_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                if (intensityTimerRef.current) clearTimeout(intensityTimerRef.current);
                                intensityTimerRef.current = window.setTimeout(() => {
                                  startTransition(() => setWeatherIntensity(opt.value));
                                  intensityTimerRef.current = null;
                                }, 80) as any;
                              }}
                              className={`px-2 py-1.5 text-xs rounded border transition-colors ${weatherIntensity === opt.value
                                  ? 'bg-skyrim-gold text-skyrim-dark border-skyrim-gold font-bold'
                                  : 'bg-skyrim-paper/40 text-skyrim-text border-skyrim-border hover:border-skyrim-gold'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Mouse Interaction Toggle */}
                        <div className="mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={weatherMouseInteractionEnabled}
                              onChange={handleToggleWeatherMouseInteraction}
                              className="accent-skyrim-gold w-4 h-4"
                            />
                            <span className="text-sm text-skyrim-text">Enable mouse interaction (repel particles)</span>
                          </label>
                        </div>

                        {/* Effects Enabled Toggle (always visible regardless of weather) */}
                        <div className="mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(effectsEnabled)}
                              onChange={() => {
                                const newState = !Boolean(effectsEnabled);
                                try { localStorage.setItem('aetherius:effectsEnabled', newState ? 'true' : 'false'); } catch { }
                                setEffectsEnabled(newState);
                              }}
                              className="accent-skyrim-gold w-4 h-4"
                            />
                            <span className="text-sm text-skyrim-text">Enable visual effects (spells, particles, screen flashes)</span>
                          </label>
                        </div>

                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-sm text-gray-400">Loading weather settings…</div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full px-4 py-3 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-400 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const ActionBarToggle = ActionBar;
export default ActionBar;