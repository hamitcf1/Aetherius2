import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import BlacksmithModal from '../components/BlacksmithModal';
import { AppContext } from '../AppContext';

describe('Blacksmith — eligible items layout', () => {
  it('does not show per-item gold in the Eligible Items list and prevents horizontal scrolling', () => {
    const items = [
      { id: 'i1', name: 'Daedric Boots', type: 'apparel', upgradeLevel: 0, value: 30893659, quantity: 1 },
      { id: 'i2', name: 'Elven Sword', type: 'weapon', upgradeLevel: 5, value: 77221443, quantity: 1 },
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400 } as any);

    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={2400} setGold={() => {}} />
      </AppContext.Provider>
    );

    // Player gold (top-right) should still be visible
    expect(screen.getByText('2400')).toBeInTheDocument();

    // Find the Eligible Items container (heading -> sibling list)
    const heading = screen.getByText(/Eligible Items/i);
    const listContainer = heading.nextElementSibling as HTMLElement | null;
    expect(listContainer).toBeTruthy();

    // Ensure we disabled horizontal overflow via class
    expect(listContainer!.className).toMatch(/overflow-x-hidden/);

    // The eligible-items scroller must reserve a gutter so the vertical scrollbar does not overlap content
    expect(listContainer!.className).toMatch(/pr-10/);
    // scrollbar-gutter can appear as kebab-case in jsdom
    expect((listContainer! as HTMLElement).getAttribute('style') || '').toMatch(/(?:scrollbar-gutter|scrollbarGutter)\s*:\s*(?:'|")?stable both-edges(?:'|")?/);

    // The scroller should be RTL (so the thumb appears on the left) while children retain LTR
    expect(listContainer!.getAttribute('dir')).toBe('rtl');
    const firstBtn = within(listContainer!).getAllByRole('button')[0];
    expect(firstBtn.getAttribute('dir')).toBe('ltr');

    // Left column should now clip overflowing children and layout should have more breathing room
    const all = Array.from(document.querySelectorAll('[class]')) as Array<HTMLElement|SVGElement>;
    const classString = (el: any) => (typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '');
    const leftCol = all.find(e => classString(e).includes('md:min-w-[260px]')) as HTMLElement | undefined;
    expect(leftCol).toBeTruthy();
    expect(classString(leftCol).includes('overflow-hidden')).toBeTruthy();

    // And the scroller should carry our custom-scrollbar class so styling is applied
    expect(listContainer!.className).toMatch(/custom-scrollbar/);

    // Modal container should also reserve padding for its own scrollbar
    const modalRoot = all.find(e => classString(e).includes('max-w-[920px]')) as HTMLElement | undefined;
    expect(modalRoot).toBeTruthy();
    expect(classString(modalRoot || {}).includes('pr-6')).toBeTruthy();
    expect((modalRoot as any).getAttribute('style') || '').toMatch(/(?:scrollbar-gutter|scrollbarGutter)\s*:\s*(?:'|")?stable both-edges(?:'|")?/);

    // Details column should sit above the list to avoid visual overlap when an item is focused
    const detailsCol = all.find(e => classString(e).includes('md:col-span-3')) as HTMLElement | undefined;
    expect(detailsCol).toBeTruthy();
    expect(classString(detailsCol).includes('z-30')).toBeTruthy();

    // Select the first item so we can assert selected-card styling
    fireEvent.click(firstBtn);

    // Selected item should no longer create a large stacking context or use an aggressive scale
    const selectedBtn = within(listContainer!).getAllByRole('button').find(b => b.getAttribute('aria-pressed') === 'true');
    expect(selectedBtn).toBeTruthy();
    expect(classString(selectedBtn!).includes('relative')).toBeTruthy();
    expect(classString(selectedBtn!).includes('z-0')).toBeTruthy();
    expect(document.querySelectorAll('[class*=\"scale-105\"]').length).toBe(0);
    expect(document.querySelectorAll('[class*=\"scale-102\"]').length).toBeGreaterThan(0);

    // Modal should be wider so item names have room (prevent regressions)
    const allWithClass = Array.from(document.querySelectorAll('[class]')) as Array<HTMLElement|SVGElement>;
    expect(allWithClass.some(e => classString(e).includes('max-w-[920px]'))).toBeTruthy();
    expect(allWithClass.some(e => classString(e).includes('md:grid-cols-4'))).toBeTruthy();
    expect(allWithClass.some(e => classString(e).includes('md:min-w-[260px]'))).toBeTruthy();

    // Buttons should render but should NOT display per-item gold (no 'g' suffix values)
    const buttons = within(listContainer!).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // There should NOT be any gold-like string inside the eligible-items buttons
    buttons.forEach(btn => {
      expect(btn.textContent).not.toMatch(/\d+g/);
    });
  });

  it('supports category filtering and deterministic sorting in the Eligible Items list', () => {
    const items = [
      { id: 'w1', name: 'Alpha Sword', type: 'weapon', upgradeLevel: 0, value: 10, quantity: 1 },
      { id: 'a1', name: 'Beta Shield', type: 'apparel', upgradeLevel: 3, value: 10, quantity: 1 },
      { id: 'w2', name: 'Gamma Axe', type: 'weapon', upgradeLevel: 2, value: 10, quantity: 1 }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400 } as any);

    const { rerender } = render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={2400} setGold={() => {}} />
      </AppContext.Provider>
    );

    // Weapons filter should show only weapons
    const weaponsBtn = screen.getByTestId('filter-weapons');
    weaponsBtn && weaponsBtn.click();
    const visible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Beta Shield/i.test(t))).toBe(false);
    expect(visible.some(t => /Alpha Sword/i.test(t))).toBe(true);
    expect(visible.some(t => /Gamma Axe/i.test(t))).toBe(true);

    // Sorting: higher upgradeLevel weapons should appear before lower-level ones
    const allBtn = screen.getByTestId('filter-all');
    allBtn && allBtn.click();
    const allVisible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(allVisible.findIndex(t => /Gamma Axe/i.test(t))).toBeLessThan(allVisible.findIndex(t => /Alpha Sword/i.test(t)));
  });
});
