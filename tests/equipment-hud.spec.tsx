import React from 'react';
import { render, screen } from '@testing-library/react';
import { EquipmentHUD } from '../components/EquipmentHUD';

const itemWithBase = {
  id: 'i1',
  name: 'Test Sword',
  type: 'weapon',
  damage: 20,
  baseDamage: 12,
  bonusDamage: 8,
  quantity: 1,
  equipped: true,
  slot: 'weapon'
};

test('shows total damage (base + bonus) in equipment HUD and tooltip', async () => {
  render(<EquipmentHUD items={[itemWithBase as any]} onUnequip={() => {}} onEquipFromSlot={() => {}} />);

  // Detailed breakdown should be present somewhere in the rendered output (tooltip is hidden by default)
  expect(document.body.textContent).toContain('(12 + 8)');

  // Ensure item label renders
  const name = screen.getByText(/Test Sword/i);
  expect(name).toBeTruthy();
});