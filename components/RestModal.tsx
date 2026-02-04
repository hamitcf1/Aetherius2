import React, { useState } from 'react';
import { audioService } from '../services/audioService';
import ModalWrapper from './ModalWrapper';
import { useLocalization } from '../services/localization';

interface Props {
  open: boolean;
  onClose: () => void;
  onRest: (minutes: number, recoverPercent: number) => void; // minutes to advance, percent of vitals to restore
  hasBedroll?: boolean;
}

export default function RestModal({ open, onClose, onRest, hasBedroll }: Props) {
  const { t } = useLocalization();
  const [hours, setHours] = useState<number>(8);
  const [option, setOption] = useState<'camp' | 'bed'>('camp');

  const maxHours = 24;

  const handleConfirm = () => {
    const minutes = Math.max(30, Math.min(hours * 60, maxHours * 60));
    const recoverPercent = option === 'bed' ? 0.9 : 0.5; // bed restores 90%, camp 50%
    onRest(minutes, recoverPercent);
    onClose();
  };

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-[420px] bg-skyrim-paper p-6 rounded border border-skyrim-border">
        <h3 className="text-lg font-bold text-skyrim-gold mb-2">{t('rest.title')}</h3>
        <p className="text-sm text-gray-200 mb-4">{t('rest.description')}</p>

        <div className="mb-4">
          <label className="text-xs text-skyrim-text">{t('rest.method')}</label>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setOption('camp')} className={`px-3 py-2 rounded ${option === 'camp' ? 'bg-skyrim-gold/10 border-skyrim-gold' : 'bg-skyrim-paper/40 border-skyrim-border text-skyrim-text'}`}>{t('rest.actions.camp')}</button>
            <button onClick={() => setOption('bed')} className={`px-3 py-2 rounded ${option === 'bed' ? 'bg-skyrim-gold/10 border-skyrim-gold' : 'bg-skyrim-paper/40 border-skyrim-border text-skyrim-text'}`} disabled={!hasBedroll}>{t('rest.actions.bed')}</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-skyrim-text">{t('rest.hours')}</label>
          <input type="range" min={1} max={24} value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full accent-skyrim-gold" />
          <div className="text-sm text-skyrim-text mt-1">{hours} {hours !== 1 ? t('rest.labels.hours') : t('rest.labels.hour')} ({hours * 60} {t('rest.labels.minutes')})</div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} data-sfx="button_click" className="px-4 py-2 rounded bg-transparent border border-skyrim-border text-sm">{t('rest.actions.cancel')}</button>
          <button onClick={handleConfirm} data-sfx="button_click" className="px-4 py-2 rounded bg-skyrim-gold text-black text-sm">{t('rest.actions.confirm')}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}
