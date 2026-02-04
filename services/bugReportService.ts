export type BugReportStatus = 'open' | 'tracking' | 'fixed';

export interface BugReport {
  id: string;
  title: string;
  details?: string;
  status: BugReportStatus;
  reporter?: string;
  createdAt: number;
  updatedAt: number;
}

const KEY = 'aetherius_bug_reports_v1';

// Use a storage fallback for environments without `localStorage` (e.g., Node tests)
const _fallbackStorage = (() => {
  let _mem: Record<string, string> = {};
  return {
    getItem(key: string) {
      return _mem[key] ?? null;
    },
    setItem(key: string, value: string) {
      _mem[key] = value;
    },
    removeItem(key: string) {
      delete _mem[key];
    },
  } as Storage;
})();

const storage: Storage = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') ? localStorage : _fallbackStorage;

function read(): BugReport[] {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as BugReport[];
  } catch (e) {
    console.warn('Failed to read bug reports', e);
    return [];
  }
}

function write(reports: BugReport[]) {
  try {
    storage.setItem(KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('Failed to write bug reports', e);
  }
}

export function getBugReports(): BugReport[] {
  return read();
}

export function addBugReport(data: { title: string; details?: string; reporter?: string }): BugReport {
  const now = Date.now();
  const report: BugReport = {
    id: `bug_${now}_${Math.random().toString(36).slice(2,8)}`,
    title: data.title,
    details: data.details,
    reporter: data.reporter,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  const reports = read();
  reports.unshift(report);
  write(reports);
  return report;
}

export function updateBugReport(id: string, updates: Partial<BugReport>): BugReport | null {
  const reports = read();
  const idx = reports.findIndex(r => r.id === id);
  if (idx < 0) return null;
  const updated = { ...reports[idx], ...updates, updatedAt: Date.now() } as BugReport;
  reports[idx] = updated;
  write(reports);
  return updated;
}

export function removeBugReport(id: string): boolean {
  const reports = read();
  const filtered = reports.filter(r => r.id !== id);
  if (filtered.length === reports.length) return false;
  write(filtered);
  return true;
}

export function clearAllReports() {
  write([]);
}
