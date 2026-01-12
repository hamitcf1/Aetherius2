import React, { useState, useMemo } from 'react';
import { StoryChapter, Character, CustomQuest, JournalEntry, InventoryItem, GameStateUpdate } from '../types';
import { Scroll, Calendar, Image as ImageIcon, Loader2, Plus, Download, Send, BookOpen, X, ArrowUpDown, Clock } from 'lucide-react';
import { generateLoreImage, generateGameMasterResponse } from '../services/geminiService';
import { SortSelector } from './GameFeatures';

interface AdventureMessage {
  id: string;
  role: 'player' | 'gm';
  content: string;
  timestamp: number;
}

interface StoryLogProps {
  chapters: StoryChapter[];
  onUpdateChapter: (chapter: StoryChapter) => void;
  onAddChapter?: (chapter: StoryChapter) => void;
  onDeleteChapter?: (chapterId: string) => void;
  onGameUpdate?: (updates: GameStateUpdate) => void;
  character?: Character;
  quests?: CustomQuest[];
  journal?: JournalEntry[];
  items?: InventoryItem[];
  userId?: string | null;
}

export const StoryLog: React.FC<StoryLogProps> = ({ 
    chapters, 
    onUpdateChapter,
    onAddChapter,
    onDeleteChapter,
    onGameUpdate,
    character,
    quests = [],
    journal = [],
    items = [],
    userId
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creatingChapter, setCreatingChapter] = useState(false);
    const [isGeneratingChapter, setIsGeneratingChapter] = useState(false);
  const [chapterPrompt, setChapterPrompt] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [isExportingStory, setIsExportingStory] = useState(false);
  
  // Finalize modal state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeProgress, setFinalizeProgress] = useState('');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [generatedBook, setGeneratedBook] = useState<string[]>([]);

    const [questTitle, setQuestTitle] = useState('');
    const [questLocation, setQuestLocation] = useState('');
    const [questDescription, setQuestDescription] = useState('');
    const [questObjectivesText, setQuestObjectivesText] = useState('');
    
    // Sort order state
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Sort options
  const sortOptions = [
    { id: 'desc', label: 'Newest First', icon: '↓' },
    { id: 'asc', label: 'Oldest First', icon: '↑' }
  ];

  // Deduplicate and sort chapters
  const sortedChapters = useMemo(() => {
    // First, filter out deleted chapters
    const visible = chapters.filter(c => !c.deleted);
    
    // Deduplicate by ID (keep the latest version)
    const uniqueMap = new Map<string, StoryChapter>();
    visible.forEach(chapter => {
      const existing = uniqueMap.get(chapter.id);
      if (!existing || (chapter.createdAt || 0) > (existing.createdAt || 0)) {
        uniqueMap.set(chapter.id, chapter);
      }
    });
    
    // Also deduplicate by title+content hash (in case same chapter was added twice with different IDs)
    const contentMap = new Map<string, StoryChapter>();
    Array.from(uniqueMap.values()).forEach(chapter => {
      const hash = `${chapter.title}::${chapter.content.substring(0, 100)}`;
      const existing = contentMap.get(hash);
      if (!existing || (chapter.createdAt || 0) > (existing.createdAt || 0)) {
        contentMap.set(hash, chapter);
      }
    });
    
    const uniqueChapters = Array.from(contentMap.values());
    
    // Sort by createdAt
    return uniqueChapters.sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [chapters, sortOrder]);

  // Format timestamp for display
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVisualize = async (chapter: StoryChapter) => {
      setLoadingId(chapter.id);
      try {
          const img = await generateLoreImage(`Skyrim lore scene: ${chapter.title}. ${chapter.content.substring(0, 200)}`);
          if (img) {
              onUpdateChapter({ ...chapter, imageUrl: img });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingId(null);
      }
  };

  const handleCreateChapter = async () => {
      if (chapterTitle.trim() && chapterContent.trim()) {
          const newChapter: StoryChapter = {
              id: Math.random().toString(36).substr(2, 9),
              characterId: character?.id || '',
              title: chapterTitle,
              content: chapterContent,
              date: "4E 201",
              summary: chapterTitle,
              createdAt: Date.now()
          };
          onAddChapter?.(newChapter);
          setChapterTitle('');
          setChapterContent('');
          setCreatingChapter(false);
      }
  };

  const handleGenerateChapterWithAI = async () => {
      if (!chapterPrompt.trim() || !character) return;

      setIsGeneratingChapter(true);
      try {
          const context = JSON.stringify({
              character,
              quests: quests.filter(q => q.status === 'active'),
              recentStory: chapters.slice(-2),
              inventory: items.slice(0, 5)
          });

          const update = await generateGameMasterResponse(chapterPrompt, context);

          if (typeof onGameUpdate === 'function') {
              onGameUpdate(update);
              setChapterPrompt('');
              return;
          }

          if (update.narrative) {
            const newChapter: StoryChapter = {
                id: Math.random().toString(36).substr(2, 9),
                characterId: character.id,
                title: update.narrative.title,
                content: update.narrative.content,
                date: "4E 201",
                summary: update.narrative.title,
                createdAt: Date.now()
            };
            onAddChapter?.(newChapter);
            setChapterPrompt('');
          }
      } catch (error) {
          console.error('Error generating chapter:', error);
      } finally {
          setIsGeneratingChapter(false);
      }
  };

  const handleAddQuestFromStory = () => {
      if (!questTitle.trim()) return;
      if (typeof onGameUpdate !== 'function') return;

      const objectives = (questObjectivesText || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(description => ({ description, completed: false }));

      onGameUpdate({
        newQuests: [
          {
            title: questTitle.trim(),
            description: questDescription.trim(),
            location: questLocation.trim() || undefined,
            objectives: objectives.length ? objectives : undefined,
          },
        ],
      });

      setQuestTitle('');
      setQuestLocation('');
      setQuestDescription('');
      setQuestObjectivesText('');
  };

  // AI-powered story generation - weaves chapters + adventure chat into a real book
  const handleFinalizeStory = async () => {
    if (!character) return;
    
    setShowFinalizeModal(true);
    setIsExportingStory(true);
    setFinalizeError(null);
    setGeneratedBook([]);
    setFinalizeProgress('Loading adventure history...');

    try {
      // Load adventure messages if we have a userId
      let adventureMessages: AdventureMessage[] = [];
      if (userId && character.id) {
        try {
          const { loadAdventureMessages } = await import('../services/firestore');
          adventureMessages = await loadAdventureMessages(userId, character.id);
        } catch (e) {
          console.warn('Could not load adventure messages:', e);
        }
      }

      setFinalizeProgress('Preparing story materials...');

      // Sort all content chronologically
      const sortedChapters = [...chapters].filter(c => !c.deleted).sort((a, b) => a.createdAt - b.createdAt);
      const sortedJournal = [...journal].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      const sortedMessages = adventureMessages.sort((a, b) => a.timestamp - b.timestamp);

      // Build summarized source material for AI (limit to avoid token overflow)
      const maxChapters = 10; // Limit chapters to prevent token overflow
      const maxJournal = 8; // Limit journal entries
      const maxMessages = 20; // Limit adventure messages
      
      const limitedChapters = sortedChapters.slice(0, maxChapters); // Oldest chapters first for chronological storytelling
      const limitedJournal = sortedJournal.slice(0, maxJournal); // Oldest journal entries first
      const limitedMessages = sortedMessages.slice(0, maxMessages); // Oldest adventure messages first
      
      // Create concise summaries
      const chapterSummary = limitedChapters.map((c, i) => 
        `Chapter ${i+1}: ${c.title} - ${c.content.substring(0, 200)}...`
      ).join('\n');
      
      const journalSummary = limitedJournal.map(j => 
        `${j.title}: ${j.content.substring(0, 150)}...`
      ).join('\n');
      
      const adventureSummary = limitedMessages.map(m => 
        `${m.role === 'player' ? 'HERO' : 'NARRATOR'}: ${m.content.substring(0, 100)}...`
      ).join('\n');
      
      const questSummary = quests.slice(0, 5).map(q => 
        `${q.title} (${q.status}): ${q.description?.substring(0, 100) || 'No description'}`
      ).join('\n');

      const sourceMaterial = {
        character: {
          name: character.name,
          race: character.race,
          gender: character.gender,
          archetype: character.archetype,
          level: character.level,
          identity: character.identity,
          psychology: character.psychology,
          moralCode: character.moralCode
        },
        totalChapters: sortedChapters.length,
        totalJournalEntries: sortedJournal.length,
        totalAdventures: sortedMessages.length,
        chapterSummary,
        journalSummary,
        adventureSummary,
        questSummary
      };

      // If no content, show error
      const totalContentItems = sortedChapters.length + sortedJournal.length + sortedMessages.length;
      if (totalContentItems === 0) {
        throw new Error('No story content found. Create some chapters, journal entries, or play some adventures first!');
      }

      console.log(`Processing ${totalContentItems} total content items: ${sortedChapters.length} chapters, ${sortedJournal.length} journal entries, ${sortedMessages.length} adventure messages`);
      console.log(`Story will start chronologically from oldest entries: ${limitedChapters.length} chapters, ${limitedJournal.length} journal entries, ${limitedMessages.length} adventure messages`);

      setFinalizeProgress('AI is crafting your complete story... (this may take 5-10 minutes for a full book)');

      // Multi-phase story generation for comprehensive coverage
  const generateCompleteStory = async (
    sourceMaterial: any,
    sortedChapters: any[],
    sortedJournal: any[],
    sortedMessages: any[],
    quests: any[],
    character: any
  ): Promise<{ title: string; content: string }[]> => {
    const allChapters: { title: string; content: string }[] = [];
    let coveredContent: string[] = [];
    let phase = 1;

    // Phase 1: Generate foundation chapters (early story - chronological beginning)
    setFinalizeProgress(`Phase 1: Crafting the foundation of ${character.name}'s legend from the very beginning...`);
    const foundationPrompt = `You are a master storyteller creating the FOUNDATION of a hero's epic Skyrim chronicle, starting from the VERY BEGINNING of their journey.

CHARACTER: ${sourceMaterial.character.name}, ${sourceMaterial.character.race} ${sourceMaterial.character.gender}, ${sourceMaterial.character.archetype} (Level ${sourceMaterial.character.level})

EARLIEST STORY ELEMENTS TO COVER (chronological start):
${sourceMaterial.chapterSummary.split('\n').slice(0, 3).join('\n')}
${sourceMaterial.journalSummary.split('\n').slice(0, 3).join('\n')}
${sourceMaterial.adventureSummary.split('\n').slice(0, 5).join('\n')}

IMPORTANT: Write TWO separate chapters covering the hero's ORIGINS and EARLIEST ADVENTURES. This is the beginning of their legendary journey. Each chapter should be 600-800 words with vivid details, dialogue, and character development.

Format your response EXACTLY like this:

Chapter 1: [Descriptive Title for Chapter 1]
[Full chapter content here covering the hero's origins and first steps]

Chapter 2: [Descriptive Title for Chapter 2]
[Full chapter content here continuing from the earliest adventures]

Each chapter should be a complete, self-contained story segment showing how the hero began their journey. DO NOT skip Chapter 1.`;

    console.log('Phase 1 prompt:', foundationPrompt.substring(0, 200) + '...');
    const foundationResponse = await generateGameMasterResponse(foundationPrompt, '');
    console.log('Phase 1 RAW response:', foundationResponse.narrative?.content);
    const foundationChapters = parseChaptersFromResponse(foundationResponse.narrative?.content || '');
    console.log(`Phase 1 parsed chapters:`, foundationChapters.map(c => c.title));
    allChapters.push(...foundationChapters);
    coveredContent.push('foundation', 'origins', 'early-adventures');

    // Phase 2: Generate middle chapters (main story development)
    if (sortedChapters.length > 1 || sortedJournal.length > 1 || sortedMessages.length > 2) {
      setFinalizeProgress(`Phase 2: Developing the main narrative arc...`);
      const middlePrompt = `Continue the epic Skyrim chronicle. Previous chapters covered: ${coveredContent.join(', ')}

CHARACTER: ${sourceMaterial.character.name} (continuing their journey)

MAIN STORY ELEMENTS TO COVER NOW:
${sourceMaterial.chapterSummary.split('\n').slice(3, 8).join('\n')}
${sourceMaterial.journalSummary.split('\n').slice(3, 6).join('\n')}
${sourceMaterial.adventureSummary.split('\n').slice(5, 12).join('\n')}
${sourceMaterial.questSummary}

IMPORTANT: Write THREE separate chapters, each 600-800 words long. Format your response EXACTLY like this:

Chapter 3: [Descriptive Title for Chapter 3]
[Full chapter content here with major conflicts and character development]

Chapter 4: [Descriptive Title for Chapter 4]
[Full chapter content here continuing the story with key relationships]

Chapter 5: [Descriptive Title for Chapter 5]
[Full chapter content here building toward the climax]

Each chapter should advance the plot significantly and show character growth. Reference specific events from the story elements provided above.`;

      console.log('Phase 2 prompt:', middlePrompt.substring(0, 200) + '...');
      const middleResponse = await generateGameMasterResponse(middlePrompt, '');
      console.log('Phase 2 response preview:', middleResponse.narrative?.content?.substring(0, 300) + '...');
      const middleChapters = parseChaptersFromResponse(middleResponse.narrative?.content || '');
      console.log(`Phase 2 generated ${middleChapters.length} chapters`);
      allChapters.push(...middleChapters);
      coveredContent.push('main-conflicts', 'character-development', 'key-relationships');
    }

    // Phase 3: Generate recent events and climax
    setFinalizeProgress(`Phase 3: Reaching the story's climax and recent events...`);
    const recentPrompt = `Complete the epic Skyrim chronicle. Previous chapters covered: ${coveredContent.join(', ')}

CHARACTER: ${sourceMaterial.character.name} (Level ${sourceMaterial.character.level}, ${sourceMaterial.character.archetype})

RECENT AND FINAL ELEMENTS TO COVER:
${sourceMaterial.chapterSummary.split('\n').slice(-3).join('\n')}
${sourceMaterial.journalSummary.split('\n').slice(-3).join('\n')}
${sourceMaterial.adventureSummary.split('\n').slice(-8).join('\n')}

IMPORTANT: Write THREE separate chapters, each 600-800 words long. Format your response EXACTLY like this:

Chapter 6: [Descriptive Title for Chapter 6]
[Full chapter content here covering recent events and building tension]

Chapter 7: [Descriptive Title for Chapter 7]
[Full chapter content here reaching the story climax]

Chapter 8: [Descriptive Title for Chapter 8]
[Full chapter content here showing resolution and character growth]

Show how the hero has grown and what challenges remain. Each chapter should be substantial and advance the plot to its conclusion.`;

    console.log('Phase 3 prompt:', recentPrompt.substring(0, 200) + '...');
    const recentResponse = await generateGameMasterResponse(recentPrompt, '');
    console.log('Phase 3 response preview:', recentResponse.narrative?.content?.substring(0, 300) + '...');
    const recentChapters = parseChaptersFromResponse(recentResponse.narrative?.content || '');
    console.log(`Phase 3 generated ${recentChapters.length} chapters`);
    allChapters.push(...recentChapters);

    // Phase 4: Generate epilogue (always run for complete conclusion)
    setFinalizeProgress(`Phase 4: Crafting a legendary conclusion...`);
    const epiloguePrompt = `Write a GRAND EPILOGUE chapter for ${sourceMaterial.character.name}'s Skyrim chronicle.

This should be a substantial chapter (600-800 words) that reflects on the hero's complete journey, their growth from ${sourceMaterial.character.identity || 'ordinary beginnings'} to legendary status, their lasting impact on Skyrim, and their future prospects.

Chapter 9: Legacy of ${sourceMaterial.character.name}
[Write a comprehensive epilogue showing the hero's legendary status, their reflections on the journey, and their place in Skyrim's history. Include vivid descriptions of their achievements and the mark they've left on the world.]`;

    console.log('Phase 4 prompt:', epiloguePrompt.substring(0, 200) + '...');
    const epilogueResponse = await generateGameMasterResponse(epiloguePrompt, '');
    console.log('Phase 4 response preview:', epilogueResponse.narrative?.content?.substring(0, 300) + '...');
    const epilogueChapters = parseChaptersFromResponse(epilogueResponse.narrative?.content || '');
    console.log(`Phase 4 generated ${epilogueChapters.length} chapters`);
    allChapters.push(...epilogueChapters);

    // Renumber chapters to ensure proper sequence
    const renumberedChapters = allChapters.map((chapter, index) => {
      const newTitle = chapter.title.replace(/^Chapter \d+:/, `Chapter ${index + 1}:`);
      console.log(`Renumbering: "${chapter.title}" -> "${newTitle}"`);
      return {
        title: newTitle,
        content: chapter.content
      };
    });

    console.log(`Final story generation complete: ${renumberedChapters.length} chapters total`);
    renumberedChapters.forEach((ch, i) => {
      console.log(`Final Chapter ${i + 1}: ${ch.title} (${ch.content.split(/\s+/).length} words)`);
    });

    // Ensure we always start with Chapter 1
    if (renumberedChapters.length > 0 && !renumberedChapters[0].title.startsWith('Chapter 1:')) {
      console.warn('First chapter does not start with Chapter 1, forcing renumbering...');
      return renumberedChapters.map((chapter, index) => ({
        title: chapter.title.replace(/^Chapter \d+:/, `Chapter ${index + 1}:`),
        content: chapter.content
      }));
    }

    return renumberedChapters;
  };

  // Helper function to parse chapters from AI response
  const parseChaptersFromResponse = (content: string): { title: string; content: string }[] => {
    console.log('Parsing chapters from response:', content.substring(0, 500) + '...');

    const chapters: { title: string; content: string }[] = [];

    // Strategy 1: Look for "Chapter X: Title" format (more flexible)
    const chapterPattern = /Chapter\s*(\d+)[\s:]+([^\n\r]+)[\r\n]+([\s\S]*?)(?=Chapter\s*\d+|^\s*$|$)/gmi;
    let match;
    let matchCount = 0;
    while ((match = chapterPattern.exec(content)) !== null) {
      matchCount++;
      console.log(`Found chapter ${match[1]}: ${match[2].trim()}`);
      chapters.push({
        title: `Chapter ${match[1]}: ${match[2].trim()}`,
        content: match[3].trim()
      });
    }

    if (chapters.length > 0) {
      console.log(`Strategy 1: Found ${chapters.length} chapters using regex parsing`);
      return chapters;
    }

    console.log('Strategy 1 failed, trying Strategy 2...');

    // Strategy 2: Split by chapter markers (more flexible)
    const lines = content.split('\n');
    let currentChapter: { title: string; content: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for chapter headers (various formats)
      if (line.match(/^Chapter\s*\d+[\s:]/i) ||
          line.match(/^\d+\.\s*Chapter/i) ||
          (line.match(/^Chapter\s*\d+/i) && line.length < 100)) {

        // Save previous chapter if exists
        if (currentChapter && currentChapter.content.length > 0) {
          chapters.push({
            title: currentChapter.title,
            content: currentChapter.content.join('\n').trim()
          });
        }

        // Start new chapter
        currentChapter = {
          title: line,
          content: []
        };
        console.log(`Strategy 2: Found chapter header: ${line}`);
      } else if (currentChapter && line) {
        currentChapter.content.push(line);
      }
    }

    // Add the last chapter
    if (currentChapter && currentChapter.content.length > 0) {
      chapters.push({
        title: currentChapter.title,
        content: currentChapter.content.join('\n').trim()
      });
    }

    if (chapters.length > 0) {
      console.log(`Strategy 2: Found ${chapters.length} chapters using line-by-line parsing`);
      return chapters;
    }

    console.log('Strategy 2 failed, trying Strategy 3...');

    // Strategy 3: If no chapters found, split content into reasonable chunks
    console.log('No chapters found, using fallback chunking');
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    const wordsPerChapter = Math.max(800, Math.floor(content.split(/\s+/).length / 6)); // Aim for 6 chapters

    let currentWords = 0;
    let chapterNum = 1;
    let chapterContent: string[] = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).length;
      chapterContent.push(paragraph);

      currentWords += words;
      if (currentWords >= wordsPerChapter && chapterNum < 6) {
        chapters.push({
          title: `Chapter ${chapterNum}: ${chapterNum === 1 ? 'Origins' : chapterNum === 2 ? 'Early Adventures' : chapterNum === 3 ? 'Rising Conflicts' : chapterNum === 4 ? 'Character Growth' : chapterNum === 5 ? 'Climax' : 'Resolution'}`,
          content: chapterContent.join('\n\n')
        });
        chapterContent = [];
        currentWords = 0;
        chapterNum++;
      }
    }

    // Add remaining content as final chapter
    if (chapterContent.length > 0) {
      chapters.push({
        title: `Chapter ${chapterNum}: Conclusion`,
        content: chapterContent.join('\n\n')
      });
    }

    console.log(`Strategy 3: Created ${chapters.length} chapters using fallback chunking`);
    return chapters.length > 0 ? chapters : [{ title: 'The Complete Saga', content }];
  };
      const allGeneratedChapters = await generateCompleteStory(sourceMaterial, sortedChapters, sortedJournal, sortedMessages, quests, character);

      console.log(`Final story has ${allGeneratedChapters.length} chapters`);

      setGeneratedBook(allGeneratedChapters.map(c => `## ${c.title}\n\n${c.content}`));
      setFinalizeProgress('Generating PDF...');

      // Generate PDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Theme colors
      const COLOR_BG = [15, 12, 8];
      const COLOR_TEXT = [230, 220, 200];
      const COLOR_GOLD = [192, 160, 98];
      const COLOR_CHAPTER = [160, 140, 100];

      const drawBackground = () => {
        doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        // Decorative border
        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.setLineWidth(1);
        doc.rect(margin/2, margin/2, pageWidth - margin, pageHeight - margin, 'S');
        // Inner border
        doc.setLineWidth(0.3);
        doc.rect(margin/2 + 3, margin/2 + 3, pageWidth - margin - 6, pageHeight - margin - 6, 'S');
      };

      const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
          doc.addPage();
          drawBackground();
          yPos = margin + 15;
        }
      };

      // Title Page
      drawBackground();
      
      yPos = pageHeight / 3;
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.text('The Chronicle', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(12);
      doc.setTextColor(COLOR_CHAPTER[0], COLOR_CHAPTER[1], COLOR_CHAPTER[2]);
      doc.text('~ of ~', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(24);
      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.text(character.name, pageWidth / 2, yPos, { align: 'center' });

      yPos += 20;
      doc.setFontSize(11);
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      doc.text(`A ${character.gender} ${character.race} ${character.archetype}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(COLOR_CHAPTER[0], COLOR_CHAPTER[1], COLOR_CHAPTER[2]);
      doc.text(`Level ${character.level}`, pageWidth / 2, yPos, { align: 'center' });

      // Add character identity if present
      if (character.identity) {
        yPos += 25;
        doc.setFontSize(9);
        doc.setTextColor(COLOR_TEXT[0] - 40, COLOR_TEXT[1] - 40, COLOR_TEXT[2] - 40);
        const identityLines = doc.splitTextToSize(`"${character.identity}"`, contentWidth - 20);
        doc.text(identityLines, pageWidth / 2, yPos, { align: 'center' });
      }

      // Book chapters
      allGeneratedChapters.forEach((chapter, index) => {
        doc.addPage();
        drawBackground();
        yPos = margin + 10;

        // Chapter number
        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_CHAPTER[0], COLOR_CHAPTER[1], COLOR_CHAPTER[2]);
        doc.text(`Chapter ${index + 1}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Chapter title
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        const titleLines = doc.splitTextToSize(chapter.title, contentWidth);
        doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
        yPos += titleLines.length * 8 + 15;

        // Decorative divider
        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 30, yPos - 5, pageWidth / 2 + 30, yPos - 5);
        yPos += 10;

        // Chapter content
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        
        const paragraphs = chapter.content.split('\n\n');
        paragraphs.forEach(para => {
          const trimmed = para.trim();
          if (!trimmed) return;
          
          const lines = doc.splitTextToSize(trimmed, contentWidth);
          const contentHeight = lines.length * 5.5;
          
          checkPageBreak(contentHeight + 10);
          doc.text(lines, margin, yPos);
          yPos += contentHeight + 8;
        });
      });

      // Don't auto-download - just show the preview and let user click download
      setFinalizeProgress('Complete! Click "Download PDF" to save your book.');

    } catch (error: any) {
      console.error('Error finalizing story:', error);
      setFinalizeError(error.message || 'Failed to generate story. Please try again.');
    } finally {
      setIsExportingStory(false);
    }
  };

  // Quick export (old method - just lists chapters)
  const handleQuickExport = async () => {
      setIsExportingStory(true);
      try {
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 20;
          const contentWidth = pageWidth - (margin * 2);
          let yPos = margin;

          // Theme
          const COLOR_BG = [20, 20, 20];
          const COLOR_TEXT = [220, 220, 220];
          const COLOR_GOLD = [192, 160, 98];

          const drawBackground = () => {
              doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
              doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
              doc.setLineWidth(0.5);
              doc.rect(margin/2, margin/2, pageWidth - margin, pageHeight - margin, 'S');
          };

          const checkPageBreak = (heightNeeded: number) => {
              if (yPos + heightNeeded > pageHeight - margin) {
                  doc.addPage();
                  drawBackground();
                  yPos = margin + 10;
              }
          };

          // Title Page
          drawBackground();
          
          doc.setFont('times', 'bold');
          doc.setFontSize(28);
          doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
          doc.text('The Chronicle', pageWidth / 2, yPos + 20, { align: 'center' });
          yPos += 40;

          if (character) {
              doc.setFontSize(16);
              doc.text(`${character.name}'s Journey`, pageWidth / 2, yPos, { align: 'center' });
              yPos += 15;
              
              doc.setFontSize(11);
              doc.setTextColor(180, 180, 180);
              doc.text(`Level ${character.level} ${character.gender} ${character.race} ${character.archetype}`, pageWidth / 2, yPos, { align: 'center' });
          }

          // Chapters
          const sortedChapters = [...chapters].sort((a, b) => a.createdAt - b.createdAt);
          
          sortedChapters.forEach((chapter, index) => {
              checkPageBreak(30);
              
              doc.setFont('times', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
              doc.text(`Chapter ${index + 1}: ${chapter.title}`, margin, yPos);
              yPos += 10;

              doc.setFontSize(9);
              doc.setTextColor(160, 160, 160);
              doc.text(`${chapter.date}`, margin, yPos);
              yPos += 8;

              // Content
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
              doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
              const lines = doc.splitTextToSize(chapter.content, contentWidth);
              const contentHeight = lines.length * 4.5;
              
              checkPageBreak(contentHeight + 5);
              doc.text(lines, margin, yPos);
              yPos += contentHeight + 15;
          });

          doc.save(`${character?.name || 'Story'}_Chronicle.pdf`);
      } catch (error) {
          console.error('Error exporting story:', error);
      } finally {
          setIsExportingStory(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2 sm:px-4">
    <div className="mb-8 p-4 sm:p-6 bg-skyrim-paper border-y-4 border-skyrim-border text-center">
        <h1 className="text-4xl font-serif text-skyrim-gold mb-2">The Chronicle</h1>
        <p className="text-gray-500 font-sans text-sm">The unfolding saga of your journey.</p>
        
        {/* Sort controls and chapter count */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-skyrim-text">{sortedChapters.length} {sortedChapters.length === 1 ? 'entry' : 'entries'}</span>
          <SortSelector currentSort={sortOrder} onSelect={setSortOrder} options={sortOptions} />
        </div>
      </div>

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-skyrim-dark/60 flex items-center justify-center z-50 p-4">
          <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif text-skyrim-gold flex items-center gap-2">
                <BookOpen size={24} /> {generatedBook.length > 0 ? 'Your Chronicle' : 'Finalizing Your Chronicle'}
              </h3>
              {!isExportingStory && (
                <button 
                  onClick={() => setShowFinalizeModal(false)}
                  className="text-skyrim-text hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {isExportingStory && (
              <div className="flex items-center gap-3 text-skyrim-text mb-4">
                <Loader2 className="animate-spin text-skyrim-gold" size={20} />
                <span>{finalizeProgress}</span>
              </div>
            )}

            {finalizeError && (
              <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4 text-red-200">
                {finalizeError}
              </div>
            )}

            {generatedBook.length > 0 && (
              <div className="bg-skyrim-paper/40 border border-skyrim-border rounded p-4 mb-4 max-h-[50vh] overflow-y-auto">
                <p className="text-sm text-skyrim-text mb-3">Your Generated Chronicle:</p>
                <div className="text-skyrim-text text-sm whitespace-pre-wrap font-serif space-y-4">
                  {generatedBook.map((chapter, idx) => (
                    <div key={idx} className="border-b border-skyrim-border/30 pb-4 last:border-0">
                      {chapter}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isExportingStory && !finalizeError && generatedBook.length > 0 && (
              <p className="text-green-400 mb-4">✓ Your chronicle is ready!</p>
            )}

            <div className="flex gap-2">
              {!isExportingStory && generatedBook.length > 0 && (
                <button
                  onClick={async () => {
                    // Re-download the PDF
                    if (!character) return;
                    setFinalizeProgress('Generating PDF...');
                    setIsExportingStory(true);
                    try {
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF();
                      const pageWidth = doc.internal.pageSize.getWidth();
                      const pageHeight = doc.internal.pageSize.getHeight();
                      const margin = 25;
                      const contentWidth = pageWidth - (margin * 2);
                      let yPos = margin;

                      const COLOR_BG = [15, 12, 8];
                      const COLOR_TEXT = [230, 220, 200];
                      const COLOR_GOLD = [192, 160, 98];
                      const COLOR_CHAPTER = [160, 140, 100];

                      const drawBackground = () => {
                        doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
                        doc.rect(0, 0, pageWidth, pageHeight, 'F');
                        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
                        doc.setLineWidth(1);
                        doc.rect(margin/2, margin/2, pageWidth - margin, pageHeight - margin, 'S');
                        doc.setLineWidth(0.3);
                        doc.rect(margin/2 + 3, margin/2 + 3, pageWidth - margin - 6, pageHeight - margin - 6, 'S');
                      };

                      const checkPageBreak = (heightNeeded: number) => {
                        if (yPos + heightNeeded > pageHeight - margin) {
                          doc.addPage();
                          drawBackground();
                          yPos = margin + 15;
                        }
                      };

                      // Title Page
                      drawBackground();
                      yPos = pageHeight / 3;
                      doc.setFont('times', 'bold');
                      doc.setFontSize(32);
                      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
                      doc.text('The Chronicle', pageWidth / 2, yPos, { align: 'center' });
                      yPos += 15;
                      doc.setFontSize(12);
                      doc.setTextColor(COLOR_CHAPTER[0], COLOR_CHAPTER[1], COLOR_CHAPTER[2]);
                      doc.text('~ of ~', pageWidth / 2, yPos, { align: 'center' });
                      yPos += 15;
                      doc.setFontSize(24);
                      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
                      doc.text(character.name, pageWidth / 2, yPos, { align: 'center' });

                      // Parse chapters from generatedBook
                      generatedBook.forEach((chapterText, index) => {
                        doc.addPage();
                        drawBackground();
                        yPos = margin + 10;

                        // Extract title and content from markdown format
                        const lines = chapterText.split('\n');
                        const titleLine = lines.find(l => l.startsWith('## ')) || `Chapter ${index + 1}`;
                        const title = titleLine.replace('## ', '');
                        const content = lines.filter(l => !l.startsWith('## ')).join('\n').trim();

                        doc.setFont('times', 'italic');
                        doc.setFontSize(10);
                        doc.setTextColor(COLOR_CHAPTER[0], COLOR_CHAPTER[1], COLOR_CHAPTER[2]);
                        doc.text(`Chapter ${index + 1}`, pageWidth / 2, yPos, { align: 'center' });
                        yPos += 10;

                        doc.setFont('times', 'bold');
                        doc.setFontSize(16);
                        doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
                        const titleLines = doc.splitTextToSize(title, contentWidth);
                        doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
                        yPos += titleLines.length * 8 + 15;

                        doc.setFont('times', 'normal');
                        doc.setFontSize(11);
                        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
                        
                        const paragraphs = content.split('\n\n');
                        paragraphs.forEach(para => {
                          const trimmed = para.trim();
                          if (!trimmed) return;
                          const pLines = doc.splitTextToSize(trimmed, contentWidth);
                          const contentHeight = pLines.length * 5.5;
                          checkPageBreak(contentHeight + 10);
                          doc.text(pLines, margin, yPos);
                          yPos += contentHeight + 8;
                        });
                      });

                      doc.save(`${character.name}_Chronicle.pdf`);
                      setFinalizeProgress('Complete!');
                    } catch (err) {
                      console.error('PDF generation error:', err);
                    } finally {
                      setIsExportingStory(false);
                    }
                  }}
                  className="flex-1 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-400 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </button>
              )}
              {!isExportingStory && (
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Creation Section */}
      {!creatingChapter ? (
          <div className="mb-8 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={() => setCreatingChapter(true)}
                    className="flex-1 py-3 bg-skyrim-accent hover:bg-skyrim-accent/80 text-white font-bold rounded flex items-center justify-center gap-2 border border-skyrim-border transition-colors"
                >
                    <Plus size={20} /> Create Chapter
                </button>
                <button 
                    onClick={handleFinalizeStory}
                    disabled={isExportingStory}
                    className="flex-1 py-3 bg-skyrim-gold hover:bg-yellow-400 text-skyrim-dark font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <BookOpen size={20} /> {isExportingStory ? 'Creating Book...' : 'Finalize as Book'}
                </button>
              </div>
              <button 
                  onClick={handleQuickExport}
                  disabled={isExportingStory || sortedChapters.length === 0}
                  className="py-2 bg-skyrim-dark hover:bg-skyrim-dark/80 text-skyrim-text text-sm font-bold rounded flex items-center justify-center gap-2 border border-skyrim-border disabled:opacity-50 transition-colors"
              >
                  <Download size={16} /> Quick Export (chapters only)
              </button>
          </div>
      ) : (
          <div className="mb-8 p-4 sm:p-6 bg-skyrim-paper/40 border border-skyrim-border rounded-lg">
              <h3 className="text-xl font-serif text-skyrim-gold mb-4">New Chapter</h3>
              
              <div className="mb-4">
                  <label className="text-sm uppercase tracking-wider text-skyrim-text font-bold block mb-2">Title</label>
                  <input 
                      type="text"
                      value={chapterTitle}
                      onChange={e => setChapterTitle(e.target.value)}
                      placeholder="Chapter title..."
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-3 text-skyrim-text focus:border-skyrim-gold focus:outline-none"
                  />
              </div>

              <div className="mb-4">
                  <label className="text-sm uppercase tracking-wider text-skyrim-text font-bold block mb-2">Content</label>
                  <textarea 
                      value={chapterContent}
                      onChange={e => setChapterContent(e.target.value)}
                      placeholder="Write your chapter or use AI..."
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-3 text-skyrim-text focus:border-skyrim-gold focus:outline-none resize-none h-32 font-sans"
                  />
              </div>

              <div className="mb-4 p-2 sm:p-4 bg-skyrim-paper/30 border border-skyrim-border rounded">
                  <p className="text-xs text-skyrim-text mb-3 uppercase tracking-wider font-bold">Or Generate with AI</p>
                  <div className="flex gap-2">
                      <input 
                          type="text"
                          value={chapterPrompt}
                          onChange={e => setChapterPrompt(e.target.value)}
                          placeholder="Describe what should happen in this chapter..."
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="flex-1 bg-skyrim-paper/50 border border-skyrim-border rounded p-2 text-skyrim-text text-sm focus:border-skyrim-gold focus:outline-none"
                      />
                      <button 
                          onClick={handleGenerateChapterWithAI}
                          disabled={!chapterPrompt.trim() || isGeneratingChapter}
                          className="px-4 py-2 bg-skyrim-accent hover:bg-skyrim-accent/80 text-white rounded text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                      >
                          {isGeneratingChapter ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      </button>
                  </div>
              </div>

              <div className="mb-4 p-2 sm:p-4 bg-skyrim-paper/30 border border-skyrim-border rounded">
                  <p className="text-xs text-skyrim-text mb-3 uppercase tracking-wider font-bold">Add Quest (Optional)</p>
                  <div className="grid gap-3">
                      <input
                          type="text"
                          value={questTitle}
                          onChange={e => setQuestTitle(e.target.value)}
                          placeholder="Quest title..."
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-2 text-skyrim-text text-sm focus:border-skyrim-gold focus:outline-none"
                      />
                      <input
                          type="text"
                          value={questLocation}
                          onChange={e => setQuestLocation(e.target.value)}
                          placeholder="Location (optional)..."
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-2 text-skyrim-text text-sm focus:border-skyrim-gold focus:outline-none"
                      />
                      <textarea
                          value={questDescription}
                          onChange={e => setQuestDescription(e.target.value)}
                          placeholder="Quest description..."
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-2 text-skyrim-text text-sm focus:border-skyrim-gold focus:outline-none resize-none h-20 font-sans"
                      />
                      <textarea
                          value={questObjectivesText}
                          onChange={e => setQuestObjectivesText(e.target.value)}
                          placeholder="Objectives (one per line)..."
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="w-full bg-skyrim-paper/50 border border-skyrim-border rounded p-2 text-skyrim-text text-sm focus:border-skyrim-gold focus:outline-none resize-none h-20 font-sans"
                      />
                      <button
                          onClick={handleAddQuestFromStory}
                          disabled={!questTitle.trim() || typeof onGameUpdate !== 'function'}
                          className="px-4 py-2 bg-skyrim-gold/90 hover:bg-skyrim-gold text-skyrim-dark rounded text-sm font-bold disabled:opacity-50"
                      >
                          Add Quest
                      </button>
                      {typeof onGameUpdate !== 'function' && (
                        <div className="text-[11px] text-gray-500">Quest creation requires game update wiring.</div>
                      )}
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                      onClick={handleCreateChapter}
                      disabled={!chapterTitle.trim() || !chapterContent.trim()}
                      className="flex-1 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-400 disabled:opacity-50"
                  >
                      Save Chapter
                  </button>
                  <button 
                      onClick={() => {
                          setCreatingChapter(false);
                          setChapterTitle('');
                          setChapterContent('');
                          setChapterPrompt('');
                      }}
                      className="flex-1 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      )}

            <div className="space-y-12">
                {sortedChapters.map((chapter) => (
          <div key={chapter.id} className="relative pl-8 md:pl-0">
             {/* Timeline Line */}
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-skyrim-border/30 md:left-1/2 md:-ml-0.5"></div>
             
             <div className="relative bg-skyrim-paper border border-skyrim-border p-8 rounded shadow-2xl max-w-3xl mx-auto">
                 {/* Decorative Header */}
                 <div className="flex justify-between items-center mb-6 border-b border-skyrim-border pb-4">
                     <div>
                         <h2 className="text-2xl font-serif text-skyrim-gold">{chapter.title}</h2>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-1">
                             <div className="flex items-center gap-2 uppercase tracking-widest">
                                 <Calendar size={12} />
                                 <span>{chapter.date}</span>
                             </div>
                             <div className="flex items-center gap-1 text-gray-600" title="Created timestamp">
                                 <Clock size={11} />
                                 <span className="text-[10px]">{formatTimestamp(chapter.createdAt)}</span>
                             </div>
                         </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Scroll className="text-skyrim-gold/20" size={40} />
                       <button onClick={() => {
                         if (window.confirm('Delete this entry? This cannot be undone.')) {
                           if (onDeleteChapter) {
                             onDeleteChapter(chapter.id);
                           } else {
                             // Fallback to soft delete
                             onUpdateChapter && onUpdateChapter({ ...chapter, deleted: true });
                           }
                         }
                       }} className="ml-2 text-red-500 hover:text-white text-xs border border-red-500 rounded px-2 py-1">Delete</button>
                     </div>
                 </div>
                 
                 {chapter.imageUrl ? (
                     <div className="mb-6 rounded overflow-hidden border border-skyrim-border shadow-inner">
                         <img src={chapter.imageUrl} alt={chapter.title} className="w-full object-cover max-h-80" />
                     </div>
                 ) : (
                     <div className="mb-6 flex justify-end">
                         <button 
                            onClick={() => handleVisualize(chapter)}
                            disabled={loadingId === chapter.id}
                            className="text-xs flex items-center gap-1 text-skyrim-gold hover:text-white disabled:opacity-50"
                         >
                            {loadingId === chapter.id ? <Loader2 className="animate-spin" size={12}/> : <ImageIcon size={12}/>}
                            Visualize Memory
                         </button>
                     </div>
                 )}

                 <div className="prose prose-invert prose-p:font-serif prose-p:text-skyrim-text prose-p:leading-relaxed max-w-none">
                     <p className="whitespace-pre-wrap">{chapter.content}</p>
                 </div>
             </div>
             
             {/* Timeline Dot */}
             <div className="absolute left-[-5px] top-10 w-3 h-3 bg-skyrim-gold rounded-full border border-skyrim-dark md:left-1/2 md:-ml-[7px] z-10 shadow-[0_0_10px_rgba(192,160,98,0.5)]"></div>
          </div>
        ))}

        {sortedChapters.length === 0 && (
            <div className="text-center py-20 text-gray-500 italic font-serif">
                The pages are blank. Begin your tale or consult the Scribe.
            </div>
        )}
      </div>
    </div>
  );
};