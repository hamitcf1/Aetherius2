import React, { useState, useMemo } from 'react';
import { Character, Milestone, Perk, InventoryItem, CustomQuest, JournalEntry, StoryChapter } from '../types';
import { ChevronDown, ChevronRight, User, Brain, ShieldBan, Zap, Map, Activity, Info, Heart, Droplets, BicepsFlexed, CheckCircle, Circle, Trash2, Plus, Star, LayoutList, Layers, Ghost, Sparkles, ScrollText, Download, Image as ImageIcon, Loader2, Moon, Apple, Shield, Sword, Swords, Calendar } from 'lucide-react';
import { generateCharacterProfileImage } from '../services/geminiService';
import { RestModal, EatModal, DrinkModal, type RestOptions } from './SurvivalModals';
import { formatSkyrimDateShort } from '../utils/skyrimCalendar';
import { getItemStats, shouldHaveStats } from '../services/itemStats';
import { DropdownSelector, getEasterEggName } from './GameFeatures';
import SpellsModal from './SpellsModal';

interface CharacterSheetProps {
  character: Character;
  updateCharacter: (field: keyof Character, value: any) => void;
  inventory: InventoryItem[];
  quests: CustomQuest[];
  journal: JournalEntry[];
  story: StoryChapter[];
  // Survival handlers
  onRest?: (options: RestOptions) => void;
  onEat?: (item: InventoryItem) => void;
  onDrink?: (item: InventoryItem) => void;
  hasCampingGear?: boolean;
  hasBedroll?: boolean;
  onRequestLevelUp?: () => void;
  onOpenPerkTree?: () => void;
}

const Section: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultOpen?: boolean 
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-4 border border-skyrim-border bg-skyrim-paper/50 rounded overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-skyrim-dark/40 hover:bg-skyrim-dark/60 transition-colors"
      >
        <div className="flex items-center gap-3 text-skyrim-gold font-serif text-lg">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={20} className="text-skyrim-text" /> : <ChevronRight size={20} className="text-skyrim-text" />}
      </button>
      
      {isOpen && (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  tooltip?: string;
}> = ({ label, value, onChange, placeholder, rows = 3, tooltip }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <label className="text-sm uppercase tracking-wider text-skyrim-text font-bold">{label}</label>
      {tooltip && (
        <div className="group relative flex items-center">
          <Info size={14} className="text-gray-500 hover:text-skyrim-gold cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-skyrim-paper/95 border border-skyrim-gold rounded text-xs text-skyrim-text shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-sans leading-relaxed">
            {tooltip}
            <div className="absolute left-2 -bottom-1 w-2 h-2 bg-black border-r border-b border-skyrim-gold transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
            className="w-full bg-skyrim-paper/40 border border-skyrim-border/60 rounded p-3 text-skyrim-text focus:border-skyrim-gold focus:ring-1 focus:ring-skyrim-gold/50 outline-none transition-all placeholder-gray-600 font-sans"
            autoCapitalize="none"
            autoCorrect="off"
      rows={rows}
      placeholder={placeholder}
    />
  </div>
);

const StatBar: React.FC<{
    label: string;
    value: number;
    color: string;
    icon: React.ReactNode;
    onChange: (val: number) => void;
}> = ({ label, value, color, icon, onChange }) => { 
    return (
        <div className="flex-1 min-w-0 group">
            <div className="flex justify-between text-xs uppercase mb-1 text-skyrim-text font-bold items-center">
                <span className="flex items-center gap-1 group-hover:text-skyrim-gold transition-colors">{icon} {label}</span>
                <input
                    type="number"
                    min="0"
                    max="600"
                    value={value}
                    onChange={(e) => {
                        let v = parseInt(e.target.value) || 0;
                        if (v < 0) v = 0;
                        if (v > 600) v = 600;
                        onChange(v);
                    }}
                    className="w-14 sm:w-16 bg-skyrim-paper/40 border border-skyrim-border rounded text-skyrim-text text-sm px-2 ml-2 focus:outline-none focus:border-skyrim-gold text-right tracking-widest"
                    style={{ height: 24, letterSpacing: '0.05em' }}
                />
            </div>
            <div
                className="relative h-2 bg-black rounded-full overflow-hidden border border-transparent group-hover:border-skyrim-border transition-colors cursor-pointer skyrim-bar-glow"
                onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = Math.max(0, Math.min(1, x / rect.width));
                    const newValue = Math.round(percent * 600);
                    onChange(newValue);
                }}
                onMouseDown={e => {
                    const bar = e.currentTarget as HTMLDivElement;
                    function onMove(ev: MouseEvent) {
                        const rect = bar.getBoundingClientRect();
                        const x = ev.clientX - rect.left;
                        const percent = Math.max(0, Math.min(1, x / rect.width));
                        const newValue = Math.round(percent * 600);
                        onChange(newValue);
                    }
                    function onUp() {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    }
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
                style={{
                    boxShadow: `${
                        color === 'bg-red-700' ? '0 0 48px 16px rgba(255,40,40,0.7), 0 0 96px 32px rgba(255,40,40,0.25)' :
                        color === 'bg-blue-600' ? '0 0 48px 16px rgba(80,180,255,0.7), 0 0 96px 32px rgba(80,180,255,0.25)' :
                        color === 'bg-green-600' ? '0 0 48px 16px rgba(80,255,120,0.7), 0 0 96px 32px rgba(80,255,120,0.25)' :
                        '0 0 48px 16px rgba(255,255,255,0.3), 0 0 96px 32px rgba(255,255,255,0.1)'
                    }`,
                    position: 'relative',
                    animation: 'skyrim-bar-glow-anim 2.5s ease-in-out infinite',
                }}
            >
                <div 
                    className={`absolute top-0 left-0 h-full ${color} transition-all duration-700 ease-out group-hover:brightness-125`} 
                    style={{ width: `${Math.max(0, Math.min(value / 6, 100))}%` }}
                ></div>
                <style>{`
                    @keyframes skyrim-bar-glow-anim {
                        0% { box-shadow: none; }
                        50% { box-shadow: 0 0 12px 6px rgba(192, 160, 98, 0.3); }
                        100% { box-shadow: none; }
                    }
                `}</style>
            </div>
        </div>
    );
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ 
  character, 
  updateCharacter,
  inventory,
  quests,
  journal,
  story,
  onRest,
  onEat,
  onDrink,
  hasCampingGear = false,
  hasBedroll = false,
  onRequestLevelUp,
  onOpenPerkTree
}) => {
  const [newMilestone, setNewMilestone] = useState('');
  const [newMilestoneLevel, setNewMilestoneLevel] = useState(1);
  const [newPerkName, setNewPerkName] = useState('');
  const [newPerkSkill, setNewPerkSkill] = useState(character.skills[0]?.name || 'Smithing');
  const [newPerkRank, setNewPerkRank] = useState(1);
  const [newPerkDesc, setNewPerkDesc] = useState('');
  const [perkSort, setPerkSort] = useState<'name' | 'skill'>('skill');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingProfileImage, setIsGeneratingProfileImage] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(false);
  
  // Survival modal states
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [eatModalOpen, setEatModalOpen] = useState(false);
  const [drinkModalOpen, setDrinkModalOpen] = useState(false);
  
  // Toggle for max stats section (character creation)
  const [showMaxStats, setShowMaxStats] = useState(false);

  // Calculate armor and damage from equipped items
  const equipmentStats = useMemo(() => {
    let armor = 0;
    let damage = 0;
    const equippedItems: InventoryItem[] = [];
    
    inventory.filter(i => i.equipped).forEach(item => {
      // Get stats from item, or fall back to itemStats service
      let itemArmor = item.armor;
      let itemDamage = item.damage;
      
      if ((itemArmor === undefined || itemDamage === undefined) && shouldHaveStats(item.type)) {
        const stats = getItemStats(item.name, item.type);
        if (itemArmor === undefined) itemArmor = stats.armor;
        if (itemDamage === undefined) itemDamage = stats.damage;
      }
      
      armor += itemArmor || 0;
      damage += itemDamage || 0;
      equippedItems.push(item);
    });
    
    return { armor, damage, equippedItems };
  }, [inventory]);

    const time = (character as any).time || { day: 1, hour: 8, minute: 0 };
    const needs = (character as any).needs || { hunger: 0, thirst: 0, fatigue: 0 };
    const dayNumber = Math.max(1, Number(time.day || 1));
    const fmtTime = `${String(Math.max(0, Math.min(23, Number(time.hour || 0)))).padStart(2, '0')}:${String(Math.max(0, Math.min(59, Number(time.minute || 0)))).padStart(2, '0')}`;
    const fmtDate = formatSkyrimDateShort(dayNumber);
    const clampNeed = (n: any) => Math.max(0, Math.min(100, Number(n || 0)));

  const addMilestone = () => {
      if (!newMilestone.trim()) return;
      const milestone: Milestone = {
          id: Math.random().toString(36).substr(2, 9),
          level: newMilestoneLevel,
          description: newMilestone,
          achieved: false
      };
      updateCharacter('milestones', [...(character.milestones || []), milestone]);
      setNewMilestone('');
  };

  const toggleMilestone = (id: string) => {
      const updated = (character.milestones || []).map(m => m.id === id ? { ...m, achieved: !m.achieved } : m);
      updateCharacter('milestones', updated);
  };

  const deleteMilestone = (id: string) => {
      const updated = (character.milestones || []).filter(m => m.id !== id);
      updateCharacter('milestones', updated);
  };

  const addPerk = () => {
      if (!newPerkName.trim()) return;
      const perk: Perk = {
          id: Math.random().toString(36).substr(2, 9),
          name: newPerkName,
          skill: newPerkSkill,
          rank: newPerkRank,
          description: newPerkDesc
      };
      updateCharacter('perks', [...(character.perks || []), perk]);
      setNewPerkName('');
      setNewPerkDesc('');
      setNewPerkRank(1);
  };

  const deletePerk = (id: string) => {
    updateCharacter('perks', (character.perks || []).filter(p => p.id !== id));
  };

  const updateSkill = (skillName: string, level: number) => {
      const updatedSkills = character.skills.map(s => s.name === skillName ? { ...s, level } : s);
      updateCharacter('skills', updatedSkills);
  };

  const handleGenerateProfileImage = async () => {
      setIsGeneratingProfileImage(true);
      try {
          const imageUrl = await generateCharacterProfileImage(
              character.name,
              character.race,
              character.gender,
              character.archetype
          );
          if (imageUrl) {
              updateCharacter('profileImage', imageUrl);
          }
      } catch (error) {
          console.error('Failed to generate profile image:', error);
      } finally {
          setIsGeneratingProfileImage(false);
      }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Theme Config
      const COLOR_BG = [20, 20, 20]; // Dark Grey
      const COLOR_TEXT = [220, 220, 220]; // White/Grey
      const COLOR_GOLD = [192, 160, 98]; // Skyrim Gold

    const drawBackground = () => {
        doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        // Border
        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.setLineWidth(0.5);
        doc.rect(margin/2, margin/2, pageWidth - margin, pageHeight - margin, 'S');
    };

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
            doc.addPage();
            drawBackground();
            yPos = margin + 10;
        }
    };

    const addSectionTitle = (title: string) => {
        checkPageBreak(20);
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.text(title.toUpperCase(), margin, yPos);
        // Underline
        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
        yPos += 12;
    };

    const addText = (text: string, fontSize = 10, isBold = false) => {
        if (!text) return;
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        const lines = doc.splitTextToSize(text, contentWidth);
        const height = lines.length * (fontSize * 0.5);
        checkPageBreak(height);
        doc.text(lines, margin, yPos);
        yPos += height + 4;
    };

    const addField = (label: string, value: string) => {
        if (!value) return;
        checkPageBreak(15);
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.text(label.toUpperCase(), margin, yPos);
        yPos += 5;
        addText(value);
        yPos += 2;
    };

    // --- GENERATION START ---
    
    // Page 1: Cover / Stats
    drawBackground();
    
    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.text(character.name, pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 25;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    const subtitle = `Level ${character.level} ${character.gender} ${character.race} ${character.archetype}`;
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Stats Box
    doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'S');
    const boxY = yPos + 12;
    const colWidth = contentWidth / 3;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(200, 50, 50); // Red
    doc.text(`HEALTH: ${character.stats.health}`, margin + (colWidth * 0.5), boxY, { align: 'center' });
    
    doc.setTextColor(50, 100, 200); // Blue
    doc.text(`MAGICKA: ${character.stats.magicka}`, margin + (colWidth * 1.5), boxY, { align: 'center' });
    
    doc.setTextColor(50, 150, 50); // Green
    doc.text(`STAMINA: ${character.stats.stamina}`, margin + (colWidth * 2.5), boxY, { align: 'center' });
    yPos += 45;

    addSectionTitle("Identity & Psychology");
    addField("Core Identity", character.identity);
    addField("Psychology", character.psychology);
    addField("Moral Code", character.moralCode);
    addField("Faction Allegiance", character.factionAllegiance);
    yPos += 5;

    addSectionTitle("Skills & Proficiencies");
    // List skills in 3 columns
    doc.setFontSize(9);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    const skills = character.skills.sort((a,b) => b.level - a.level);
    let skillY = yPos;
    for (let i = 0; i < skills.length; i++) {
        const x = margin + ((i % 3) * (contentWidth / 3));
        if (i > 0 && i % 3 === 0) skillY += 6;
        checkPageBreak(10);
        doc.text(`${skills[i].name}: ${skills[i].level}`, x, skillY);
    }
    yPos = skillY + 15;

    if (character.backstory) {
        addSectionTitle("Backstory");
        addText(character.backstory);
    }

    // Page: Inventory
    doc.addPage();
    drawBackground();
    yPos = margin + 10;
    
    addSectionTitle("Inventory");
    doc.setFontSize(12);
    doc.setTextColor(255, 215, 0);
    doc.text(`Gold Septims: ${character.gold}`, margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    inventory.forEach(item => {
        checkPageBreak(10);
        const itemText = `${item.name} (${item.type}) x${item.quantity}`;
        doc.text(itemText, margin, yPos);
        if (item.description) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`- ${item.description}`, margin + 5, yPos + 4);
            doc.setFontSize(10);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            yPos += 8;
        } else {
            yPos += 6;
        }
    });
    yPos += 10;

    // Page: Quests
    doc.addPage();
    drawBackground();
    yPos = margin + 10;
    addSectionTitle("Quest Log");
    quests.forEach(q => {
        checkPageBreak(25);
        const statusColor = q.status === 'completed' ? [100, 200, 100] : q.status === 'failed' ? [200, 100, 100] : COLOR_GOLD;
        doc.setFont('times', 'bold');
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`${q.title} [${q.status.toUpperCase()}]`, margin, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        addText(q.description || 'No description.');
        yPos += 5;
    });

    // Page: Story
    if (story.length > 0) {
        doc.addPage();
        drawBackground();
        yPos = margin + 10;
        addSectionTitle("The Chronicle");
        story.sort((a,b) => a.createdAt - b.createdAt).forEach(chapter => {
            checkPageBreak(40);
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
            doc.text(`${chapter.title} (${chapter.date})`, margin, yPos);
            yPos += 6;
            
            // Image placeholder logic could go here, but jsPDF image handling with CORS is complex.
            // Text only for robustness.
            addText(chapter.content);
            yPos += 10;
            doc.setDrawColor(50, 50, 50);
            doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
        });
    }

    // Page: Journal
    if (journal.length > 0) {
        doc.addPage();
        drawBackground();
        yPos = margin + 10;
        addSectionTitle("Personal Journal");
        journal.forEach(entry => {
            checkPageBreak(30);
            doc.setFont('times', 'italic');
            doc.setFontSize(11);
            doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
            doc.text(`${entry.date} - ${entry.title}`, margin, yPos);
            yPos += 6;
            addText(entry.content);
            yPos += 10;
        });
    }

      doc.save(`${character.name}_Full_Record.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderPerks = () => {
    const perks = [...(character.perks || [])];
    
    if (perkSort === 'skill') {
        const grouped: Record<string, Perk[]> = {};
        perks.forEach(p => {
            if (!grouped[p.skill]) grouped[p.skill] = [];
            grouped[p.skill].push(p);
        });
        
        const sortedSkills = Object.keys(grouped).sort();

        return (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {sortedSkills.map(skill => (
                    <div key={skill} className="relative pl-4 border-l-2 border-skyrim-border/50">
                        <h4 className="text-xs uppercase text-skyrim-gold font-bold mb-2 -ml-[21px] flex items-center gap-2">
                            <span className="bg-skyrim-dark p-1 border border-skyrim-gold rounded-full w-4 h-4 flex items-center justify-center shadow-lg shadow-black">
                                <div className="w-1.5 h-1.5 bg-skyrim-gold rounded-full"></div>
                            </span>
                            {skill}
                        </h4>
                        <div className="space-y-3">
                            {grouped[skill].sort((a,b) => a.rank - b.rank).map(perk => (
                                <div key={perk.id} className="relative bg-skyrim-paper/40 p-3 rounded border border-skyrim-border ml-2 group hover:border-skyrim-gold transition-colors">
                                    <div className="absolute top-1/2 -left-4 w-4 h-px bg-skyrim-border/50"></div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-gray-200 text-sm font-bold flex items-center gap-2">
                                                <Star size={12} fill={perk.rank > 1 ? "currentColor" : "none"} className="text-skyrim-gold" /> 
                                                {perk.name} <span className="text-xs text-gray-500 font-normal border border-skyrim-border px-1 rounded">Rank {perk.rank}</span>
                                            </div>
                                            {perk.description && <div className="text-xs text-gray-500 mt-1 italic leading-relaxed">{perk.description}</div>}
                                        </div>
                                        <button onClick={() => deletePerk(perk.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {perks.length === 0 && <div className="text-xs text-gray-600 italic">No perks learned.</div>}
            </div>
        );
    }

    const sorted = perks.sort((a, b) => a.name.localeCompare(b.name));
    return (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
             {sorted.map(perk => (
                 <div key={perk.id} className="flex justify-between items-center bg-skyrim-paper/40 p-3 rounded border border-skyrim-border group hover:border-skyrim-gold">
                     <div>
                         <div className="text-skyrim-gold text-sm font-bold flex items-center gap-2">
                             <Star size={12} className="text-skyrim-gold" /> {perk.name} 
                             <span className="text-xs text-gray-500 font-normal">({perk.skill} - Rank {perk.rank})</span>
                         </div>
                         {perk.description && <div className="text-xs text-gray-500 mt-1">{perk.description}</div>}
                     </div>
                     <button onClick={() => deletePerk(perk.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 size={14} />
                     </button>
                 </div>
             ))}
              {perks.length === 0 && <div className="text-xs text-gray-600 italic">No perks learned.</div>}
        </div>
    );
};

  return (
      <div className="max-w-4xl mx-auto pb-24">
            {/* ActionBar is now global; all main actions are in the ActionBar. */}
      <div id="character-sheet-content" className="p-4 bg-skyrim-dark"> 
          <div className="mb-8 p-6 bg-skyrim-paper border-y-4 border-skyrim-border text-center relative overflow-hidden">
            {character.profileImage && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={character.profileImage} 
                  alt={getEasterEggName(character.name)}
                  className="w-48 h-48 rounded-lg border-2 border-skyrim-gold object-cover shadow-[0_0_20px_rgba(192,160,98,0.3)]"
                />
              </div>
            )}
            <div className="relative z-10">
                <h1 className="text-4xl font-serif text-skyrim-gold mb-2">{getEasterEggName(character.name)}</h1>
                <p className="text-gray-500 font-sans text-sm uppercase tracking-widest">{character.gender} {character.race} {character.archetype} - Level {character.level}</p>
            </div>
          </div>

          {/* Level and Experience */}
            <div className="mb-6 bg-skyrim-paper/40 border border-skyrim-border p-4 rounded flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-skyrim-gold flex items-center justify-center bg-skyrim-paper relative shadow-[0_0_15px_rgba(192,160,98,0.2)]">
                  <span className="text-2xl font-serif text-skyrim-gold">{character.level}</span>
                  <div className="absolute -bottom-2 text-[10px] uppercase bg-black px-1 border border-skyrim-border rounded">Level</div>
                </div>
                <div className="flex flex-col">
                   <div className="text-xs text-skyrim-text uppercase tracking-widest mb-1">Experience</div>
                   <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={character.experience || 0}
                    onChange={(e) => updateCharacter('experience', parseInt(e.target.value))}
                    className="w-48 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer" 
                   />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateCharacter('level', Math.max(1, character.level - 1))} className="w-8 h-8 rounded border border-skyrim-border hover:border-skyrim-gold flex items-center justify-center">-</button>
                <button onClick={() => onRequestLevelUp ? onRequestLevelUp() : updateCharacter('level', character.level + 1)} className="w-8 h-8 rounded border border-skyrim-border hover:border-skyrim-gold flex items-center justify-center">+</button>
              </div>
            </div>

          {/* Max Stats Section (Toggleable - Character Creation) */}
          <div className="mb-6">
            <button 
              onClick={() => setShowMaxStats(!showMaxStats)}
              className="w-full flex items-center justify-between p-3 bg-skyrim-paper/40 rounded border border-skyrim-border hover:border-skyrim-gold/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <Activity size={14} className="text-skyrim-text" />
                <span className="text-gray-300 font-medium">Max Stats (Character Creation)</span>
                <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-skyrim-paper/40 rounded">
                  H:{character.stats.health} M:{character.stats.magicka} S:{character.stats.stamina}
                </span>
              </div>
              {showMaxStats ? <ChevronDown size={16} className="text-skyrim-text" /> : <ChevronRight size={16} className="text-skyrim-text" />}
            </button>
            
            {showMaxStats && (
              <div className="mt-2 p-4 bg-skyrim-paper/40 rounded border border-skyrim-border flex flex-col sm:flex-row gap-4">
                <StatBar 
                  label="Max Health" 
                  value={character.stats.health} 
                  color="bg-red-700" 
                  icon={<Heart size={12}/>} 
                  onChange={(v) => updateCharacter('stats', { ...character.stats, health: v })}
                />
                <StatBar 
                  label="Max Magicka" 
                  value={character.stats.magicka} 
                  color="bg-blue-600" 
                  icon={<Droplets size={12}/>} 
                  onChange={(v) => updateCharacter('stats', { ...character.stats, magicka: v })}
                />
                <StatBar 
                  label="Max Stamina" 
                  value={character.stats.stamina} 
                  color="bg-green-600" 
                  icon={<BicepsFlexed size={12}/>} 
                  onChange={(v) => updateCharacter('stats', { ...character.stats, stamina: v })}
                />
              </div>
            )}
          </div>

          {/* Perk Points Summary */}
          <div className="mb-4 p-3 bg-skyrim-paper/30 border border-skyrim-border rounded flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs text-skyrim-text uppercase">Perk Points</div>
              <div className="px-2 py-1 bg-skyrim-paper/30 border border-skyrim-border rounded text-skyrim-gold font-bold">{character.perkPoints || 0}</div>
            </div>
            <div>
              <button onClick={() => onOpenPerkTree ? onOpenPerkTree() : null} className="px-3 py-1 rounded border border-skyrim-border hover:border-skyrim-gold text-sm">Open Perk Tree</button>
            </div>
          </div>

          {/* Current Vitals (for Adventure) */}
          <div className="mb-6 p-4 bg-gradient-to-r from-red-950/30 via-skyrim-paper/40 to-blue-950/30 rounded border border-skyrim-border">
            <div className="text-xs uppercase tracking-widest text-skyrim-text font-bold mb-3">Current Vitals (Adventure)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Health */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-skyrim-text flex items-center gap-1">
                    <Heart size={12} className="text-red-500" /> Health
                  </span>
                  <span className="text-sm font-bold text-red-400">
                    {character.currentVitals?.currentHealth ?? character.stats.health} / {character.stats.health}
                  </span>
                </div>
                <div className="h-4 bg-skyrim-paper/60 rounded-full border border-red-900/50 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, ((character.currentVitals?.currentHealth ?? character.stats.health) / character.stats.health) * 100))}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
              </div>
              
              {/* Current Magicka */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-skyrim-text flex items-center gap-1">
                    <Droplets size={12} className="text-blue-500" /> Magicka
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {character.currentVitals?.currentMagicka ?? character.stats.magicka} / {character.stats.magicka}
                  </span>
                </div>
                <div className="h-4 bg-skyrim-paper/60 rounded-full border border-blue-900/50 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, ((character.currentVitals?.currentMagicka ?? character.stats.magicka) / character.stats.magicka) * 100))}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
              </div>
              
              {/* Current Stamina */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-skyrim-text flex items-center gap-1">
                    <BicepsFlexed size={12} className="text-green-500" /> Stamina
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    {character.currentVitals?.currentStamina ?? character.stats.stamina} / {character.stats.stamina}
                  </span>
                </div>
                <div className="h-4 bg-skyrim-paper/60 rounded-full border border-green-900/50 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-green-800 to-green-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, ((character.currentVitals?.currentStamina ?? character.stats.stamina) / character.stats.stamina) * 100))}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-3 text-center italic">
              Current vitals change during adventure. Rest or use potions to restore them.
            </p>
          </div>

          {/* Armor & Damage from Equipment */}
          <div className="mb-6 p-4 bg-skyrim-paper/40 rounded border border-skyrim-border">
            <div className="text-xs uppercase tracking-widest text-skyrim-text font-bold mb-3">Combat Stats (from Equipment)</div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded">
                <div className="p-2 rounded-full bg-blue-900/40 border border-blue-600/50">
                  <Shield size={20} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-skyrim-text uppercase">Armor Rating</div>
                  <div className="text-2xl font-bold text-blue-400">{equipmentStats.armor}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 p-3 bg-red-900/20 border border-red-700/30 rounded">
                <div className="p-2 rounded-full bg-red-900/40 border border-red-600/50">
                  <Swords size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="text-xs text-skyrim-text uppercase">Weapon Damage</div>
                  <div className="text-2xl font-bold text-red-400">{equipmentStats.damage}</div>
                </div>
              </div>
            </div>
            {equipmentStats.equippedItems.length > 0 && (
              <div className="mt-3 pt-3 border-t border-skyrim-border/30">
                <div className="text-xs text-gray-500 mb-2">Equipped:</div>
                <div className="flex flex-wrap gap-2">
                  {equipmentStats.equippedItems.map(item => (
                    <span 
                      key={item.id} 
                      className="text-xs px-2 py-1 bg-skyrim-gold/10 border border-skyrim-gold/30 text-skyrim-gold rounded"
                      title={`${item.armor ? `Armor: ${item.armor}` : ''} ${item.damage ? `Damage: ${item.damage}` : ''}`}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

                    <div className="mb-6 p-4 bg-skyrim-paper/40 rounded border border-skyrim-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="text-xs uppercase tracking-widest text-skyrim-text font-bold">In-Game Time</div>
                                <div className="text-skyrim-gold font-serif text-lg">{fmtTime}</div>
                                <div className="flex items-center gap-1.5 text-sm text-skyrim-text mt-1">
                                    <Calendar size={12} />
                                    <span>{fmtDate}</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 font-sans">
                                Hunger / Thirst / Fatigue (0 = good, 100 = bad)
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Hunger with Eat button */}
                            <div className="bg-skyrim-paper/30 border border-skyrim-border/60 rounded p-3">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-skyrim-text font-bold mb-2">
                                    <span>Hunger</span>
                                    <span className="text-skyrim-text">{clampNeed(needs.hunger)}</span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden border border-skyrim-border mb-2">
                                    <div
                                        className="h-full bg-orange-500/70"
                                        style={{ width: `${Math.max(0, Math.min(100, clampNeed(needs.hunger)))}%` }}
                                    />
                                </div>
                                {onEat && (
                                    <button 
                                        onClick={() => setEatModalOpen(true)}
                                        className="w-full py-1.5 text-xs bg-orange-900/50 hover:bg-orange-800/50 text-orange-200 rounded border border-orange-700/50 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Apple size={12} /> Eat
                                    </button>
                                )}
                            </div>

                            {/* Thirst with Drink button */}
                            <div className="bg-skyrim-paper/30 border border-skyrim-border/60 rounded p-3">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-skyrim-text font-bold mb-2">
                                    <span>Thirst</span>
                                    <span className="text-skyrim-text">{clampNeed(needs.thirst)}</span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden border border-skyrim-border mb-2">
                                    <div
                                        className="h-full bg-blue-500/70"
                                        style={{ width: `${Math.max(0, Math.min(100, clampNeed(needs.thirst)))}%` }}
                                    />
                                </div>
                                {onDrink && (
                                    <button 
                                        onClick={() => setDrinkModalOpen(true)}
                                        className="w-full py-1.5 text-xs bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 rounded border border-blue-700/50 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Droplets size={12} /> Drink
                                    </button>
                                )}
                            </div>

                            {/* Fatigue with Rest button */}
                            <div className="bg-skyrim-paper/30 border border-skyrim-border/60 rounded p-3">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-skyrim-text font-bold mb-2">
                                    <span>Fatigue</span>
                                    <span className="text-skyrim-text">{clampNeed(needs.fatigue)}</span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden border border-skyrim-border mb-2">
                                    <div
                                        className="h-full bg-purple-500/70"
                                        style={{ width: `${Math.max(0, Math.min(100, clampNeed(needs.fatigue)))}%` }}
                                    />
                                </div>
                                {onRest && (
                                    <button 
                                        onClick={() => setRestModalOpen(true)}
                                        className="w-full py-1.5 text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 rounded border border-purple-700/50 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Moon size={12} /> Rest
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

          {/* Survival Modals */}
          {onRest && (
            <RestModal
              open={restModalOpen}
              onClose={() => setRestModalOpen(false)}
              onRest={onRest}
              gold={character.gold || 0}
              hasCampingGear={hasCampingGear}
              hasBedroll={hasBedroll}
            />
          )}
          {onEat && (
            <EatModal
              open={eatModalOpen}
              onClose={() => setEatModalOpen(false)}
              onEat={onEat}
              foodItems={inventory}
            />
          )}
          {onDrink && (
            <DrinkModal
              open={drinkModalOpen}
              onClose={() => setDrinkModalOpen(false)}
              onDrink={onDrink}
              drinkItems={inventory}
            />
          )}

          <div className="flex justify-end mb-4">
            <button onClick={() => setSpellsOpen(true)} className="px-3 py-1 bg-blue-800 text-white rounded flex items-center gap-2">
              <Zap /> Spells
            </button>
          </div>

          <Section title="Identity & Psychology" icon={<User />} defaultOpen={true}>
             <div className="mb-4">
                 <label className="text-sm uppercase tracking-wider text-skyrim-text font-bold mb-2 block">Gender</label>
                 <DropdownSelector
                   currentValue={character.gender}
                   onSelect={(value) => updateCharacter('gender', value)}
                   options={[
                     { id: 'Male', label: 'Male', icon: '♂' },
                     { id: 'Female', label: 'Female', icon: '♀' }
                   ]}
                 />
             </div>
             <TextAreaField 
                label="Core Identity" 
                value={character.identity} 
                onChange={(v) => updateCharacter('identity', v)} 
                placeholder="Who are they at their core? A lost noble? A vengeful orphan?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextAreaField label="Psychology" value={character.psychology} onChange={(v) => updateCharacter('psychology', v)} placeholder="Mental state, personality quirks..." />
                <TextAreaField label="Moral Code" value={character.moralCode} onChange={(v) => updateCharacter('moralCode', v)} placeholder="Lines they will not cross..." />
            </div>
            <TextAreaField label="Breaking Point" value={character.breakingPoint} onChange={(v) => updateCharacter('breakingPoint', v)} placeholder="What finally makes them snap?" rows={2} />
          </Section>
          {spellsOpen && (
            <SpellsModal character={character} onClose={() => setSpellsOpen(false)} onLearn={() => {}} />
          )}
          
          <Section title="Talents & Skills" icon={<Sparkles />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <TextAreaField label="Talents" value={character.talents} onChange={(v) => updateCharacter('talents', v)} placeholder="Natural aptitudes (e.g., Keen eye, Steady hand)..." />
                 <TextAreaField label="Approach to Magic" value={character.magicApproach} onChange={(v) => updateCharacter('magicApproach', v)} placeholder="Shunned? Embraced? Only Restoration?" />
            </div>
          </Section>

          <Section title="Fears & Weaknesses" icon={<Ghost />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <TextAreaField label="Fears" value={character.fears} onChange={(v) => updateCharacter('fears', v)} placeholder="Spiders? Darkness? Failure?" />
                 <TextAreaField label="Weaknesses" value={character.weaknesses} onChange={(v) => updateCharacter('weaknesses', v)} placeholder="Physical or mental flaws..." />
            </div>
          </Section>

          <Section title="Evolution & Roleplay" icon={<Activity />}>
            <div className="space-y-6">
                <div className="bg-skyrim-paper/30 p-4 border border-skyrim-border/50 rounded mb-4">
                     <h3 className="flex items-center gap-2 text-skyrim-gold font-bold uppercase text-sm mb-2">
                        <ScrollText size={16}/> Roleplay Behavior
                     </h3>
                     <TextAreaField label="Forced Behavior" value={character.forcedBehavior} onChange={(v) => updateCharacter('forcedBehavior', v)} placeholder="Compulsive behaviors or rituals the user must enact..." />
                </div>

                <TextAreaField label="Long Term Evolution" value={character.longTermEvolution} onChange={(v) => updateCharacter('longTermEvolution', v)} placeholder="How should the character change over levels 1-50?" rows={4} />
                
                <div className="bg-skyrim-paper/30 p-4 rounded border border-skyrim-border">
                    <h3 className="text-skyrim-gold font-bold uppercase text-sm mb-3">Evolution Milestones</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="number" 
                            min="1" 
                            max="81" 
                            value={newMilestoneLevel} 
                            onChange={(e) => setNewMilestoneLevel(parseInt(e.target.value))}
                            className="w-16 bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-skyrim-text text-center"
                        />
                        <input 
                            type="text" 
                            placeholder="Milestone description (e.g., Become Arch-Mage)" 
                            value={newMilestone} 
                            onChange={(e) => setNewMilestone(e.target.value)}
                            className="flex-1 bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-skyrim-text"
                        />
                        <button onClick={addMilestone} className="px-3 bg-skyrim-gold text-skyrim-dark rounded font-bold hover:bg-skyrim-goldHover">
                            <Plus size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {(character.milestones || []).sort((a,b) => a.level - b.level).map(m => (
                            <div key={m.id} className="flex items-center gap-3 group">
                                 <span className="text-xs font-bold text-skyrim-gold w-12 text-right">Lvl {m.level}</span>
                                 <button onClick={() => toggleMilestone(m.id)} className="text-skyrim-text hover:text-skyrim-gold">
                                     {m.achieved ? <CheckCircle size={16} className="text-green-500" /> : <Circle size={16} />}
                                 </button>
                                 <span className={`flex-1 text-sm ${m.achieved ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{m.description}</span>
                                 <button onClick={() => deleteMilestone(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500">
                                     <Trash2 size={14} />
                                 </button>
                            </div>
                        ))}
                        {(character.milestones || []).length === 0 && <p className="text-xs text-gray-600 italic">No milestones set.</p>}
                    </div>
                </div>
            </div>
          </Section>
          
          <Section title="Skills & Perks" icon={<Zap />}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Skills List */}
                  <div className="space-y-3">
                      <h3 className="text-sm uppercase tracking-widest text-skyrim-gold border-b border-skyrim-border pb-2 mb-4">Skill Proficiency</h3>
                      <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2">
                          {character.skills.sort((a,b) => b.level - a.level).map(skill => (
                              <div key={skill.name} className="flex items-center gap-3 text-sm">
                                  <span className="w-28 text-skyrim-text font-serif">{skill.name}</span>
                                  <div className="flex-1 relative h-3 bg-black border border-skyrim-border rounded-sm">
                                      <div className="absolute top-0 left-0 h-full bg-skyrim-accent opacity-50" style={{ width: `${Math.min(skill.level, 100)}%` }}></div>
                                  </div>
                                  <input 
                                    type="number" 
                                    value={skill.level} 
                                    onChange={(e) => updateSkill(skill.name, parseInt(e.target.value))}
                                    className="w-12 bg-transparent text-right text-skyrim-gold font-bold focus:outline-none"
                                  />
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Perks Management */}
                  <div>
                       <div className="flex justify-between items-center mb-4 border-b border-skyrim-border pb-2">
                            <h3 className="text-sm uppercase tracking-widest text-skyrim-gold">Active Perks</h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPerkSort('name')} 
                                    className={`p-1 rounded ${perkSort === 'name' ? 'text-skyrim-gold bg-skyrim-gold/10' : 'text-gray-500 hover:text-gray-300'}`}
                                    title="Sort by Name"
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button 
                                    onClick={() => setPerkSort('skill')} 
                                    className={`p-1 rounded ${perkSort === 'skill' ? 'text-skyrim-gold bg-skyrim-gold/10' : 'text-gray-500 hover:text-gray-300'}`}
                                    title="Group by Skill"
                                >
                                    <Layers size={16} />
                                </button>
                            </div>
                       </div>

                       <div className="bg-skyrim-paper/20 p-4 rounded border border-skyrim-border/50 mb-4">
                           <div className="grid grid-cols-12 gap-2 mb-2">
                               <div className="col-span-8">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Perk Name</label>
                                    <input 
                                        className="w-full bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-sm text-skyrim-text focus:border-skyrim-gold focus:outline-none"
                                        placeholder="e.g. Juggernaut"
                                        value={newPerkName}
                                        onChange={(e) => setNewPerkName(e.target.value)}
                                    />
                               </div>
                               <div className="col-span-4">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Skill</label>
                                    <DropdownSelector
                                      currentValue={newPerkSkill}
                                      onSelect={setNewPerkSkill}
                                      options={character.skills.map(s => ({ id: s.name, label: s.name }))}
                                      placeholder="Select Skill"
                                    />
                               </div>
                           </div>
                           <div className="grid grid-cols-12 gap-2 mb-2">
                               <div className="col-span-3">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Rank</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="w-full bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-sm text-skyrim-text focus:border-skyrim-gold focus:outline-none"
                                        value={newPerkRank}
                                        onChange={(e) => setNewPerkRank(parseInt(e.target.value))}
                                    />
                               </div>
                               <div className="col-span-9">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">Description</label>
                                    <input 
                                        className="w-full bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-sm text-skyrim-text focus:border-skyrim-gold focus:outline-none"
                                        placeholder="Effect description..."
                                        value={newPerkDesc}
                                        onChange={(e) => setNewPerkDesc(e.target.value)}
                                    />
                               </div>
                           </div>
                           <button onClick={addPerk} className="w-full py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-skyrim-goldHover flex justify-center items-center gap-2 text-sm">
                               <Plus size={16}/> Add Perk
                           </button>
                       </div>
                       
                       {renderPerks()}
                  </div>
              </div>
          </Section>

          <Section title="Rules & Constraints" icon={<ShieldBan />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextAreaField label="What is Allowed" value={character.allowedActions} onChange={(v) => updateCharacter('allowedActions', v)} placeholder="Roleplay actions that are encouraged..." rows={5} />
                <TextAreaField label="What is NOT Allowed" value={character.forbiddenActions} onChange={(v) => updateCharacter('forbiddenActions', v)} placeholder="Fast travel? Looting dead bodies? Using healing potions?" rows={5} />
            </div>
          </Section>

          <Section title="Faction & Worldview" icon={<Map />}>
            <TextAreaField 
              label="Faction Allegiance" 
              value={character.factionAllegiance} 
              onChange={(v) => updateCharacter('factionAllegiance', v)} 
              placeholder="Imperial, Stormcloak, Companions, College..." 
              rows={2} 
              tooltip="Specify any groups your character is loyal to. Examples: The Imperial Legion, Stormcloaks, The Companions, College of Winterhold, Thieves Guild, Dark Brotherhood, The Blades, or verify neutrality."
            />
            <TextAreaField label="General Worldview" value={character.worldview} onChange={(v) => updateCharacter('worldview', v)} placeholder="Cynical, hopeful, nihilistic..." rows={3} />
            <TextAreaField label="Daedric Perception" value={character.daedricPerception} onChange={(v) => updateCharacter('daedricPerception', v)} placeholder="How do they view the Princes? Worship one? Hate all?" rows={3} />
          </Section>

          <Section title="Backstory" icon={<Brain />}>
            <TextAreaField 
                label="Full History" 
                value={character.backstory} 
                onChange={(v) => updateCharacter('backstory', v)} 
                placeholder="The complete tale leading up to Helgen..." 
                rows={10} 
                tooltip="This detailed backstory is crucial! The Game Master uses this to generate appropriate quests, events, and dialogue unique to your character's past."
            />
          </Section>
      </div>
    </div>
  );
};