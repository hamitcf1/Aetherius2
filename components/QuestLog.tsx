import React, { useState } from 'react';
import { CustomQuest, QuestStep } from '../types';
import { Plus, Trash2, CheckSquare, Square, MapPin, Flag, ArrowUpDown, Archive, Activity, XCircle, CheckCircle, Clock, Edit2, Save, X } from 'lucide-react';
import { SortSelector } from './GameFeatures';

const uniqueId = () => Math.random().toString(36).substr(2, 9);

interface QuestLogProps {
  quests: CustomQuest[];
  setQuests: (quests: CustomQuest[]) => void;
}

type SortOption = 'newest' | 'oldest' | 'title_az' | 'title_za';

export const QuestLog: React.FC<QuestLogProps> = ({ quests, setQuests }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
    const [newObjectivesText, setNewObjectivesText] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Sort options
  const sortOptions = [
    { id: 'newest', label: 'Date (Newest)', icon: '🕐' },
    { id: 'oldest', label: 'Date (Oldest)', icon: '🕐' },
    { id: 'title_az', label: 'Title (A-Z)', icon: '🔤' },
    { id: 'title_za', label: 'Title (Z-A)', icon: '🔤' }
  ];
  
  // Edit State
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
    const [editObjectivesText, setEditObjectivesText] = useState('');

  const addQuest = () => {
    if (!newTitle.trim()) return;

        const objectives: QuestStep[] = (newObjectivesText || '')
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
            .map(description => ({ id: uniqueId(), description, completed: false }));

    const quest: CustomQuest = {
      id: uniqueId(),
      characterId: '', // Handled by parent or ignored in local context
      title: newTitle,
      description: newDesc,
      location: newLocation,
      dueDate: newDueDate,
            objectives,
      status: 'active',
      createdAt: Date.now()
    };
    setQuests([quest, ...quests]);
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setNewDueDate('');
        setNewObjectivesText('');
    setIsAdding(false);
  };

    const cancelAdd = () => {
        setIsAdding(false);
        setNewTitle('');
        setNewDesc('');
        setNewLocation('');
        setNewDueDate('');
        setNewObjectivesText('');
    };

  const deleteQuest = (id: string) => {
    setQuests(quests.filter(q => q.id !== id));
  };

  const startEditing = (quest: CustomQuest) => {
      setEditingQuestId(quest.id);
      setEditDesc(quest.description);
      setEditLocation(quest.location || '');
      setEditDueDate(quest.dueDate || '');
            setEditObjectivesText((quest.objectives || []).map(o => o.description).join('\n'));
  };

  const saveEdit = (id: string) => {
      setQuests(quests.map(q => {
          if (q.id === id) {
                            const existingObjectives = q.objectives || [];
                            const nextLines = (editObjectivesText || '')
                                .split('\n')
                                .map(s => s.trim())
                                .filter(Boolean);

                            const nextObjectives: QuestStep[] = nextLines.map(line => {
                                const match = existingObjectives.find(o => o.description.trim().toLowerCase() === line.toLowerCase());
                                if (match) return match;
                                return { id: uniqueId(), description: line, completed: false };
                            });

                            return {
                                ...q,
                                description: editDesc,
                                location: editLocation,
                                dueDate: editDueDate,
                                objectives: nextObjectives
                            };
          }
          return q;
      }));
      setEditingQuestId(null);
  };

  const updateStatus = (id: string, status: 'active' | 'completed' | 'failed') => {
      setQuests(quests.map(q => {
          if (q.id === id) {
              return { 
                  ...q, 
                  status: status,
                  completedAt: (status === 'completed' || status === 'failed') ? Date.now() : undefined
              };
          }
          return q;
      }));
  };

  const addObjective = (questId: string, text: string) => {
      setQuests(quests.map(q => {
          if (q.id === questId) {
              return { ...q, objectives: [...q.objectives, { id: uniqueId(), description: text, completed: false }] };
          }
          return q;
      }));
  };
  
  const toggleObjective = (questId: string, objId: string) => {
      setQuests(quests.map(q => {
          if (q.id === questId) {
              return { 
                  ...q, 
                  objectives: q.objectives.map(o => o.id === objId ? { ...o, completed: !o.completed } : o)
              };
          }
          return q;
      }));
  };

  const deleteObjective = (questId: string, objId: string) => {
    setQuests(quests.map(q => {
        if (q.id === questId) {
            return {
                ...q,
                objectives: q.objectives.filter(o => o.id !== objId)
            };
        }
        return q;
    }));
  };

  const filteredQuests = quests.filter(q => {
      if (activeTab === 'active') return q.status === 'active';
      return q.status === 'completed' || q.status === 'failed';
  });

  const displayQuests = filteredQuests.sort((a, b) => {
      if (sortOption === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOption === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOption === 'title_az') return a.title.localeCompare(b.title);
      if (sortOption === 'title_za') return b.title.localeCompare(a.title);
      return 0;
  });

  return (
    <div className="max-w-4xl mx-auto pb-24">
       <div className="mb-8 p-6 bg-skyrim-paper border-y-4 border-skyrim-border text-center">
        <h1 className="text-4xl font-serif text-skyrim-gold mb-2">Personal Quest Log</h1>
        <p className="text-gray-500 font-sans text-sm">Chronicle your own deeds, separate from the Jarls' demands.</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-skyrim-border">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'active' ? 'border-skyrim-gold text-skyrim-gold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              <Activity size={18} /> Active
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'completed' ? 'border-skyrim-gold text-skyrim-gold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              <Archive size={18} /> History
          </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          {!isAdding ? (
              <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full md:w-auto flex-1 py-4 border-2 border-dashed border-skyrim-border hover:border-skyrim-gold text-skyrim-text hover:text-skyrim-gold transition-colors rounded flex items-center justify-center gap-2"
              >
                  <Plus size={20} />
                  <span>Inscribe New Quest</span>
              </button>
          ) : (
             <div className="hidden"></div>
          )}

          {!isAdding && quests.length > 0 && (
              <div className="flex items-center gap-2">
                  <SortSelector currentSort={sortOption} onSelect={(sort) => setSortOption(sort as SortOption)} options={sortOptions} />
              </div>
          )}
      </div>

      {isAdding && (
            <div className="mb-6 bg-skyrim-paper border border-skyrim-gold p-6 rounded shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="grid gap-4">
                    <input 
                        className="bg-skyrim-paper/30 border border-skyrim-border p-2 rounded text-lg font-serif text-skyrim-gold focus:outline-none focus:border-skyrim-gold"
                        placeholder="Quest Title"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                    />
                     <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            className="bg-skyrim-paper/30 border border-skyrim-border p-2 rounded flex-1 text-skyrim-text focus:outline-none"
                            placeholder="Location (Optional)"
                            value={newLocation}
                            onChange={e => setNewLocation(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                         <input 
                            type="text"
                            className="bg-skyrim-paper/30 border border-skyrim-border p-2 rounded flex-1 text-skyrim-text focus:outline-none"
                            placeholder="Due Date / Deadline (Optional)"
                            value={newDueDate}
                            onChange={e => setNewDueDate(e.target.value)}
                                     autoCapitalize="none"
                                     autoCorrect="off"
                        />
                     </div>
                    <textarea 
                        className="bg-skyrim-paper/30 border border-skyrim-border p-2 rounded text-skyrim-text h-24 focus:outline-none"
                        placeholder="Description..."
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                    />
                    <textarea 
                        className="bg-skyrim-paper/30 border border-skyrim-border p-2 rounded text-skyrim-text h-24 focus:outline-none font-sans"
                        placeholder="Objectives (one per line)..."
                        value={newObjectivesText}
                        onChange={e => setNewObjectivesText(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                    />
                    <div className="flex justify-end gap-3 mt-2">
                        <button onClick={cancelAdd} className="px-4 py-2 text-skyrim-text hover:text-white">Cancel</button>
                        <button onClick={addQuest} className="px-6 py-2 bg-skyrim-gold hover:bg-skyrim-goldHover text-skyrim-dark font-bold rounded">Create Quest</button>
                    </div>
                </div>
            </div>
      )}

      <div className="space-y-6">
        {displayQuests.map(quest => (
            <div key={quest.id} className={`bg-skyrim-paper/80 border ${quest.status === 'completed' ? 'border-green-900/40 opacity-70' : quest.status === 'failed' ? 'border-red-900/60 opacity-70' : 'border-skyrim-border'} rounded p-5 shadow-lg relative transition-all`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                             <h3 className={quest.status !== 'active' ? 'text-xl font-serif text-skyrim-text line-through' : 'text-xl font-serif text-skyrim-gold'}>
                                {quest.title}
                            </h3>
                            {quest.status === 'failed' && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded border border-red-700 uppercase font-bold">Failed</span>}
                            {quest.status === 'completed' && <span className="text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded border border-green-700 uppercase font-bold">Completed</span>}
                        </div>
                       
                        {editingQuestId === quest.id ? (
                             <div className="grid grid-cols-2 gap-2 mt-2 max-w-md">
                                 <input 
                                    className="bg-skyrim-paper/40 border border-skyrim-border rounded px-2 py-1 text-xs text-skyrim-text" 
                                    value={editLocation} 
                                    onChange={(e) => setEditLocation(e.target.value)} 
                                    placeholder="Location"
                                 />
                                 <input 
                                    className="bg-skyrim-paper/40 border border-skyrim-border rounded px-2 py-1 text-xs text-skyrim-text" 
                                    value={editDueDate} 
                                    onChange={(e) => setEditDueDate(e.target.value)} 
                                    placeholder="Due Date"
                                 />
                             </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 mt-1">
                                {quest.location && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide">
                                        <MapPin size={12} /> {quest.location}
                                    </div>
                                )}
                                {quest.dueDate && (
                                    <div className="flex items-center gap-1 text-xs text-red-400/70 uppercase tracking-wide">
                                        <Clock size={12} /> Due: {quest.dueDate}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {quest.status === 'active' ? (
                            <>
                                <button onClick={() => updateStatus(quest.id, 'completed')} className="p-2 text-green-500 hover:text-green-400 hover:bg-green-900/20 rounded border border-transparent hover:border-green-800" title="Complete Quest">
                                    <CheckCircle size={18} />
                                </button>
                                <button onClick={() => updateStatus(quest.id, 'failed')} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded border border-transparent hover:border-red-800" title="Fail Quest">
                                    <XCircle size={18} />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => updateStatus(quest.id, 'active')} className="px-3 py-1 text-xs uppercase font-bold border border-skyrim-border hover:border-skyrim-gold text-skyrim-text hover:text-skyrim-gold rounded">
                                Reactivate
                            </button>
                        )}
                        
                         {editingQuestId === quest.id ? (
                             <button onClick={() => saveEdit(quest.id)} className="text-green-500 hover:text-green-300 ml-2">
                                <Save size={18} />
                             </button>
                         ) : (
                             <button onClick={() => startEditing(quest)} className="text-gray-600 hover:text-skyrim-gold ml-2" title="Edit Quest">
                                <Edit2 size={18} />
                             </button>
                         )}

                        <button onClick={() => deleteQuest(quest.id)} className="text-gray-600 hover:text-red-500 ml-2">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                {editingQuestId === quest.id ? (
                    <div className="mb-4 grid gap-3">
                      <textarea 
                          className="w-full bg-skyrim-paper/40 border border-skyrim-border rounded p-2 text-skyrim-text font-sans text-sm h-24"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description..."
                          autoCapitalize="none"
                          autoCorrect="off"
                      />
                      <textarea
                          className="w-full bg-skyrim-paper/40 border border-skyrim-border rounded p-2 text-skyrim-text font-sans text-sm h-24"
                          value={editObjectivesText}
                          onChange={(e) => setEditObjectivesText(e.target.value)}
                          placeholder="Objectives (one per line)..."
                          autoCapitalize="none"
                          autoCorrect="off"
                      />
                    </div>
                ) : (
                    <p className="text-skyrim-text font-serif mb-4 text-sm whitespace-pre-wrap leading-relaxed">{quest.description}</p>
                )}
                
                <div className="bg-skyrim-paper/20 p-3 rounded">
                    <div className="space-y-2">
                        {(quest.objectives ?? []).map(obj => (
                            <div key={obj.id} className="flex items-start gap-3 group">
                                <button onClick={() => toggleObjective(quest.id, obj.id)} className="mt-1 text-skyrim-gold hover:text-white">
                                    {obj.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                                <span className={`flex-1 text-sm ${obj.completed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                                    {obj.description}
                                </span>
                                <button onClick={() => deleteObjective(quest.id, obj.id)} className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {quest.status === 'active' && (
                        <div className="mt-3 flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 bg-transparent border-b border-skyrim-border text-xs text-skyrim-text p-1 focus:outline-none focus:border-skyrim-gold placeholder-gray-600"
                                placeholder="Add objective..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addObjective(quest.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        ))}
        
        {displayQuests.length === 0 && !isAdding && (
            <div className="text-center py-12 text-gray-600 italic font-serif">
                No {activeTab === 'active' ? 'active' : 'archived'} quests found.
            </div>
        )}
      </div>
    </div>
  );
};