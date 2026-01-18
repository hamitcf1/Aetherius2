import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, EquipmentSlot } from '../types';
import { saveUserLoadout, loadUserLoadouts, deleteUserLoadout } from '../services/firestore';
import { Save, Trash2, Check, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface Loadout {
  id: string;
  name: string;
  mapping: Record<string, { slot?: EquipmentSlot }>;
  createdAt: number;
  cloudSynced?: boolean;
}

interface LoadoutManagerProps {
  items: InventoryItem[];
  characterId?: string | null;
  onApplyLoadout: (mapping: Record<string, { slot?: EquipmentSlot }>) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  compact?: boolean;
}

export const LoadoutManager: React.FC<LoadoutManagerProps> = ({
  items,
  characterId,
  onApplyLoadout,
  showToast,
  compact = false
}) => {
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [newLoadoutName, setNewLoadoutName] = useState('');
  const [syncingLoadouts, setSyncingLoadouts] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const loadoutKey = () => `aetherius:bonfire:loadouts:${characterId || 'global'}`;

  const getSavedLoadouts = (): Loadout[] => {
    try {
      return JSON.parse(localStorage.getItem(loadoutKey()) || '[]');
    } catch (e) {
      return [];
    }
  };

  // Load loadouts on mount and when characterId changes
  useEffect(() => {
    setLoadouts(getSavedLoadouts());
    
    // Try to fetch cloud loadouts and merge
    const uid = (window as any).aetheriusUtils?.userId;
    if (uid) {
      (async () => {
        try {
          const remote = await loadUserLoadouts(uid, characterId || undefined);
          if (Array.isArray(remote) && remote.length > 0) {
            const local = getSavedLoadouts();
            const merged = [...local];
            for (const r of remote) {
              if (!merged.find(m => m.id === r.id)) {
                merged.push({ ...r, cloudSynced: true } as Loadout);
              }
            }
            localStorage.setItem(loadoutKey(), JSON.stringify(merged));
            setLoadouts(merged);
          }
        } catch (e) {
          console.warn('Failed to fetch remote loadouts:', e);
        }
      })();
    }
  }, [characterId]);

  const saveLoadout = () => {
    if (!newLoadoutName.trim()) {
      showToast?.('Please enter a loadout name', 'warning');
      return;
    }

    const mapping: Record<string, { slot?: EquipmentSlot }> = {};
    items.forEach(it => {
      if (it.equipped) mapping[it.id] = { slot: it.slot };
    });

    const newLoadout: Loadout = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: newLoadoutName.trim(),
      mapping,
      createdAt: Date.now(),
      cloudSynced: false
    };

    const list = [...loadouts, newLoadout];
    localStorage.setItem(loadoutKey(), JSON.stringify(list));
    setLoadouts(list);
    setNewLoadoutName('');
    showToast?.('Loadout saved locally. Syncing to cloud...', 'info');

    // Attempt cloud sync
    const uid = (window as any).aetheriusUtils?.userId;
    if (uid) {
      setSyncingLoadouts(s => [...s, newLoadout.id]);
      saveUserLoadout(uid, { ...newLoadout, characterId })
        .then(() => {
          const updated = getSavedLoadouts().map(l => 
            l.id === newLoadout.id ? { ...l, cloudSynced: true } : l
          );
          localStorage.setItem(loadoutKey(), JSON.stringify(updated));
          setLoadouts(updated);
          setSyncingLoadouts(s => s.filter(id => id !== newLoadout.id));
          showToast?.('Loadout synced to cloud.', 'success');
        })
        .catch(err => {
          console.warn('Could not sync loadout to Firestore:', err);
          setSyncingLoadouts(s => s.filter(id => id !== newLoadout.id));
          showToast?.('Failed to sync loadout to cloud. You can retry later.', 'warning');
        });
    }
  };

  const applyLoadout = (loadout: Loadout) => {
    onApplyLoadout(loadout.mapping);
    showToast?.(`Applied loadout: ${loadout.name}`, 'success');
  };

  const removeLoadout = (loadoutId: string) => {
    const loadout = loadouts.find(l => l.id === loadoutId);
    const updated = loadouts.filter(l => l.id !== loadoutId);
    localStorage.setItem(loadoutKey(), JSON.stringify(updated));
    setLoadouts(updated);
    showToast?.('Loadout removed.', 'info');

    // Try to remove from cloud
    const uid = (window as any).aetheriusUtils?.userId;
    if (uid && loadout?.id) {
      deleteUserLoadout(uid, loadout.id).catch(err => 
        console.warn('Failed to delete remote loadout', err)
      );
    }
  };

  const retrySyncLoadout = (loadoutId: string) => {
    const uid = (window as any).aetheriusUtils?.userId;
    if (!uid) {
      showToast?.('Not logged in; cannot sync to cloud.', 'warning');
      return;
    }

    const loadout = loadouts.find(l => l.id === loadoutId);
    if (!loadout) return;

    setSyncingLoadouts(s => [...s, loadoutId]);
    saveUserLoadout(uid, { ...loadout, characterId })
      .then(() => {
        const updated = loadouts.map(l => 
          l.id === loadoutId ? { ...l, cloudSynced: true } : l
        );
        localStorage.setItem(loadoutKey(), JSON.stringify(updated));
        setLoadouts(updated);
        setSyncingLoadouts(s => s.filter(id => id !== loadoutId));
        showToast?.('Loadout synced to cloud.', 'success');
      })
      .catch(err => {
        console.warn('Retry sync failed:', err);
        setSyncingLoadouts(s => s.filter(id => id !== loadoutId));
        showToast?.('Retry to sync loadout failed.', 'error');
      });
  };

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full px-3 py-2 text-sm bg-stone-800/60 border border-stone-700 rounded text-stone-300 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
      >
        <Save size={14} />
        <span>Loadouts ({loadouts.length})</span>
      </button>
    );
  }

  return (
    <div className="bg-stone-900/40 border border-stone-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-stone-300 flex items-center gap-2">
          <Save size={14} />
          Equipment Loadouts
        </h4>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-stone-500 hover:text-stone-300"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Save new loadout */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newLoadoutName}
          onChange={(e) => setNewLoadoutName(e.target.value)}
          placeholder="Loadout name..."
          className="flex-1 px-2 py-1.5 text-sm bg-stone-800 border border-stone-600 rounded text-stone-200 placeholder-stone-500"
          onKeyDown={(e) => e.key === 'Enter' && saveLoadout()}
        />
        <button
          onClick={saveLoadout}
          disabled={!newLoadoutName.trim()}
          className="px-3 py-1.5 text-sm bg-green-700 hover:bg-green-600 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded transition-colors"
        >
          Save
        </button>
      </div>

      {/* Loadout list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {loadouts.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-2">No saved loadouts</p>
        ) : (
          loadouts.map(loadout => (
            <div
              key={loadout.id}
              className="flex items-center justify-between p-2 bg-stone-800/60 border border-stone-700 rounded"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-200 truncate">{loadout.name}</span>
                  {loadout.cloudSynced ? (
                    <Cloud size={12} className="text-green-400 flex-shrink-0" title="Synced to cloud" />
                  ) : (
                    <CloudOff size={12} className="text-yellow-400 flex-shrink-0" title="Not synced" />
                  )}
                </div>
                <div className="text-[10px] text-stone-500">
                  {new Date(loadout.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!loadout.cloudSynced && (
                  syncingLoadouts.includes(loadout.id) ? (
                    <div className="w-5 h-5 flex items-center justify-center">
                      <RefreshCw size={12} className="text-yellow-400 animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={() => retrySyncLoadout(loadout.id)}
                      title="Retry sync"
                      className="p-1 text-yellow-400 hover:text-yellow-300"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )
                )}
                <button
                  onClick={() => applyLoadout(loadout)}
                  title="Apply loadout"
                  className="p-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => removeLoadout(loadout.id)}
                  title="Delete loadout"
                  className="p-1.5 bg-red-700/60 hover:bg-red-600 text-white rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoadoutManager;
