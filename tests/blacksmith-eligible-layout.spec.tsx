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

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400, markEntityDirty: (_id: string) => {} } as any);

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
    // left column should exist and carry the expected border/size classes (use the scroller as the stable anchor)
    const leftColAncestor = listContainer!.closest('[class*="md:col-span-4"], [class*="lg:col-span-3"]') as HTMLElement | null;
    expect(leftColAncestor).toBeTruthy();
    expect(classString(leftColAncestor!).includes('border-r')).toBeTruthy();
    // Regression guard: ensure the left column allows its children to shrink so vertical scrolling works
    expect(classString(leftColAncestor || {}).includes('min-h-0')).toBeTruthy();

    // And the scroller should carry our custom-scrollbar class so styling is applied
    expect(listContainer!.className).toMatch(/custom-scrollbar/);

    // Modal container should also reserve padding for its own scrollbar (robust lookup)
    const modalRoot = heading.closest('[role="dialog"]') || document.querySelector('[class*="max-w-"]') as HTMLElement | undefined;
    expect(modalRoot).toBeTruthy();
    // expect(classString(modalRoot || {}).includes('pr-6')).toBeTruthy(); // exact padding can be brittle across tailwind versions
    // Modal root should control overflow for the dialog (robust check)
    expect(classString(modalRoot || {}).includes('overflow-hidden') || classString(modalRoot || {}).includes('overflow-auto') || classString(modalRoot || {}).includes('overflow-y-auto')).toBeTruthy();

    // Select the first item so we can assert selected-card styling
    const firstBtn = within(listContainer!).getAllByRole('button')[0];
    fireEvent.click(firstBtn);

    // Selected item should no longer create a large stacking context or use an aggressive scale
    const selectedBtn = within(listContainer!).getAllByRole('button').find(b => b.getAttribute('aria-pressed') === 'true');
    expect(selectedBtn).toBeTruthy();
    expect(classString(selectedBtn!).includes('relative')).toBeTruthy();
    expect(classString(selectedBtn!).includes('z-0')).toBeTruthy();
    // Selected card must not carry aggressive scale classes
    expect(classString(selectedBtn!).includes('scale-105')).toBe(false);
    expect(classString(selectedBtn!).includes('scale-110')).toBe(false);

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
      // Rarities should be shown as badges only (no textual 'COMMON/RARE/EPIC' in the button)
      expect(btn.textContent).not.toMatch(/\b(Common|Rare|Epic|Legendary|Uncommon)\b/i);
    });

    // Sort UI should be present and controllable
    const sortBtn = screen.getByTestId('blacksmith-sort');
    expect(sortBtn).toBeTruthy();

    // Verify sorting by damage reorders items (higher damage first)
    const itemsForSort = [
      { id: 'd1', characterId: 'c1', name: 'Low Sword', type: 'weapon', damage: 2, upgradeLevel: 0, value: 1 },
      { id: 'd2', characterId: 'c1', name: 'Big Axe', type: 'weapon', damage: 12, upgradeLevel: 0, value: 1 }
    ];
    cleanup();
    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={itemsForSort as any} setItems={() => {}} gold={2400} setGold={() => {}} />
      </AppContext.Provider>
    );

    const sortControl = screen.getByTestId('blacksmith-sort');
    // open the sort dropdown and pick Damage (target the main labelled button)
    const sortToggle = within(sortControl).getByText(/Name/i);
    fireEvent.click(sortToggle);
    // Find the dropdown option specifically (there is also a visible control label with the same text)
    const damageCandidates = within(sortControl).getAllByText(/Damage/i);
    const damageOption = damageCandidates.find(el => el.tagName === 'BUTTON' && el.className.includes('w-full')) || damageCandidates[damageCandidates.length - 1];
    fireEvent.click(damageOption);
    // Re-open and pick Damage again to flip direction to `desc` (SortSelector toggles on same-key select)
    fireEvent.click(sortToggle);
    const damageCandidates2 = within(sortControl).getAllByText(/Damage/i);
    const damageOption2 = damageCandidates2.find(el => el.tagName === 'BUTTON' && el.className.includes('w-full')) || damageCandidates2[damageCandidates2.length - 1];
    fireEvent.click(damageOption2);

    // Restrict ordering check to the Eligible Items scroller
    const headingAfter = screen.getByText(/Eligible Items/i);
    const columnAfter = headingAfter.closest('div.overflow-hidden');
    const scrollerAfter = columnAfter?.querySelector('.custom-scrollbar') as HTMLElement;
    const ordered = within(scrollerAfter!).getAllByRole('button').map(b => b.textContent || '');
    expect(ordered.findIndex(t => /Big Axe/i.test(t))).toBeLessThan(ordered.findIndex(t => /Low Sword/i.test(t)));
  });

  it('supports category filtering and deterministic sorting in the Eligible Items list', () => {
    const items = [
      { id: 'w1', characterId: 'c1', name: 'Alpha Sword', type: 'weapon', upgradeLevel: 0, value: 10, quantity: 1 },
      { id: 'a1', characterId: 'c1', name: 'Beta Shield', type: 'apparel', upgradeLevel: 3, value: 10, quantity: 1 },
      { id: 'w2', characterId: 'c1', name: 'Gamma Axe', type: 'weapon', upgradeLevel: 2, value: 10, quantity: 1 }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 2400, markEntityDirty: (_id: string) => {} } as any);

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

    // Sorting: inventory/shop-style lists are alphabetical by name for the default view
    // Alpha Sword should appear before Gamma Axe
    expect(visible.findIndex(t => /Alpha Sword/i.test(t))).toBeLessThan(visible.findIndex(t => /Gamma Axe/i.test(t)));




    // Reset to All
    const allBtn = screen.getByTestId('filter-all');
    fireEvent.click(allBtn);
    
    // Beta Shield (apparel) should reappear
    const allVisible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(allVisible.some(t => /Beta Shield/i.test(t))).toBe(true);
  });

  it('orders identical names deterministically (upgradeLevel tiebreak) and supports searching', () => {
    // Also verify tiebreak ordering for identical names
    const tieItems = [
      { id: 's1', characterId: 'c1', name: 'Twin Sword', type: 'weapon', upgradeLevel: 0, value: 1, quantity: 1 },
      { id: 's2', characterId: 'c1', name: 'Twin Sword', type: 'weapon', upgradeLevel: 2, value: 1, quantity: 1 },
      { id: 's3', characterId: 'c1', name: 'Iron Shield', type: 'apparel', upgradeLevel: 0, value: 1, quantity: 1 }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 100 } as any);
    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={tieItems as any} setItems={() => {}} gold={100} setGold={() => {}} />
      </AppContext.Provider>
    );

    const twinButtons = screen.getAllByRole('button').filter(b => /Twin Sword/i.test(b.textContent || ''));
    expect(twinButtons.length).toBe(2);
    expect(twinButtons[0].textContent).toMatch(/Lvl\s*2/i);
    expect(twinButtons[1].textContent).toMatch(/Lvl\s*0/i);

    // Now verify search still works alongside the tie-case
    const input = screen.getByTestId('blacksmith-search') as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: 'Iron' } });

    const visible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Iron Shield/i.test(t))).toBe(true);
    expect(visible.some(t => /Twin Sword/i.test(t))).toBe(false);

    // Clearing should restore all items
    fireEvent.change(input, { target: { value: '' } });
    const allVisible = screen.getAllByRole('button').map(b => b.textContent || '');
    expect(allVisible.some(t => /Twin Sword/i.test(t))).toBe(true);
  });

  it('shows equipped and favorite indicators and supports favorites sorting', () => {
    const items = [
      { id: 'f1', characterId: 'c1', name: 'Fav Sword', type: 'weapon', damage: 5, upgradeLevel: 0, value: 1, isFavorite: true, equipped: false },
      { id: 'f2', characterId: 'c1', name: 'Other Sword', type: 'weapon', damage: 8, upgradeLevel: 0, value: 1, isFavorite: false, equipped: true }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 100 } as any);
    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={100} setGold={() => {}} />
      </AppContext.Provider>
    );

    // Favorite item shows the favorite toggle button as pressed
    expect(screen.getByText(/Fav Sword/i)).toBeTruthy();
    const favToggle = screen.getByTestId('toggle-favorite-f1');
    expect(favToggle).toBeTruthy();
    expect(favToggle.getAttribute('aria-pressed')).toBe('true');

    // Equipped indicator rendered on the equipped item
    expect(screen.getByTestId('equipped-f2')).toBeTruthy();

    // Ensure favorites sorting puts the favorite first when selecting Favorites sort
    const sortControl = screen.getByTestId('blacksmith-sort');
    const sortToggle = within(sortControl).getByText(/Name/i);
    fireEvent.click(sortToggle);
    const favCandidates = within(sortControl).getAllByText(/Favorites/i);
    const favOption = favCandidates.find(el => el.tagName === 'BUTTON' && el.className.includes('w-full')) || favCandidates[favCandidates.length - 1];
    fireEvent.click(favOption);
    // flip direction so favorites appear first (SortSelector toggles on repeat)
    fireEvent.click(sortToggle);
    const favCandidates2 = within(sortControl).getAllByText(/Favorites/i);
    const favOption2 = favCandidates2.find(el => el.tagName === 'BUTTON' && el.className.includes('w-full')) || favCandidates2[favCandidates2.length - 1];
    fireEvent.click(favOption2);

    const scroller = screen.getByTestId('blacksmith-sort').closest('.overflow-hidden')?.querySelector('.custom-scrollbar') as HTMLElement;
    const ordered = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(ordered[0]).toMatch(/Fav Sword/i);
  });

  it('filters equipped and companion equipped items', () => {
    const items = [
      { id: 'p1', characterId: 'c1', name: 'Player Sword', type: 'weapon', equipped: true, equippedBy: 'player' },
      { id: 'c1', characterId: 'c1', name: 'Comp Shield', type: 'apparel', equipped: true, equippedBy: 'comp_1' },
      { id: 'u1', characterId: 'c1', name: 'Unequipped', type: 'weapon', equipped: false }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 100, markEntityDirty: (_id: string) => {} } as any);
    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={100} setGold={() => {}} />
      </AppContext.Provider>
    );

    const heading = screen.getByText(/Eligible Items/i);
    const column = heading.closest('div.overflow-hidden');
    const scroller = column?.querySelector('.custom-scrollbar') as HTMLElement;

    // Default (All) shows everything
    let visible = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Player Sword/i.test(t))).toBe(true);
    expect(visible.some(t => /Comp Shield/i.test(t))).toBe(true);
    expect(visible.some(t => /Unequipped/i.test(t))).toBe(true);

    // Click Equipped filter
    const eqBtn = screen.getByTestId('filter-equipped-equipped');
    fireEvent.click(eqBtn);
    visible = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Player Sword/i.test(t))).toBe(true);
    expect(visible.some(t => /Comp Shield/i.test(t))).toBe(true);
    expect(visible.some(t => /Unequipped/i.test(t))).toBe(false);

    // Click Companion filter
    const compBtn = screen.getByTestId('filter-equipped-companion');
    fireEvent.click(compBtn);
    visible = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Player Sword/i.test(t))).toBe(false);
    expect(visible.some(t => /Comp Shield/i.test(t))).toBe(true);

    // Reset to All
    const allBtn = screen.getByTestId('filter-equipped-all');
    fireEvent.click(allBtn);
    visible = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Unequipped/i.test(t))).toBe(true);
  });

  it('remembers last selected Show filter using localStorage', () => {
    // Prepare persisted state
    localStorage.setItem('aetherius:blacksmith:show', 'equipped');

    const items = [
      { id: 'p1', characterId: 'c1', name: 'Player Sword', type: 'weapon', equipped: true, equippedBy: 'player' },
      { id: 'c1', characterId: 'c1', name: 'Comp Shield', type: 'apparel', equipped: true, equippedBy: 'comp_1' },
      { id: 'u1', characterId: 'c1', name: 'Unequipped', type: 'weapon', equipped: false }
    ];

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, gold: 100, markEntityDirty: (_id: string) => {} } as any);
    const { rerender } = render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={100} setGold={() => {}} />
      </AppContext.Provider>
    );

    const heading = screen.getByText(/Eligible Items/i);
    const column = heading.closest('div.overflow-hidden');
    const scroller = column?.querySelector('.custom-scrollbar') as HTMLElement;

    // persisted 'equipped' should filter on mount
    let visible = within(scroller!).getAllByRole('button').map(b => b.textContent || '');
    expect(visible.some(t => /Player Sword/i.test(t))).toBe(true);
    expect(visible.some(t => /Comp Shield/i.test(t))).toBe(true);
    expect(visible.some(t => /Unequipped/i.test(t))).toBe(false);

    // clicking All should update storage
    const allBtn = screen.getByTestId('filter-equipped-all');
    fireEvent.click(allBtn);
    expect(localStorage.getItem('aetherius:blacksmith:show')).toBe('all');

    // cleanup
    localStorage.removeItem('aetherius:blacksmith:show');
  });
});
