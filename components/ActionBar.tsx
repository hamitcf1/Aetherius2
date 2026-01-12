import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Users, LogOut, Sparkles, Image as ImageIcon, Download, Upload, Loader2, Plus, Snowflake, ChevronDown, Volume2, VolumeX, Music, Music2, FileJson } from 'lucide-react';
import SnowEffect, { SnowSettings } from './SnowEffect';
import { useAppContext } from '../AppContext';
import { isFeatureEnabled, isFeatureWIP, getFeatureLabel } from '../featureFlags';
import { audioService } from '../services/audioService';
import { ThemeSelector, AIModelSelector } from './GameFeatures';

type SnowIntensity = SnowSettings['intensity'];

const SNOW_INTENSITY_OPTIONS: Array<{ value: SnowIntensity; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'blizzard', label: 'Blizzard' },
];

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
  } = useAppContext();
  const [open, setOpen] = useState(false);
  const [snow, setSnow] = useState(false);
  const [snowIntensity, setSnowIntensity] = useState<SnowIntensity>('normal');
  const [showSnowOptions, setShowSnowOptions] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  
  // Audio state - sync with audioService config
  const [soundEnabled, setSoundEnabled] = useState(() => audioService.getConfig().soundEffectsEnabled);
  const [musicEnabled, setMusicEnabled] = useState(() => audioService.getConfig().musicEnabled);

  // Toggle handlers that update both local state and audioService
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioService.setSoundEffectsEnabled(newState);
  };

  const handleToggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    audioService.setMusicEnabled(newState);
  };
  
  // Ref for the button to align dropdown
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{left: number, top: number, width: number}>({left: 0, top: 0, width: 220});

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

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="bg-skyrim-gold text-skyrim-dark px-3 py-2 rounded shadow-lg font-bold flex items-center gap-2 relative overflow-hidden shrink-0"
        aria-label={open ? 'Close actions menu' : 'Open actions menu'}
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
        Actions
      </button>
      {open && createPortal(
        <div
          className="bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
          style={{
            position: 'fixed',
            left: dropdownPos.left,
            top: dropdownPos.top,
            minWidth: dropdownPos.width,
            maxWidth: 'calc(100vw - 16px)',
            zIndex: 1000
          }}
        >
          {typeof setAiModel === 'function' && (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-500 font-bold">AI Model</div>
              <AIModelSelector currentModel={aiModel || 'gemma-3-27b-it'} onSelect={setAiModel} />
            </div>
          )}
          {/* Theme Selector */}
          {colorTheme !== undefined && setColorTheme && (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-500 font-bold">Theme</div>
              <ThemeSelector currentTheme={colorTheme} onSelect={setColorTheme} />
            </div>
          )}
          <button onClick={handleManualSave} disabled={isSaving} className="w-full flex items-center gap-2 px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold disabled:opacity-50">
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setCurrentCharacterId(null)} className="w-full flex items-center gap-2 px-3 py-2 bg-skyrim-dark text-skyrim-gold rounded font-bold">
            <Users size={16} /> Switch
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
            <LogOut size={16} /> {isAnonymous ? 'Exit (Guest)' : 'Exit'}
          </button>
          <button onClick={handleCreateImagePrompt} className="w-full flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded font-bold">
            <Sparkles size={16} /> Create Image Prompt
          </button>
          
          {/* Upload Photo - show as disabled if feature not enabled */}
          <div className="relative group">
            <label 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded font-bold ${
                isFeatureEnabled('photoUpload') 
                  ? 'bg-green-700 text-white cursor-pointer hover:bg-green-600' 
                  : 'bg-gray-600 text-skyrim-text cursor-not-allowed opacity-60'
              }`}
            >
              <ImageIcon size={16} /> Upload Photo
              {isFeatureEnabled('photoUpload') && (
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadPhoto} />
              )}
            </label>
            {!isFeatureEnabled('photoUpload') && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {getFeatureLabel('photoUpload') || 'Work in Progress'}
              </div>
            )}
          </div>
          
          {/* Export PDF - show as disabled if feature not enabled */}
          <div className="relative group">
            <button 
              onClick={isFeatureEnabled('exportPDF') ? handleExportPDF : undefined}
              disabled={!isFeatureEnabled('exportPDF') || isExporting}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded font-bold ${
                isFeatureEnabled('exportPDF')
                  ? 'bg-skyrim-gold text-skyrim-dark hover:bg-yellow-400 disabled:opacity-50'
                  : 'bg-gray-600 text-skyrim-text cursor-not-allowed opacity-60'
              }`}
            >
              <Download size={16} /> {isExporting ? 'Generating...' : 'Export Full Record'}
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
              <FileJson size={16} /> Export JSON
            </button>
            <button 
              onClick={handleImportJSON}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded font-bold bg-blue-700 text-white hover:bg-blue-600"
              title="Import character from JSON backup"
            >
              <Upload size={16} /> Import
            </button>
          </div>

          {/* Shop Button - Now in Inventory section */}
          {/* Removed: Shop button moved to Inventory for better UX */}

          {/* AI Profile Image - show as disabled if feature not enabled */}
          <div className="relative group">
            <button 
              onClick={isFeatureEnabled('aiProfileImage') ? handleGenerateProfileImage : undefined}
              disabled={!isFeatureEnabled('aiProfileImage') || isGeneratingProfileImage}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded font-bold ${
                isFeatureEnabled('aiProfileImage')
                  ? 'bg-skyrim-accent text-white hover:bg-purple-700 disabled:opacity-50'
                  : 'bg-gray-600 text-skyrim-text cursor-not-allowed opacity-60'
              }`}
            >
              {isGeneratingProfileImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
              {isGeneratingProfileImage ? 'Generating...' : 'Generate Profile Photo'}
            </button>
            {!isFeatureEnabled('aiProfileImage') && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {getFeatureLabel('aiProfileImage') || 'Work in Progress'}
              </div>
            )}
          </div>
          
          {/* Snow Effect - show as disabled if feature not enabled */}
          <div className="relative group">
            <div className="flex gap-1">
              <button 
                onClick={isFeatureEnabled('snowEffect') ? () => setSnow((s) => !s) : undefined}
                disabled={!isFeatureEnabled('snowEffect')}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-l font-bold ${
                  isFeatureEnabled('snowEffect')
                    ? (snow ? 'bg-blue-200 text-blue-900' : 'bg-blue-900 text-white hover:bg-blue-800')
                    : 'bg-gray-700 text-skyrim-text hover:bg-gray-600'
                }`}
              >
                <Snowflake size={16} /> {snow ? 'Disable Snow Effect' : 'Snow Effect'}
              </button>
              {isFeatureEnabled('snowEffect') && snow && (
                <button
                  onClick={() => setShowSnowOptions(s => !s)}
                  className="px-2 py-2 bg-blue-200 text-blue-900 rounded-r border-l border-blue-300 hover:bg-blue-100"
                  title="Snow settings"
                >
                  <ChevronDown size={16} className={showSnowOptions ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              )}
            </div>
            {/* Snow intensity options */}
            {snow && showSnowOptions && isFeatureEnabled('snowEffect') && (
              <div className="mt-2 p-2 bg-gray-800 rounded border border-skyrim-border">
                <div className="text-xs text-skyrim-text mb-1">Snow Intensity</div>
                <div className="flex flex-wrap gap-1">
                  {SNOW_INTENSITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSnowIntensity(opt.value)}
                      className={`px-2 py-1 text-xs rounded ${
                        snowIntensity === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isFeatureEnabled('snowEffect') && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {getFeatureLabel('snowEffect') || 'Work in Progress'}
              </div>
            )}
          </div>

          {/* Audio Settings */}
          <div className="border-t border-skyrim-border/60 pt-3 mt-2">
            <div className="text-xs text-gray-500 font-bold mb-2">Audio Settings</div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleSound}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded font-bold transition-colors ${
                  soundEnabled 
                    ? 'bg-green-700 text-white hover:bg-green-600' 
                    : 'bg-gray-700 text-skyrim-text hover:bg-gray-600'
                }`}
                title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span className="text-xs">SFX</span>
              </button>
              <button
                onClick={handleToggleMusic}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded font-bold transition-colors ${
                  musicEnabled 
                    ? 'bg-purple-700 text-white hover:bg-purple-600' 
                    : 'bg-gray-700 text-skyrim-text hover:bg-gray-600'
                }`}
                title={musicEnabled ? 'Disable background music' : 'Enable background music'}
              >
                {musicEnabled ? <Music size={16} /> : <Music2 size={16} />}
                <span className="text-xs">Music</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1 text-center italic">
              Audio files coming soon
            </p>
          </div>

          {/* Version and Credits */}
          <div className="border-t border-skyrim-border/60 pt-3 mt-2">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-sans">Version 1.0.7</div>
              <div className="text-[10px] text-gray-600 font-sans mt-1">Made by Hamit Can Fındık</div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {snow && <SnowEffect settings={{ intensity: snowIntensity }} theme={colorTheme} />}

      {/* Guest Logout Warning Modal */}
      {showLogoutWarning && createPortal(
        <div className="fixed inset-0 bg-skyrim-dark/60 flex items-center justify-center z-[2000] p-4">
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
    </>
  );
};

export const ActionBarToggle = ActionBar;
export default ActionBar;