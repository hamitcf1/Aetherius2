import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Compass, ZoomIn, ZoomOut, Navigation, Castle, Mountain, Skull, Home, Shield, Flame, Eye, EyeOff, TreePine, Waves } from 'lucide-react';

// Location types with lore and rumors
export interface MapLocation {
  id: string;
  name: string;
  type: 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'camp' | 'fort' | 'ruin' | 'cave' | 'hold';
  x: number;
  y: number;
  hold?: string;
  description?: string;
  dangerLevel?: 'safe' | 'moderate' | 'dangerous' | 'deadly';
  faction?: string;
  rumors?: string[];
}

// Comprehensive Skyrim location database with lore
export const SKYRIM_LOCATIONS: MapLocation[] = [
  // Major Cities
  { id: 'whiterun', name: 'Whiterun', type: 'city', x: 42, y: 52, hold: 'Whiterun Hold', description: 'The central trade hub of Skyrim. Home to Dragonsreach and the Companions.', dangerLevel: 'safe', faction: 'Neutral', rumors: ['Dragons have returned to Skyrim', 'The Companions seek new blood', 'Jarl Balgruuf remains neutral in the war'] },
  { id: 'solitude', name: 'Solitude', type: 'city', x: 15, y: 17, hold: 'Haafingar', description: 'Capital of Skyrim and seat of the Empire. The Blue Palace overlooks all.', dangerLevel: 'safe', faction: 'Imperial', rumors: ['General Tullius plans a major offensive', 'The Bards College accepts talented musicians', 'High King Torygg was murdered by Ulfric'] },
  { id: 'windhelm', name: 'Windhelm', type: 'city', x: 82, y: 28, hold: 'Eastmarch', description: 'Ancient Nord city and Stormcloak capital. The oldest human settlement in Skyrim.', dangerLevel: 'safe', faction: 'Stormcloak', rumors: ['Ulfric Stormcloak rallies his forces', 'A killer stalks the streets at night', 'The Dark Elves face discrimination'] },
  { id: 'riften', name: 'Riften', type: 'city', x: 88, y: 78, hold: 'The Rift', description: 'A city of shadows and intrigue. The Thieves Guild operates beneath its streets.', dangerLevel: 'moderate', faction: 'Neutral', rumors: ['Maven Black-Briar controls everything', 'The Thieves Guild has fallen on hard times', 'Skooma flows through the Ratway'] },
  { id: 'markarth', name: 'Markarth', type: 'city', x: 8, y: 48, hold: 'The Reach', description: 'A Dwemer city carved into the mountainside. Blood and silver flow freely.', dangerLevel: 'moderate', faction: 'Imperial', rumors: ['The Forsworn terrorize the land', 'The silver mines hide dark secrets', 'Something lurks in the Dwemer ruins'] },
  { id: 'falkreath', name: 'Falkreath', type: 'city', x: 30, y: 82, hold: 'Falkreath Hold', description: 'A somber town surrounded by pine forests and its famous cemetery.', dangerLevel: 'safe', faction: 'Imperial', rumors: ['More dead rest here than living', 'Bandits plague the mountain passes', 'A daedric shrine lies in the woods'] },
  { id: 'morthal', name: 'Morthal', type: 'city', x: 28, y: 26, hold: 'Hjaalmarch', description: 'A mysterious town in the swamps. Strange lights dance at night.', dangerLevel: 'moderate', faction: 'Imperial', rumors: ['Vampires have been seen nearby', 'The Jarl is troubled by visions', 'A house burned under strange circumstances'] },
  { id: 'dawnstar', name: 'Dawnstar', type: 'city', x: 45, y: 12, hold: 'The Pale', description: 'A northern mining town on the Sea of Ghosts. Nightmares plague its citizens.', dangerLevel: 'safe', faction: 'Stormcloak', rumors: ['No one can sleep peacefully', 'A Daedric artifact may be the cause', 'Pirates raid the coast'] },
  { id: 'winterhold', name: 'Winterhold', type: 'city', x: 72, y: 12, hold: 'Winterhold', description: 'Once a great capital, now ruins. Only the College remains.', dangerLevel: 'safe', faction: 'Neutral', rumors: ['The Great Collapse destroyed the city', 'The College is blamed for the disaster', 'Strange experiments occur within'] },
  
  // Towns & Villages
  { id: 'riverwood', name: 'Riverwood', type: 'village', x: 40, y: 62, hold: 'Whiterun Hold', description: 'A peaceful lumber village along the White River.', dangerLevel: 'safe', rumors: ['The town fears dragon attacks', 'Gerdur runs the lumber mill'] },
  { id: 'rorikstead', name: 'Rorikstead', type: 'village', x: 22, y: 48, hold: 'Whiterun Hold', description: 'A farming community with unusually fertile lands.', dangerLevel: 'safe', rumors: ['The crops grow impossibly well', 'Dark bargains may explain the prosperity'] },
  { id: 'ivarstead', name: 'Ivarstead', type: 'village', x: 58, y: 62, hold: 'The Rift', description: 'A village at the base of the 7000 Steps.', dangerLevel: 'safe', rumors: ['Pilgrims pass through to High Hrothgar', 'A ghost haunts Shroud Hearth Barrow'] },
  { id: 'helgen', name: 'Helgen', type: 'town', x: 38, y: 78, hold: 'Falkreath Hold', description: 'A border town destroyed by dragon fire.', dangerLevel: 'dangerous', rumors: ['A dragon attacked during an execution', 'Bandits now occupy the ruins'] },
  { id: 'dragon_bridge', name: 'Dragon Bridge', type: 'village', x: 16, y: 24, hold: 'Haafingar', description: 'Named for the ancient bridge with dragon carvings.', dangerLevel: 'safe', rumors: ['Imperial soldiers pass through often', 'The Penitus Oculatus have an outpost'] },
  
  // Landmarks
  { id: 'high_hrothgar', name: 'High Hrothgar', type: 'landmark', x: 54, y: 56, description: 'Monastery of the Greybeards atop the Throat of the World.', dangerLevel: 'safe', rumors: ['The Greybeards study the Voice', 'Only the Dragonborn is summoned', 'Frost trolls roam the path'] },
  { id: 'throat_of_world', name: 'Throat of the World', type: 'landmark', x: 52, y: 52, description: 'The highest peak in all of Tamriel.', dangerLevel: 'moderate', rumors: ['An ancient dragon meditates at the summit', 'Paarthurnax guards a great secret'] },
  { id: 'college_winterhold', name: 'College of Winterhold', type: 'landmark', x: 74, y: 10, hold: 'Winterhold', description: 'The premier institution for magical study.', dangerLevel: 'safe', faction: 'College', rumors: ['Powerful artifacts fill the Arcanaeum', 'The Thalmor watch the College closely', 'Entry requires magical talent'] },
  
  // Dungeons
  { id: 'bleak_falls_barrow', name: 'Bleak Falls Barrow', type: 'dungeon', x: 38, y: 58, hold: 'Whiterun Hold', description: 'An ancient Nordic tomb infested with draugr.', dangerLevel: 'dangerous', rumors: ['Bandits guard the entrance', 'The Golden Claw opens the inner sanctum', 'A Word Wall lies within'] },
  { id: 'labyrinthian', name: 'Labyrinthian', type: 'ruin', x: 34, y: 30, hold: 'Hjaalmarch', description: 'Vast ruins of an ancient Nordic city.', dangerLevel: 'deadly', rumors: ['Dragon priests ruled here', 'The Staff of Magnus awaits', 'Many enter, few return'] },
  { id: 'blackreach', name: 'Blackreach', type: 'dungeon', x: 50, y: 36, description: 'A massive underground Dwemer cavern.', dangerLevel: 'deadly', rumors: ['Crimson Nirnroot grows here', 'The Falmer claim these depths', 'Dwemer automatons still patrol'] },
];

// Find location by name
export const findLocationByName = (name: string): MapLocation | undefined => {
  const normalized = name.toLowerCase().trim();
  let found = SKYRIM_LOCATIONS.find(loc => loc.name.toLowerCase() === normalized);
  if (found) return found;
  found = SKYRIM_LOCATIONS.find(loc => loc.name.toLowerCase().includes(normalized) || normalized.includes(loc.name.toLowerCase()));
  return found;
};

// Type for discovered locations that are dynamically added during gameplay
export interface DiscoveredLocation {
  name: string;
  type: 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'camp' | 'fort' | 'ruin' | 'cave';
  x: number;
  y: number;
  hold?: string;
  description?: string;
  dangerLevel?: 'safe' | 'moderate' | 'dangerous' | 'deadly';
  faction?: string;
  rumors?: string[];
  discoveredAt?: number; // timestamp when discovered
}

interface SkyrimMapProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
  visitedLocations?: string[];
  questLocations?: Array<{ name: string; questName: string }>;
  discoveredLocations?: DiscoveredLocation[]; // New locations discovered during gameplay
}

export const SkyrimMap: React.FC<SkyrimMapProps> = ({
  isOpen,
  onClose,
  currentLocation,
  visitedLocations = [],
  questLocations = [],
  discoveredLocations = [],
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showHolds, setShowHolds] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const currentLocationObj = currentLocation ? findLocationByName(currentLocation) : undefined;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Setup wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Merge base locations with discovered locations
  const allLocations = useMemo(() => {
    const baseLocations = SKYRIM_LOCATIONS.filter(loc => loc.type !== 'hold');
    
    // Convert discovered locations to MapLocation format
    const discovered: MapLocation[] = discoveredLocations.map(dl => ({
      id: `discovered_${dl.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: dl.name,
      type: dl.type,
      x: dl.x,
      y: dl.y,
      hold: dl.hold,
      description: dl.description,
      dangerLevel: dl.dangerLevel,
      faction: dl.faction,
      rumors: dl.rumors,
    }));
    
    // Merge, avoiding duplicates by name
    const existingNames = new Set(baseLocations.map(l => l.name.toLowerCase()));
    const newDiscovered = discovered.filter(d => !existingNames.has(d.name.toLowerCase()));
    
    return [...baseLocations, ...newDiscovered];
  }, [discoveredLocations]);

  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      if (filterType === 'all') return true;
      if (filterType === 'cities') return ['city', 'town', 'village'].includes(loc.type);
      if (filterType === 'dungeons') return ['dungeon', 'ruin', 'cave'].includes(loc.type);
      if (filterType === 'landmarks') return ['landmark', 'fort'].includes(loc.type);
      if (filterType === 'discovered') return loc.id.startsWith('discovered_');
      return true;
    });
  }, [filterType, allLocations]);

  const getMarkerColor = (location: MapLocation): string => {
    if (currentLocationObj?.id === location.id) return '#22c55e';
    if (visitedLocations.some(v => findLocationByName(v)?.id === location.id)) return '#3b82f6';
    if (questLocations.some(q => findLocationByName(q.name)?.id === location.id)) return '#eab308';
    switch (location.type) {
      case 'city': return '#d4a44a';
      case 'town': return '#b8860b';
      case 'village': return '#8b7355';
      case 'dungeon': return '#dc2626';
      case 'landmark': return '#a855f7';
      case 'ruin': return '#ea580c';
      default: return '#9ca3af';
    }
  };

  const getMarkerIcon = (location: MapLocation) => {
    const color = getMarkerColor(location);
    const isCurrent = currentLocationObj?.id === location.id;
    const size = location.type === 'city' ? 22 : location.type === 'town' ? 18 : 14;
    switch (location.type) {
      case 'city': return <Castle size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'town': case 'village': return <Home size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'dungeon': case 'cave': return <Skull size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'landmark': return <Mountain size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'ruin': return <Flame size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'fort': return <Shield size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      default: return <Mountain size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
    }
  };

  const getDangerColor = (level?: string) => {
    switch (level) {
      case 'safe': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'dangerous': return 'text-orange-400';
      case 'deadly': return 'text-red-400';
      default: return 'text-skyrim-text';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-skyrim-dark/90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-skyrim-border bg-skyrim-paper">
        <div className="flex items-center gap-3">
          <Compass className="text-skyrim-gold" size={28} />
          <div>
            <h2 className="text-2xl font-serif text-skyrim-gold tracking-wide">Map of Skyrim</h2>
            {currentLocation && (
              <p className="text-sm text-skyrim-text">
                Current Location: <span className="text-green-400 font-semibold">{currentLocation}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-skyrim-paper/50 rounded-lg p-1">
            {['all', 'cities', 'dungeons', 'landmarks', ...(discoveredLocations.length > 0 ? ['discovered'] : [])].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded text-xs transition-colors ${filterType === type ? 'bg-skyrim-gold text-black font-bold' : 'text-skyrim-text hover:text-white'}`}
              >
                {type === 'discovered' ? `New (${discoveredLocations.length})` : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowHolds(!showHolds)} className={`p-2 rounded transition-colors ${showHolds ? 'bg-skyrim-gold/20 text-skyrim-gold' : 'text-gray-500'}`} title="Show Hold Names">
            {showHolds ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={() => setZoom(prev => Math.min(3, prev + 0.2))} className="p-2 bg-skyrim-paper/60 border border-skyrim-gold/50 rounded hover:bg-skyrim-gold/20">
            <ZoomIn size={18} className="text-skyrim-gold" />
          </button>
          <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))} className="p-2 bg-skyrim-paper/60 border border-skyrim-gold/50 rounded hover:bg-skyrim-gold/20">
            <ZoomOut size={18} className="text-skyrim-gold" />
          </button>
          <button onClick={() => setShowLabels(!showLabels)} className={`px-3 py-2 border rounded text-sm ${showLabels ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold' : 'border-skyrim-border text-skyrim-text'}`}>
            Labels
          </button>
          {currentLocationObj && (
            <button onClick={() => setPan({ x: -(currentLocationObj.x - 50) * zoom * 8, y: -(currentLocationObj.y - 50) * zoom * 6 })} className="p-2 bg-skyrim-paper/60 border border-green-500/50 rounded hover:bg-green-500/20" title="Center on current location">
              <Navigation size={18} className="text-green-400" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-skyrim-text hover:text-white ml-2">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="transition-transform duration-100"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Map wrapper with fixed aspect ratio - markers positioned relative to this */}
          <div className="relative" style={{ width: '800px', height: '800px' }}>
            {/* Custom SVG Map */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a1810" />
                  <stop offset="50%" stopColor="#252318" />
                  <stop offset="100%" stopColor="#1a1510" />
                </linearGradient>
                <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5a5a5a" />
                  <stop offset="100%" stopColor="#2a2a2a" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a1825" />
                <stop offset="100%" stopColor="#051520" />
              </linearGradient>
              <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a3525" />
                <stop offset="100%" stopColor="#0a1812" />
              </linearGradient>
              <pattern id="snow" patternUnits="userSpaceOnUse" width="4" height="4">
                <circle cx="1" cy="1" r="0.3" fill="#fff" opacity="0.08"/>
                <circle cx="3" cy="3" r="0.2" fill="#fff" opacity="0.06"/>
              </pattern>
              <pattern id="trees" patternUnits="userSpaceOnUse" width="3" height="3">
                <path d="M1.5 0 L2.2 2.5 L0.8 2.5 Z" fill="#1a3020" opacity="0.4"/>
              </pattern>
            </defs>
            
            {/* Background */}
            <rect width="100" height="100" fill="url(#mapBg)" />
            
            {/* Sea of Ghosts (North) */}
            <path d="M0 0 L100 0 L100 10 Q85 14 70 11 Q55 8 40 12 Q25 15 10 10 L0 8 Z" fill="url(#waterGrad)" />
            <path d="M0 0 L0 12 Q8 16 12 12 Q18 8 22 10 L30 0" fill="url(#waterGrad)" opacity="0.9" />
            
            {/* Coastlines - waves */}
            <path d="M5 10 Q10 8 15 10 Q20 12 25 10" stroke="#1a3540" strokeWidth="0.2" fill="none" opacity="0.5" />
            <path d="M60 10 Q70 8 80 11" stroke="#1a3540" strokeWidth="0.2" fill="none" opacity="0.5" />
            
            {/* Mountain Ranges with peaks */}
            {/* Throat of the World / Central Mountains */}
            <g opacity="0.8">
              <path d="M45 42 L52 48 L55 42 L60 50 L65 44 L58 58 L48 58 L42 50 Z" fill="url(#mountainGrad)" />
              <path d="M48 45 L52 50 L56 45 L54 52 L50 54 L46 50 Z" fill="#4a4a4a" />
              <polygon points="52,46 54,51 50,51" fill="#6a6a6a" />
              <text x="52" y="44" textAnchor="middle" fill="#666" fontSize="1.8" fontStyle="italic">Throat of</text>
              <text x="52" y="46" textAnchor="middle" fill="#666" fontSize="1.8" fontStyle="italic">the World</text>
            </g>
            
            {/* Western Mountains (The Reach) */}
            <g opacity="0.7">
              <path d="M2 38 L8 45 L5 52 L10 58 L6 68 L2 62 L0 48 Z" fill="url(#mountainGrad)" />
              <path d="M5 42 L12 52 L8 58 L14 65 L10 72 L4 65 Z" fill="#3a3a3a" />
            </g>
            
            {/* Northern Mountains */}
            <g opacity="0.6">
              <path d="M62 8 L70 16 L78 10 L85 20 L75 24 L65 18 Z" fill="url(#mountainGrad)" />
              <path d="M80 14 L88 22 L95 16 L92 28 L85 30 L78 22 Z" fill="#3a3a3a" />
            </g>
            
            {/* Eastern Mountains (Velothi) */}
            <g opacity="0.65">
              <path d="M90 25 L96 38 L100 50 L100 65 L95 55 L92 42 L88 32 Z" fill="url(#mountainGrad)" />
              <path d="M94 48 L100 62 L100 78 L96 68 L92 55 Z" fill="#3a3a3a" />
            </g>
            
            {/* Southern Mountains (Jerall) */}
            <g opacity="0.55">
              <path d="M20 88 L32 94 L45 90 L58 95 L72 88 L80 95 L72 100 L48 100 L25 100 L15 94 Z" fill="url(#mountainGrad)" />
            </g>
            
            {/* Forests */}
            <ellipse cx="32" cy="78" rx="14" ry="10" fill="url(#forestGrad)" opacity="0.5" />
            <ellipse cx="32" cy="78" rx="14" ry="10" fill="url(#trees)" />
            <ellipse cx="80" cy="72" rx="12" ry="14" fill="url(#forestGrad)" opacity="0.45" />
            <ellipse cx="80" cy="72" rx="12" ry="14" fill="url(#trees)" />
            <circle cx="40" cy="68" r="6" fill="url(#forestGrad)" opacity="0.35" />
            <circle cx="68" cy="58" r="5" fill="url(#forestGrad)" opacity="0.3" />
            
            {/* Swamps (Hjaalmarch) */}
            <ellipse cx="28" cy="28" rx="10" ry="6" fill="#0a1815" opacity="0.5" />
            <path d="M20 26 Q25 24 30 26 Q35 28 38 26" stroke="#1a2825" strokeWidth="0.3" fill="none" />
            <path d="M22 30 Q28 28 34 30" stroke="#1a2825" strokeWidth="0.2" fill="none" />
            
            {/* Snow overlay for north */}
            <rect x="0" y="0" width="100" height="22" fill="url(#snow)" />
            <rect x="60" y="0" width="40" height="35" fill="url(#snow)" opacity="0.6" />
            
            {/* Rivers */}
            <g stroke="#1a3545" strokeWidth="0.5" fill="none" opacity="0.7">
              <path d="M78 28 Q72 40 74 52 Q72 62 68 72 Q62 82 58 92" />
              <path d="M32 28 Q36 38 40 48 Q42 55 42 58" />
              <path d="M10 50 Q18 56 24 65 Q28 75 32 85" />
            </g>
            
            {/* Roads */}
            <g stroke="#3d352a" strokeWidth="0.35" fill="none" strokeDasharray="1.5,0.8" opacity="0.45">
              <path d="M15 17 Q22 22 28 26" />
              <path d="M28 26 Q36 40 42 52" />
              <path d="M42 52 Q62 48 82 28" />
              <path d="M42 52 Q55 65 65 70 Q78 76 88 78" />
              <path d="M42 52 Q36 68 30 82" />
              <path d="M42 52 Q28 50 8 48" />
              <path d="M45 12 Q44 32 42 52" />
              <path d="M45 12 Q58 12 72 12" />
            </g>
            
            {/* Hold Names */}
            {showHolds && (
              <g fontFamily="serif" fontStyle="italic" opacity="0.4">
                <text x="12" y="14" fill="#8B7355" fontSize="2.5">HAAFINGAR</text>
                <text x="8" y="40" fill="#8B7355" fontSize="2.5">THE REACH</text>
                <text x="38" y="40" fill="#8B7355" fontSize="2.3">WHITERUN</text>
                <text x="38" y="43" fill="#8B7355" fontSize="2.3">HOLD</text>
                <text x="45" y="18" fill="#8B7355" fontSize="2.5">THE PALE</text>
                <text x="75" y="35" fill="#8B7355" fontSize="2.5">EASTMARCH</text>
                <text x="78" y="65" fill="#8B7355" fontSize="2.5">THE RIFT</text>
                <text x="28" y="75" fill="#8B7355" fontSize="2.3">FALKREATH</text>
                <text x="28" y="78" fill="#8B7355" fontSize="2.3">HOLD</text>
                <text x="25" y="22" fill="#8B7355" fontSize="2.3">HJAALMARCH</text>
                <text x="68" y="18" fill="#8B7355" fontSize="2.3">WINTERHOLD</text>
              </g>
            )}
            
            {/* Compass Rose */}
            <g transform="translate(92,92)">
              <circle cx="0" cy="0" r="5" fill="#1a1510" stroke="#8B7355" strokeWidth="0.3" />
              <path d="M0 -4 L0.8 0 L0 4 L-0.8 0 Z" fill="#d4a44a" />
              <path d="M-4 0 L0 0.8 L4 0 L0 -0.8 Z" fill="#8B7355" opacity="0.7" />
              <text x="0" y="-5.5" textAnchor="middle" fill="#d4a44a" fontSize="1.8" fontWeight="bold">N</text>
              <text x="5.5" y="0.5" textAnchor="middle" fill="#8B7355" fontSize="1.3">E</text>
              <text x="-5.5" y="0.5" textAnchor="middle" fill="#8B7355" fontSize="1.3">W</text>
              <text x="0" y="6.5" textAnchor="middle" fill="#8B7355" fontSize="1.3">S</text>
            </g>
            
            {/* Title */}
            <g transform="translate(85,6)">
              <rect x="-10" y="-3" width="20" height="8" fill="#1a1510" stroke="#8B7355" strokeWidth="0.25" rx="0.5" opacity="0.9" />
              <text x="0" y="0" textAnchor="middle" fill="#d4a44a" fontSize="3" fontFamily="serif" fontWeight="bold">SKYRIM</text>
              <text x="0" y="3" textAnchor="middle" fill="#8B7355" fontSize="1.4">Province of Tamriel</text>
            </g>
            
            {/* Scale */}
            <g transform="translate(6,95)">
              <line x1="0" y1="0" x2="12" y2="0" stroke="#8B7355" strokeWidth="0.4" />
              <line x1="0" y1="-0.8" x2="0" y2="0.8" stroke="#8B7355" strokeWidth="0.25" />
              <line x1="6" y1="-0.5" x2="6" y2="0.5" stroke="#8B7355" strokeWidth="0.2" />
              <line x1="12" y1="-0.8" x2="12" y2="0.8" stroke="#8B7355" strokeWidth="0.25" />
              <text x="6" y="2.5" textAnchor="middle" fill="#8B7355" fontSize="1.4">~100 miles</text>
            </g>
          </svg>

          {/* Location Markers */}
          {filteredLocations.map(location => {
            const isQuest = questLocations.some(q => findLocationByName(q.name)?.id === location.id);
            const isCurrent = currentLocationObj?.id === location.id;
            const isVisited = visitedLocations.some(v => findLocationByName(v)?.id === location.id);
            
            return (
              <div
                key={location.id}
                className={`absolute cursor-pointer transition-all duration-200 hover:scale-125 ${isCurrent ? 'z-30 animate-pulse' : isQuest ? 'z-20' : 'z-10'}`}
                style={{ left: `${location.x}%`, top: `${location.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={() => setSelectedLocation(location)}
                title={location.name}
              >
                <div className={`relative ${isCurrent ? 'drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]' : 'drop-shadow-md'}`}>
                  {getMarkerIcon(location)}
                  {isCurrent && <div className="absolute -inset-2 rounded-full border-2 border-green-400 animate-ping opacity-40" />}
                  {isQuest && !isCurrent && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-bounce" />}
                </div>
                {showLabels && (location.type === 'city' || isCurrent || isVisited) && (
                  <span className={`absolute left-full ml-1 text-[10px] whitespace-nowrap font-bold px-1 rounded ${isCurrent ? 'text-green-400 bg-skyrim-dark/90' : isVisited ? 'text-blue-300 bg-skyrim-dark/85' : 'text-skyrim-text bg-skyrim-dark/75'}`} style={{ textShadow: '1px 1px 2px black' }}>
                    {location.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        </div>

        {/* Location Details Panel */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 bg-skyrim-paper border border-skyrim-gold/50 rounded-lg p-4 max-w-md z-40 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getMarkerIcon(selectedLocation)}
                <div>
                  <h3 className="text-lg font-serif text-skyrim-gold">{selectedLocation.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 uppercase">{selectedLocation.type}</span>
                    {selectedLocation.hold && <span className="text-gray-600">• {selectedLocation.hold}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLocation(null)} className="text-skyrim-text hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            {selectedLocation.description && (
              <p className="text-sm text-skyrim-text mb-3 leading-relaxed italic">"{selectedLocation.description}"</p>
            )}
            
            <div className="flex items-center gap-4 text-xs mb-3">
              {selectedLocation.dangerLevel && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Danger:</span>
                  <span className={getDangerColor(selectedLocation.dangerLevel)}>{selectedLocation.dangerLevel}</span>
                </div>
              )}
              {selectedLocation.faction && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Faction:</span>
                  <span className={selectedLocation.faction === 'Imperial' ? 'text-red-400' : selectedLocation.faction === 'Stormcloak' ? 'text-blue-400' : 'text-gray-300'}>
                    {selectedLocation.faction}
                  </span>
                </div>
              )}
            </div>

            {selectedLocation.rumors && selectedLocation.rumors.length > 0 && (
              <div className="border-t border-skyrim-border pt-3 mt-2">
                <h4 className="text-xs text-skyrim-gold font-semibold mb-2">📜 Rumors & Knowledge</h4>
                <ul className="space-y-1.5">
                  {selectedLocation.rumors.map((rumor, idx) => (
                    <li key={idx} className="text-xs text-skyrim-text flex items-start gap-2">
                      <span className="text-skyrim-gold/50">•</span>
                      <span className="italic">"{rumor}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex gap-2 mt-3 flex-wrap">
              {currentLocationObj?.id === selectedLocation.id && (
                <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">📍 You are here</span>
              )}
              {visitedLocations.some(v => findLocationByName(v)?.id === selectedLocation.id) && (
                <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">✓ Visited</span>
              )}
              {questLocations.find(q => findLocationByName(q.name)?.id === selectedLocation.id) && (
                <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded">
                  ⚔️ {questLocations.find(q => findLocationByName(q.name)?.id === selectedLocation.id)?.questName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-skyrim-dark/90 border border-skyrim-border rounded-lg p-3 text-xs z-30">
          <h4 className="text-skyrim-gold font-semibold mb-2 flex items-center gap-1">
            <Compass size={12} /> Legend
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><Castle size={12} color="#22c55e" fill="#22c55e" /><span className="text-green-400">Current Location</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full" /><span className="text-yellow-400">Quest Objective</span></div>
            <div className="flex items-center gap-2"><Castle size={12} color="#3b82f6" /><span className="text-blue-400">Visited</span></div>
            <div className="border-t border-skyrim-border my-2" />
            <div className="flex items-center gap-2"><Castle size={12} color="#d4a44a" /><span className="text-skyrim-text">City</span></div>
            <div className="flex items-center gap-2"><Home size={12} color="#8b7355" /><span className="text-skyrim-text">Town/Village</span></div>
            <div className="flex items-center gap-2"><Skull size={12} color="#dc2626" /><span className="text-skyrim-text">Dungeon</span></div>
            <div className="flex items-center gap-2"><Mountain size={12} color="#a855f7" /><span className="text-skyrim-text">Landmark</span></div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-skyrim-paper/60 rounded px-3 py-2 text-xs text-skyrim-text z-30">
          Drag to pan • Scroll to zoom • Click markers for info
        </div>
      </div>
    </div>
  );
};

export default SkyrimMap;
