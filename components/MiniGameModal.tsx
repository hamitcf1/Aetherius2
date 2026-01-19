import React, { useState } from 'react';

interface MiniGameModalProps {
  open: boolean;
  missionId?: string | null;
  missionName?: string | null;
  onClose: (result?: { success: boolean; rewards?: any }) => void;
  showToast?: (msg: string, type?: string) => void;
}

const MiniGameModal: React.FC<MiniGameModalProps> = ({ open, missionId, missionName, onClose, showToast }) => {
  const [running, setRunning] = useState(false);

  if (!open) return null;

  const start = () => {
    setRunning(true);
    if (showToast) showToast('Mini-game started', 'info');
    // Simple placeholder: auto-resolve after short delay
    setTimeout(() => {
      setRunning(false);
      if (showToast) showToast('Mini-game completed: success!', 'success');
      onClose({ success: true, rewards: { gold: 200, xp: 150 } });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black/60 absolute inset-0" onClick={() => onClose({ success: false })}></div>
      <div className="bg-white rounded p-6 z-10 w-96">
        <h3 className="font-bold">Mini-Game: {missionName || missionId}</h3>
        <p className="text-sm text-gray-600 mt-2">A prototype interactive mission. This will be replaced with a full minigame (e.g., retro Doom-inspired challenge) in future iterations.</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button className="px-3 py-1 border rounded" onClick={() => onClose({ success: false })}>Cancel</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={start} disabled={running}>{running ? 'Running...' : 'Start'}</button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameModal;
