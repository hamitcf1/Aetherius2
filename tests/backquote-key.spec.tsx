import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';

function TestBackquoteToggle() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const kc = (e as any).keyCode || (e as any).which;
      const isBackquote = e.code === 'Backquote' || e.key === '`' || e.key === '~' || kc === 192;
      if (!isBackquote) return;
      setOpen(prev => !prev);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  return <div>{open ? 'OPEN' : 'CLOSED'}</div>;
}

describe('Backquote toggle', () => {
  it('toggles on backquote keydown', async () => {
    render(<TestBackquoteToggle />);
    expect(screen.getByText('CLOSED')).toBeTruthy();

    // dispatch backquote key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote' }));
    expect(await screen.findByText('OPEN')).toBeTruthy();

    // dispatch again to close
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote' }));
    expect(await screen.findByText('CLOSED')).toBeTruthy();
  });

  it('toggles on é keydown (AZERTY layout)', async () => {
    render(<TestBackquoteToggle />);
    expect(screen.getByText('CLOSED')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'é', code: 'Backquote' }));
    expect(await screen.findByText('OPEN')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'é', code: 'Backquote' }));
    expect(await screen.findByText('CLOSED')).toBeTruthy();
  });

  it('toggles on ² keydown (some layouts)', async () => {
    render(<TestBackquoteToggle />);
    expect(screen.getByText('CLOSED')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '²', code: 'Backquote' }));
    expect(await screen.findByText('OPEN')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '²', code: 'Backquote' }));
    expect(await screen.findByText('CLOSED')).toBeTruthy();
  });
});