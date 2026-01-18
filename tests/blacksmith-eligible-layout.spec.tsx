import React from 'react';
import { render, screen, within, cleanup, fireEvent, act } from '@testing-library/react';
import BlacksmithModal from '../components/BlacksmithModal';
import { vi } from 'vitest';
import { AppContext } from '../AppContext';

// Helper to check for class substrings (tailwind)
const classString = (el: HTMLElement) => (el.className || '').toString();

afterEach(cleanup);

describe('Blacksmith — eligible items layout', () => {
  it('does not show per-item gold in the Eligible Items list and prevents horizontal scrolling', () => {
    // We create a mock item
    const items = [
      { id: 'i1', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 16, quantity: 1, upgradeLevel: 0 },
      { id: 'i2', characterId: 'c1', name: 'Steel Shield', type: 'apparel', armor: 10, value: 50, quantity: 1, upgradeLevel: 0 }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400 } as any);

    const { unmount } = render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={2400} setGold={() => {}} />
      </AppContext.Provider>
    );

    // Player gold (top-right) should still be visible
    expect(screen.getByText('2400')).toBeInTheDocument();

    // Find the Eligible Items container
    const heading = screen.getByText(/Eligible Items/i);
    // Locate the scroll container via robust traversal (column -> custom-scrollbar)
    const column = heading.closest('div.overflow-hidden');
    const listContainer = column?.querySelector('.custom-scrollbar') as HTMLElement;
    expect(listContainer).toBeTruthy();

    const all = Array.from(document.querySelectorAll('*')) as  HTMLElement[];
    const leftCol = all.find(e => classString(e).includes('md:col-span-1')) as HTMLElement | undefined;
    expect(leftCol).toBeTruthy();
    expect(classString(leftCol!).includes('overflow-hidden')).toBeTruthy();

    // And the scroller should carry our custom-scrollbar class so styling is applied
    expect(listContainer!.className).toMatch(/custom-scrollbar/);

    // Modal container should also reserve padding for its own scrollbar
    const modalRoot = all.find(e => classString(e).includes('max-w-[920px]')) as HTMLElement | undefined;
    expect(modalRoot).toBeTruthy();
    // expect(classString(modalRoot || {}).includes('pr-6')).toBeTruthy(); // Checks exact padding might be brittle if changed
    expect((modalRoot as any).getAttribute('style') || '').toMatch(/(?:scrollbar-gutter|scrollbarGutter)\s*:\s*(?:'|")?stable both-edges(?:'|")?/);

    // Select the first item so we can assert selected-card styling
    const firstBtn = within(listContainer!).getAllByRole('button')[0];
    fireEvent.click(firstBtn);

    // Selected item should no longer create a large stacking context or use an aggressive scale
    const selectedBtn = within(listContainer!).getAllByRole('button').find(b => b.getAttribute('aria-pressed') === 'true');
    expect(selectedBtn).toBeTruthy();
    expect(classString(selectedBtn!).includes('relative')).toBeTruthy();
    expect(classString(selectedBtn!).includes('z-0')).toBeTruthy();
    expect(document.querySelectorAll('[class*="scale-105"]').length).toBe(0);

    // Confirm and Cancel buttons should be present and visible in the modal footer
    const confirm = screen.getByRole('button', { name: /Confirm Upgrade/i });
    const cancel = screen.getByRole('button', { name: /Cancel/i });
    expect(confirm).toBeTruthy();
    expect(cancel).toBeTruthy();
    // They must be visible to the user (not hidden or clipped)
    expect(confirm).toBeVisible();
    expect(cancel).toBeVisible();

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
      { id: 'w1', characterId: 'c1', name: 'Alpha Sword', type: 'weapon', upgradeLevel: 0, value: 10, quantity: 1 },
      { id: 'a1', characterId: 'c1', name: 'Beta Shield', type: 'apparel', upgradeLevel: 3, value: 10, quantity: 1 },
      { id: 'w2', characterId: 'c1', name: 'Gamma Axe', type: 'weapon', upgradeLevel: 2, value: 10, quantity: 1 }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400 } as any);

    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={2400} setGold={() => {}} />
      </AppContext.Provider>
    );

    // Weapons filter should show only weapons
    const weaponsBtn = screen.getByTestId('filter-weapons');
    fireEvent.click(weaponsBtn);
    
    const visible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Beta Shield/i.test(t))).toBe(false);
    expect(visible.some(t => /Alpha Sword/i.test(t))).toBe(true);
    expect(visible.some(t => /Gamma Axe/i.test(t))).toBe(true);

    // Sorting: higher upgradeLevel weapons should appear before lower-level ones
    // Gamma Axe (lvl 2) should be before Alpha Sword (lvl 0)
    expect(visible.findIndex(t => /Gamma Axe/i.test(t))).toBeLessThan(visible.findIndex(t => /Alpha Sword/i.test(t)));

    // Reset to All
    const allBtn = screen.getByTestId('filter-all');
    fireEvent.click(allBtn);
    
    // Beta Shield (apparel) should reappear
    const allVisible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(allVisible.some(t => /Beta Shield/i.test(t))).toBe(true);
  });
});
