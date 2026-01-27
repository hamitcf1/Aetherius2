import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CharacterSelect } from '../components/CharacterSelect';

const mockOnSelect = vi.fn();
const mockOnCreate = vi.fn();
const mockOnLogout = vi.fn();

const baseChar = { id: 'c1', profileId: 'p1', name: 'Hero', level: 1, race: 'Nord', gender: 'Male', archetype: 'Warrior' } as any;

describe('CharacterSelect transition', () => {
  it('calls onSelectCharacter immediately in test env (reduced-motion forced)', () => {
    const { getByText } = render(
      <CharacterSelect
        profileId={'p1'}
        characters={[baseChar]}
        onSelectCharacter={mockOnSelect}
        onCreateCharacter={mockOnCreate}
        onLogout={mockOnLogout}
      />
    );

    const playBtn = getByText('Hero');
    fireEvent.click(playBtn);
    expect(mockOnSelect).toHaveBeenCalledWith('c1');
  });
});
