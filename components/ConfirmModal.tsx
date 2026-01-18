import React from 'react';
import ModalWrapper from './ModalWrapper';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title = 'Confirm', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) => {
  return (
    <ModalWrapper open={open} onClose={onCancel} preventOutsideClose>
      <div className="w-full max-w-sm bg-skyrim-paper p-4 rounded border border-skyrim-border">
        <div className="mb-3 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-700' : 'bg-amber-600'}`}> 
            <span className="text-white font-bold">{danger ? '!' : '?'}</span>
          </div>
          <div>
            <div className="font-bold text-lg text-skyrim-gold">{title}</div>
            {description && <div className="text-sm text-skyrim-text/80 mt-1">{description}</div>}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-2 rounded border border-skyrim-border bg-skyrim-paper/40">{cancelLabel}</button>
          <button onClick={onConfirm} className={`px-3 py-2 rounded font-bold ${danger ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'}`}>{confirmLabel}</button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmModal;
