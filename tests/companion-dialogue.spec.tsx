import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanionDialogueModal from '../components/CompanionDialogueModal';
import * as gemini from '../services/geminiService';

const companion = { id: 'c1', name: 'Hamit', mood: 'neutral', personality: 'Loyal' } as any;

describe('CompanionDialogueModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses AI to reply and shows the AI reply in the chat', async () => {
    const mockChat = vi.spyOn(gemini, 'chatWithCompanion').mockResolvedValue("I will watch your back.");
    const onSend = vi.fn();

    render(<CompanionDialogueModal open={true} onClose={() => {}} companion={companion} onSend={onSend} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Please follow.{enter}');

    expect(onSend).toHaveBeenCalledWith('c1', 'Please follow.');
    expect(mockChat).toHaveBeenCalledWith(companion, 'Please follow.');

    // Wait for AI reply to appear
    const aiText = await screen.findByText(/I will watch your back\./i);
    expect(aiText).toBeTruthy();
  });

  it('shows backstory snippet in header when present', async () => {
    const comp = { id: 'c1', name: 'Hamit', mood: 'neutral', personality: 'Loyal', backstory: 'A retired guard who owes you a favor.' } as any;

    render(<CompanionDialogueModal open={true} onClose={() => {}} companion={comp} onSend={() => {}} />);

    // The header should show a truncated backstory snippet
    const headerBackstory = await screen.findByText(/retired guard who owes you a favor/i);
    expect(headerBackstory).toBeTruthy();
  });

  it('renders input with prominent white style', async () => {
    const comp = { id: 'c1', name: 'Hamit' } as any;
    render(<CompanionDialogueModal open={true} onClose={() => {}} companion={comp} onSend={() => {}} />);

    const input = await screen.findByRole('textbox');
    // The textarea should have the white background class we added
    expect(input).toHaveClass('bg-white');
    expect(input).toHaveClass('text-black');
  });
});