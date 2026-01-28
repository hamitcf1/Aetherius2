import React, { useEffect, useMemo, useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { getBugReports, addBugReport, updateBugReport, removeBugReport, BugReport } from '../services/bugReportService';
import { X, Bug } from 'lucide-react';

export default function BugReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'tracking' | 'fixed'>('all');

  useEffect(() => {
    setReports(getBugReports());
  }, [isOpen]);

  const counts = useMemo(() => {
    const open = reports.filter(r => r.status === 'open').length;
    const tracking = reports.filter(r => r.status === 'tracking').length;
    const fixed = reports.filter(r => r.status === 'fixed').length;
    return { open, tracking, fixed };
  }, [reports]);

  const handleAdd = () => {
    if (!title.trim()) return;
    const r = addBugReport({ title: title.trim(), details: details.trim() });
    setReports(prev => [r, ...prev]);
    setTitle('');
    setDetails('');
  };

  const handleStatus = (id: string, status: 'open' | 'tracking' | 'fixed') => {
    const updated = updateBugReport(id, { status });
    if (updated) setReports(prev => prev.map(r => r.id === id ? updated : r));
  };

  const handleRemove = (id: string) => {
    if (removeBugReport(id)) setReports(prev => prev.filter(r => r.id !== id));
  };

  const visible = reports.filter(r => filter === 'all' ? true : r.status === filter);

  if (!isOpen) return null;

  return (
    <ModalWrapper open={isOpen} onClose={onClose}>
      <div className="max-w-2xl w-full bg-skyrim-paper rounded-lg border border-skyrim-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-skyrim-gold flex items-center gap-2"><Bug className="text-red-400" /> Bug Tracker</h3>
          <div className="text-sm text-skyrim-text">Open: <span className="text-red-300">{counts.open}</span> · Tracking: <span className="text-amber-300">{counts.tracking}</span> · Fixed: <span className="text-green-300">{counts.fixed}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short title" className="p-2 bg-stone-900 rounded border border-stone-700" />
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="p-2 bg-stone-900 rounded border border-stone-700">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="tracking">Tracking</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Steps to reproduce / notes (optional)" className="w-full p-2 bg-stone-900 rounded border border-stone-700 mb-3" rows={4} />
        <div className="flex gap-2 mb-4">
          <button onClick={handleAdd} className="px-3 py-2 bg-green-600 rounded text-white">Report Bug</button>
          <button onClick={() => { setTitle(''); setDetails(''); }} className="px-3 py-2 border rounded">Clear</button>
          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(reports)); }} className="ml-auto px-3 py-2 border rounded">Export</button>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {visible.length === 0 && (
            <div className="text-sm text-stone-400">No reports match this filter.</div>
          )}
          {visible.map(r => (
            <div key={r.id} className="p-3 rounded border border-stone-700 bg-stone-900/30">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-stone-300 mt-1">{r.details}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <select value={r.status} onChange={e => handleStatus(r.id, e.target.value as any)} className="p-1 bg-stone-800 rounded border border-stone-700 text-xs">
                    <option value="open">Open</option>
                    <option value="tracking">Tracking</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <button onClick={() => handleRemove(r.id)} className="text-xs text-red-400">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-right mt-4">
          <button onClick={onClose} className="px-3 py-2 border rounded">Close</button>
        </div>
      </div>
    </ModalWrapper>
  );
}
