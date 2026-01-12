import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, ChevronUp, ChevronDown } from 'lucide-react';

// Known commands for simple tab-completion
const COMMAND_SUGGESTIONS = [
  'demo.help()',
  'demo.simulateCombat()',
  "demo.simulateCombat({ location: 'Bleak Falls Barrow' })",
  'demo.testCombatItems()',
  'demo.createTestCharacter()',
  'demo.addExperience(100)',
  'demo.levelUp()',
  "demo.createTestItem('weapon')",
  'demo.addRandomItems(5)',
  'demo.addGold(100)',
  'demo.createTestJournalEntry()',
  'demo.addRandomJournalEntries(3)',
  'demo.createTestQuest()',
  'demo.addRandomQuests(2)',
  'demo.getAppState()',
  'demo.clearDemoData()',
  "demo.clearDemoData({ items: false })",
  'clear',
  'history',
  'exit'
];

interface ConsoleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
}

export const ConsoleOverlay: React.FC<ConsoleOverlayProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [output, setOutput] = useState<string[]>([
    'Skyrim Aetherius Developer Console',
    'Type demo.help() for available commands',
    'Type "exit" or press ESC to close',
    '---'
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const refreshSuggestions = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const matches = COMMAND_SUGGESTIONS.filter(cmd => cmd.toLowerCase().startsWith(trimmed.toLowerCase())).slice(0, 6);
    setSuggestions(matches);
  };

  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    setSuggestions([]);

    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command to output
    setOutput(prev => [...prev, `> ${command}`]);

    // Execute command
    try {
      if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
        onClose();
        return;
      }

      if (command.toLowerCase() === 'clear') {
        setOutput(['Console cleared']);
        return;
      }

      if (command.toLowerCase() === 'history') {
        setOutput(prev => [...prev, 'Command History:', ...commandHistory.map((cmd, i) => `${i + 1}: ${cmd}`)]);
        return;
      }

      // Execute the command in global scope
      const result = (window as any).eval(command);

      // Add result to output
      if (result !== undefined) {
        setOutput(prev => [...prev, String(result)]);
      } else {
        setOutput(prev => [...prev, 'Command executed']);
      }
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error.message}`]);
    }

    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(inputValue);
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
        refreshSuggestions(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputValue('');
          setSuggestions([]);
        } else {
          setHistoryIndex(newIndex);
          setInputValue(commandHistory[newIndex]);
          refreshSuggestions(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      // Simple tab-complete: fill the first matching suggestion
      const trimmed = inputValue.trim();
      const matches = suggestions.length ? suggestions : COMMAND_SUGGESTIONS.filter(cmd => cmd.toLowerCase().startsWith(trimmed.toLowerCase()));
      if (matches.length > 0) {
        e.preventDefault();
        const nextValue = matches[0];
        setInputValue(nextValue);
        setSuggestions(matches.slice(1));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-skyrim-paper border border-skyrim-border rounded-lg shadow-2xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skyrim-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <span className="text-white font-mono text-sm">Developer Console</span>
          </div>
          <button
            onClick={onClose}
            className="text-skyrim-text hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output Area */}
        <div
          ref={outputRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-950 text-green-400"
          style={{ maxHeight: 'calc(100% - 120px)' }}
        >
          {output.map((line, index) => (
            <div key={index} className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
              {line}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-skyrim-border bg-skyrim-paper">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                refreshSuggestions(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-500"
              placeholder="Enter command..."
              spellCheck={false}
              autoComplete="off"
            />
            <div className="flex gap-1 text-skyrim-text text-xs">
              <ChevronUp className="w-3 h-3" />
              <ChevronDown className="w-3 h-3" />
              <span>History</span>
            </div>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2 text-xs text-skyrim-text font-mono">
              Suggestions: {suggestions.slice(0, 4).join('   ')}{suggestions.length > 4 ? ' ...' : ''}
            </div>
          )}
          <div className="text-xs text-skyrim-text mt-2">
            Press Enter to execute, Tab to autocomplete, ESC to close, ↑/↓ for history
          </div>
        </div>
      </div>
    </div>
  );
};