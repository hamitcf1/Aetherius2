import React from 'react';
import { render, screen } from '@testing-library/react';
import { getLanguageFlag } from '../services/localization';

describe('getLanguageFlag', () => {
  const origNavigator = global.navigator;

  afterEach(() => {
    // restore
    (global as any).navigator = origNavigator;
  });

  it('returns emoji on non-windows UA', () => {
    (global as any).navigator = { userAgent: 'Macintosh' } as any;
    const { container } = render(<div>{getLanguageFlag('en')}</div>);
    // emoji should be present and wrapped with an accessible name
    expect(container.textContent).toContain('🇬🇧');
    const el = container.querySelector('[role="img"]');
    expect(el && el.getAttribute('aria-label')).toContain('English');
  });

  it('returns SVG on Windows UA for en and tr', () => {
    (global as any).navigator = { userAgent: 'Windows NT 10.0' } as any;
    const { container } = render(<div>{getLanguageFlag('en')}</div>);
    expect(container.querySelector('svg')).toBeTruthy();

    const { container: c2 } = render(<div>{getLanguageFlag('tr')}</div>);
    expect(c2.querySelector('svg')).toBeTruthy();
  });
});