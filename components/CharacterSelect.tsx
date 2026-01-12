import React, { useState, useRef, useEffect } from 'react';
import { Character, SKYRIM_RACES } from '../types';
import { Play, Plus, Dice5, MessageSquare, Loader2, Sparkles, Send, FileText, ArrowLeft, Trash2, Skull, RotateCcw } from 'lucide-react';
import { generateCharacterProfile, chatWithScribe } from '../services/geminiService';
import { isFeatureEnabled } from '../featureFlags';
import { DropdownSelector } from './GameFeatures';

interface CharacterSelectProps {
  profileId: string | null;
  characters: Character[];
  onSelectCharacter: (characterId: string) => void;
  onCreateCharacter: (profileId: string, name: string, archetype: string, race: string, gender: string, fullDetails?: Partial<Character>) => void;
  onLogout: () => void;
  onUpdateCharacter?: (characterId: string, newName: string) => void;
  onDeleteCharacter?: (characterId: string) => void;
  onMarkCharacterDead?: (characterId: string, isDead: boolean, deathCause?: string) => void;
}

const ARCHETYPES = [
    "Warrior", "Mage", "Thief", "Assassin", "Spellsword", 
    "Battlemage", "Ranger", "Barbarian", "Bard", "Necromancer", "Merchant",
    "Paladin", "Witchhunter", "Sorcerer", "Scout", "Rogue", "Healer", "Knight"
];

// Dropdown options
const GENDER_OPTIONS = [
  { id: 'Male', label: 'Male', icon: '♂️' },
  { id: 'Female', label: 'Female', icon: '♀️' }
];

const RACE_OPTIONS = SKYRIM_RACES.map(race => ({ id: race, label: race }));

const ARCHETYPE_OPTIONS = ARCHETYPES.map(archetype => ({ id: archetype, label: archetype }));

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ 
  profileId, characters, onSelectCharacter, onCreateCharacter, onLogout,
  onUpdateCharacter, onDeleteCharacter, onMarkCharacterDead
}) => {
  const [creationMode, setCreationMode] = useState<'manual' | 'chat' | 'import'>('manual');
  
  // Manual State
  const [newName, setNewName] = useState('');
  const [newArchetype, setNewArchetype] = useState(ARCHETYPES[0]);
  const [newRace, setNewRace] = useState(SKYRIM_RACES[7]); // Default Nord
  const [newGender, setNewGender] = useState('Male');

  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', parts: [{ text: string }]}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Import State
  const [importText, setImportText] = useState('');
  
  // Edit State
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Delete/Death confirmation state
  const [confirmDeleteCharacter, setConfirmDeleteCharacter] = useState<string | null>(null);
  const [confirmDeathCharacter, setConfirmDeathCharacter] = useState<string | null>(null);
  const [deathCause, setDeathCause] = useState('');

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleManualCreate = () => {
      if (profileId && newName.trim()) {
          onCreateCharacter(profileId, newName, newArchetype, newRace, newGender);
          setNewName('');
      }
  };

  const handleRandomizeFull = async () => {
      setIsGenerating(true);
      try {
          const char = await generateCharacterProfile("Create a completely random character.");
          if (char && profileId) {
              onCreateCharacter(
              profileId, 
                  char.name || "Unknown", 
                  char.archetype || "Adventurer", 
                  char.race || "Nord",
                  char.gender || "Male",
                  char
              );
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleImportText = async () => {
      if (!importText.trim()) return;
      setIsGenerating(true);
      try {
          const char = await generateCharacterProfile(importText, 'text_import');
          if (char && profileId) {
              onCreateCharacter(
              profileId, 
                  char.name || "Unknown", 
                  char.archetype || "Adventurer", 
                  char.race || "Nord",
                  char.gender || "Male",
                  char
              );
              setCreationMode('manual');
              setImportText('');
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const startChat = async () => {
      setCreationMode('chat');
      setIsChatting(true);
      setChatHistory([]);
      const intro = "Greetings, traveler. I am the Scribe. I shall guide your fate. Tell me, do you seek to wield the blade, the bow, or the arcane arts?";
      setChatHistory([{ role: 'model', parts: [{ text: intro }] }]);
  };

  const sendChatMessage = async () => {
      if (!chatInput.trim()) return;
      
      const userMsg = chatInput;
      setChatInput('');
      
      // We pass the *previous* history to the API because the SDK's sendMessage appends the new one.
      const historyForApi = [...chatHistory];
      
      const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text: userMsg }] }];
      setChatHistory(newHistory);
      setIsChatting(true);

      try {
          const response = await chatWithScribe(historyForApi, userMsg);
          
          if (response.includes('[[GENERATE_CHARACTER]]')) {
             // Trigger generation
             setIsGenerating(true);
             const cleanResponse = response.replace('[[GENERATE_CHARACTER]]', '').trim();
             const finalHistory = [...newHistory, { role: 'model' as const, parts: [{ text: cleanResponse }] }];
             setChatHistory(finalHistory);
             
             // Format history for the generator
             const conversationLog = finalHistory.map(msg => 
                `${msg.role === 'user' ? 'PLAYER' : 'SCRIBE'}: ${msg.parts[0].text}`
             ).join('\n\n');

             // Generate
             const char = await generateCharacterProfile(conversationLog, 'chat_result');
             if (char && profileId) {
                  onCreateCharacter(
                  profileId, 
                      char.name || "Unknown", 
                      char.archetype || "Adventurer", 
                      char.race || "Nord",
                      char.gender || "Male",
                      char
                  );
                  // Reset
                  setCreationMode('manual');
                  setChatHistory([]);
             }
             setIsGenerating(false);
          } else {
             setChatHistory([...newHistory, { role: 'model' as const, parts: [{ text: response }] }]);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsChatting(false);
      }
  };

  const displayedCharacters = profileId ? characters.filter(c => c.profileId === profileId) : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-skyrim-dark bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
      <div className="w-full max-w-4xl p-4 sm:p-8 bg-skyrim-paper border border-skyrim-gold shadow-2xl rounded-lg flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            
        <h1 className="text-2xl sm:text-3xl font-serif text-skyrim-gold text-center mb-4 sm:mb-6 border-b border-skyrim-border pb-3 sm:pb-4">
                Select Character
            </h1>
            
            {/* Main Content */}
        <div className="flex-1 overflow-y-auto mb-4 sm:mb-6 pr-0 sm:pr-2">
                <>
                       {creationMode === 'manual' ? (
                           <div className="grid gap-4">
                                {displayedCharacters.map(c => (
                    <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border transition-all group ${
                                      c.isDead 
                                        ? 'bg-red-950/30 border-red-900/50 opacity-75' 
                                        : 'bg-skyrim-paper/40 border-skyrim-border hover:border-skyrim-gold hover:bg-skyrim-paper/60'
                                    }`}>
                                      {/* Death Confirmation */}
                                      {confirmDeathCharacter === c.id ? (
                                        <div className="flex-1 flex flex-col gap-3">
                                          <span className="text-red-400 text-sm">Mark "{c.name}" as deceased?</span>
                                          <input
                                            type="text"
                                            placeholder="Cause of death (optional)"
                                            value={deathCause}
                                            onChange={e => setDeathCause(e.target.value)}
                                            className="bg-skyrim-paper/50 border border-red-900 p-2 rounded text-skyrim-text text-sm focus:outline-none"
                                          />
                                          <div className="flex gap-2">
                                            <button 
                                              onClick={() => {
                                                if (onMarkCharacterDead) onMarkCharacterDead(c.id, deathCause || 'Unknown');
                                                setConfirmDeathCharacter(null);
                                                setDeathCause('');
                                              }}
                                              className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-600"
                                            >
                                              Confirm Death
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setConfirmDeathCharacter(null);
                                                setDeathCause('');
                                              }}
                                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : confirmDeleteCharacter === c.id ? (
                                        /* Delete Confirmation */
                                        <div className="flex-1 flex items-center justify-between gap-3">
                                          <span className="text-red-400 text-sm">Permanently delete "{c.name}"?</span>
                                          <div className="flex gap-2">
                                            <button 
                                              onClick={() => {
                                                if (onDeleteCharacter) onDeleteCharacter(c.id);
                                                setConfirmDeleteCharacter(null);
                                              }}
                                              className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-600"
                                            >
                                              Delete
                                            </button>
                                            <button 
                                              onClick={() => setConfirmDeleteCharacter(null)}
                                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : editingCharacterId === c.id ? (
                                        <>
                                          <input 
                                            type="text" 
                                            value={editingName} 
                                            onChange={e => setEditingName(e.target.value)}
                                            className="flex-1 bg-skyrim-paper/50 border border-skyrim-gold p-2 rounded text-skyrim-text focus:outline-none"
                                            onKeyDown={e => {
                                              if (e.key === 'Enter' && onUpdateCharacter) {
                                                onUpdateCharacter(c.id, editingName);
                                                setEditingCharacterId(null);
                                              }
                                            }}
                                          />
                                          <button 
                                            onClick={() => {
                                              if (onUpdateCharacter) {
                                                onUpdateCharacter(c.id, editingName);
                                              }
                                              setEditingCharacterId(null);
                                            }}
                                            className="px-3 py-1 bg-skyrim-gold text-skyrim-dark rounded text-sm hover:bg-yellow-400"
                                          >
                                            Save
                                          </button>
                                          <button 
                                            onClick={() => setEditingCharacterId(null)}
                                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {c.isDead ? (
                                            /* Dead character - no play button */
                                            <div className="flex items-center gap-4 flex-1">
                                              <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center text-red-500">
                                                <Skull size={24} />
                                              </div>
                                              <div className="text-left">
                                                <span className="block text-xl font-serif text-gray-500 line-through">{c.name}</span>
                                                <span className="text-sm text-gray-600">Lvl {c.level} {c.gender} {c.race} {c.archetype}</span>
                                                <span className="block text-xs text-red-400/70 italic mt-1">
                                                  Died: {c.deathCause || 'Unknown cause'}
                                                  {c.deathDate && ` (${new Date(c.deathDate).toLocaleDateString()})`}
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            /* Living character - playable */
                                            <button 
                                              onClick={() => onSelectCharacter(c.id)} 
                                              className="flex items-center gap-4 flex-1 text-left"
                                            >
                                              <div className="w-12 h-12 bg-skyrim-gold/20 rounded-full flex items-center justify-center text-skyrim-gold group-hover:text-white group-hover:bg-skyrim-gold transition-colors">
                                                <Play size={24} fill="currentColor" />
                                              </div>
                                              <div className="text-left">
                                                <span className="block text-xl font-serif text-skyrim-gold group-hover:text-white transition-colors">{c.name}</span>
                                                <span className="text-sm text-gray-500">Lvl {c.level} {c.gender} {c.race} {c.archetype}</span>
                                              </div>
                                            </button>
                                          )}
                                          
                                          {/* Action buttons */}
                                          <div className="flex items-center justify-end flex-wrap gap-1">
                                            <button 
                                              onClick={() => {
                                                setEditingCharacterId(c.id);
                                                setEditingName(c.name);
                                              }}
                                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 py-1 bg-skyrim-gold/30 text-skyrim-gold hover:bg-skyrim-gold hover:text-skyrim-dark rounded text-xs transition-all"
                                            >
                                              Edit
                                            </button>
                                            
                                            {/* Death toggle */}
                                            {isFeatureEnabled('characterDeath') && onMarkCharacterDead && (
                                              c.isDead ? (
                                                <button 
                                                  onClick={() => onMarkCharacterDead(c.id, null)}
                                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 py-1 bg-green-900/50 text-green-400 hover:bg-green-700 hover:text-white rounded text-xs transition-all"
                                                  title="Resurrect character"
                                                >
                                                  <RotateCcw size={14} />
                                                </button>
                                              ) : (
                                                <button 
                                                  onClick={() => setConfirmDeathCharacter(c.id)}
                                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 py-1 bg-red-900/50 text-red-400 hover:bg-red-700 hover:text-white rounded text-xs transition-all"
                                                  title="Mark as dead"
                                                >
                                                  <Skull size={14} />
                                                </button>
                                              )
                                            )}
                                            
                                            {/* Delete */}
                                            {isFeatureEnabled('characterDeletion') && onDeleteCharacter && (
                                              <button 
                                                onClick={() => setConfirmDeleteCharacter(c.id)}
                                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 py-1 bg-red-900/50 text-red-400 hover:bg-red-700 hover:text-white rounded text-xs transition-all"
                                                title="Delete character"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                ))}
                                {displayedCharacters.length === 0 && (
                                    <div className="text-center text-gray-500 italic py-8">No characters found for this profile.</div>
                                )}
                           </div>
                       ) : creationMode === 'chat' ? (
                           // Chat Interface
                           <div className="flex flex-col h-[400px] bg-skyrim-paper/30 border border-skyrim-border rounded-lg p-4">
                               <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                   {chatHistory.map((msg, idx) => (
                                       <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                           <div className={`max-w-[80%] p-3 rounded-lg text-sm font-serif leading-relaxed ${msg.role === 'user' ? 'bg-skyrim-gold/20 text-skyrim-gold border border-skyrim-gold/30' : 'bg-gray-800 text-gray-300 border border-skyrim-border'}`}>
                                               {msg.parts[0].text}
                                           </div>
                                       </div>
                                   ))}
                                   {isGenerating && (
                                       <div className="flex justify-center p-4">
                                           <div className="flex items-center gap-2 text-skyrim-gold animate-pulse">
                                               <Sparkles size={16} /> Forging destiny...
                                           </div>
                                       </div>
                                   )}
                                   <div ref={chatBottomRef} />
                               </div>
                               <div className="flex gap-2">
                                   <input 
                                       className="flex-1 bg-skyrim-paper/50 border border-skyrim-border p-3 rounded text-skyrim-text focus:outline-none focus:border-skyrim-gold"
                                       placeholder="Reply to the Scribe..."
                                       value={chatInput}
                                       onChange={e => setChatInput(e.target.value)}
                                       onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                                       disabled={isGenerating}
                                       autoCapitalize="none"
                                       autoCorrect="off"
                                   />
                                   <button 
                                      onClick={sendChatMessage} 
                                      disabled={!chatInput.trim() || isGenerating}
                                      className="p-3 bg-skyrim-gold text-skyrim-dark rounded hover:bg-skyrim-goldHover disabled:opacity-50"
                                   >
                                       <Send size={20} />
                                   </button>
                               </div>
                           </div>
                       ) : (
                           // Import Interface
                           <div className="flex flex-col h-[400px] bg-skyrim-paper/30 border border-skyrim-border rounded-lg p-6">
                               <h4 className="text-skyrim-gold font-serif text-lg mb-2">Import from Text</h4>
                               <p className="text-skyrim-text text-sm mb-4">Paste your character backstory, description, or sheet below. The Scribe will interpret the details and fill in the blanks.</p>
                               <textarea 
                                 className="flex-1 bg-skyrim-paper/50 border border-skyrim-border p-4 rounded text-skyrim-text focus:outline-none focus:border-skyrim-gold mb-4 font-sans leading-relaxed resize-none"
                                    placeholder="My character is a Nord warrior named Ragnar who despises magic..."
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                    disabled={isGenerating}
                                 autoCapitalize="none"
                                 autoCorrect="off"
                               />
                               <button 
                                  onClick={handleImportText}
                                  disabled={!importText.trim() || isGenerating}
                                  className="w-full py-3 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-skyrim-goldHover disabled:opacity-50 flex items-center justify-center gap-2"
                               >
                                   {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                   Generate from Text
                               </button>
                           </div>
                       )}
                     </>
            </div>

            {/* Creation Forms */}
            <div className="border-t border-skyrim-border pt-4 sm:pt-6">
                <h3 className="text-sm text-skyrim-gold uppercase tracking-widest font-bold mb-4">
                Create New Character
                </h3>
                <>
                        {creationMode === 'manual' ? (
                             <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <input 
                          className="col-span-2 sm:col-span-2 bg-skyrim-paper/40 border border-skyrim-border p-3 rounded text-skyrim-text focus:outline-none focus:border-skyrim-gold"
                                        placeholder="Character Name"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                      autoCapitalize="none"
                                      autoCorrect="off"
                                    />
                                     <DropdownSelector 
                                        currentValue={newGender}
                                        onSelect={setNewGender}
                                        options={GENDER_OPTIONS}
                                        placeholder="Gender"
                                      />
                                    <DropdownSelector 
                                        currentValue={newRace}
                                        onSelect={setNewRace}
                                        options={RACE_OPTIONS}
                                        placeholder="Race"
                                      />
                                    <DropdownSelector 
                                        currentValue={newArchetype} 
                                        onSelect={setNewArchetype}
                                        options={ARCHETYPE_OPTIONS}
                                        placeholder="Archetype"
                                      />
                                </div>
                                
                      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap">
                        <button onClick={handleManualCreate} disabled={!profileId || !newName.trim()} className="w-full sm:flex-1 py-3 bg-skyrim-gold hover:bg-skyrim-goldHover text-skyrim-dark font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap px-4">
                                        <Plus size={20} /> Quick Create
                                    </button>
                                    
                        <button onClick={handleRandomizeFull} disabled={!profileId || isGenerating} className="w-full sm:flex-1 py-3 bg-skyrim-accent hover:bg-skyrim-accent/80 text-white font-bold rounded flex items-center justify-center gap-2 border border-skyrim-border whitespace-nowrap px-4 disabled:opacity-50">
                                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Dice5 size={20} />} 
                                        Full Random
                                    </button>

                        <button onClick={startChat} disabled={!profileId} className="w-full sm:flex-1 py-3 bg-skyrim-dark hover:bg-black text-skyrim-gold font-bold rounded flex items-center justify-center gap-2 border border-skyrim-gold whitespace-nowrap px-4 disabled:opacity-50">
                                        <MessageSquare size={20} /> Scribe Chat
                                    </button>

                        <button onClick={() => setCreationMode('import')} disabled={!profileId} className="w-full sm:flex-1 py-3 bg-skyrim-dark hover:bg-black text-gray-300 font-bold rounded flex items-center justify-center gap-2 border border-skyrim-border whitespace-nowrap px-4 disabled:opacity-50">
                                        <FileText size={20} /> Import Text
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <button onClick={() => setCreationMode('manual')} className="w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-skyrim-gold text-sm">
                                <ArrowLeft size={16} /> Return to Character List
                             </button>
                        )}
                      </>
            </div>

            {/* Logout */}
            <button onClick={onLogout} className="mt-2 text-xs text-red-500 hover:text-red-300 w-full text-center">
                &larr; Back to Login
            </button>
        </div>
    </div>
  );
};