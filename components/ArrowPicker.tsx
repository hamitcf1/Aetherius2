import React from 'react';
import { createPortal } from 'react-dom';

interface ArrowPickerProps {
  open: boolean;
  onClose: () => void;
  onChoose: (arrowId?: string) => void;
}

export const ArrowPicker: React.FC<ArrowPickerProps> = ({ open, onClose, onChoose }) => {
  if (!open) return null;

  return createPortal(
    <div data-testid="arrow-picker-portal" className="fixed inset-0 flex items-center justify-center pointer-events-auto" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-stone-900 border border-stone-700 rounded-lg p-4 w-[360px] max-w-[95%] overflow-auto shadow-lg" style={{ zIndex: 10000, maxHeight: '80vh' }}>
        <h4 className="text-md font-bold mb-2">Choose Arrow Type</h4>
        <p className="text-xs text-stone-400 mb-3">Select an arrow to enhance your next shot (consumes one).</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 bg-red-700 rounded text-white" onClick={() => onChoose('fire_arrows')}>🔥 Fire</button>
          <button className="p-2 bg-sky-700 rounded text-white" onClick={() => onChoose('ice_arrows')}>❄️ Ice</button>
          <button className="p-2 bg-indigo-700 rounded text-white" onClick={() => onChoose('shock_arrows')}>⚡ Shock</button>
          <button className="p-2 bg-violet-700 rounded text-white" onClick={() => onChoose('paralyze_arrows')}>🪤 Paralyze</button>
          <button className="p-2 bg-amber-700 rounded text-white col-span-2" onClick={() => onChoose('allycall_arrows')}>🤝 Command Ally</button>
          <button className="p-2 bg-stone-700 rounded text-white col-span-2" onClick={() => onChoose(undefined)}>➖ No special arrow</button>
        </div>
        <div className="text-right mt-3">
          <button className="text-xs text-stone-400 hover:text-stone-200" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ArrowPicker;
