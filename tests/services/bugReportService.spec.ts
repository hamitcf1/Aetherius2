import { describe, it, expect, beforeEach } from 'vitest';
import { getBugReports, addBugReport, updateBugReport, removeBugReport, clearAllReports } from '../../services/bugReportService';

beforeEach(() => clearAllReports());

describe('bugReportService', () => {
  it('adds and retrieves reports', () => {
    expect(getBugReports().length).toBe(0);
    const r = addBugReport({ title: 'Test bug', details: 'Steps' });
    const list = getBugReports();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(r.id);
  });

  it('updates report status', () => {
    const r = addBugReport({ title: 'T2' });
    const u = updateBugReport(r.id, { status: 'tracking' as any });
    expect(u).toBeTruthy();
    const list = getBugReports();
    expect(list[0].status).toBe('tracking');
  });

  it('removes a report', () => {
    const r = addBugReport({ title: 'T3' });
    expect(getBugReports().length).toBe(1);
    const ok = removeBugReport(r.id);
    expect(ok).toBe(true);
    expect(getBugReports().length).toBe(0);
  });
});
