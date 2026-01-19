import React, { useState, useMemo } from 'react';
import { 
  SKYRIM_LOCATIONS, 
  TravelLocation, 
  calculateTravelCost, 
  formatTravelTime,
  getAvailableDestinations,
  hasCarriageService,
  HoldName,
} from '../services/fastTravelService';

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationId: string;
  discoveredLocations: string[];
  playerGold: number;
  onTravel: (destination: TravelLocation, useCarriage: boolean, cost: { gold: number; timeHours: number }) => void;
}

const TravelModal: React.FC<TravelModalProps> = ({
  isOpen,
  onClose,
  currentLocationId,
  discoveredLocations,
  playerGold,
  onTravel,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<TravelLocation | null>(null);
  const [useCarriage, setUseCarriage] = useState(false);
  const [filterHold, setFilterHold] = useState<HoldName | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'city' | 'town' | 'dungeon'>('all');

  // Build locations with discovered status
  const locations = useMemo(() => {
    return SKYRIM_LOCATIONS.map(loc => ({
      ...loc,
      discovered: discoveredLocations.includes(loc.id) || loc.discovered,
    }));
  }, [discoveredLocations]);

  const currentLocation = useMemo(() => 
    locations.find(l => l.id === currentLocationId) || locations[0],
    [locations, currentLocationId]
  );

  const canUseCarriage = hasCarriageService(currentLocation);

  // Filter available destinations
  const availableDestinations = useMemo(() => {
    let destinations = getAvailableDestinations(currentLocation, locations, useCarriage);
    
    if (filterHold !== 'all') {
      destinations = destinations.filter(d => d.hold === filterHold);
    }
    
    if (filterType !== 'all') {
      if (filterType === 'city') {
        destinations = destinations.filter(d => d.type === 'city' || d.type === 'town');
      } else if (filterType === 'dungeon') {
        destinations = destinations.filter(d => 
          ['dungeon', 'nordic_ruin', 'cave', 'mine', 'ruin'].includes(d.type)
        );
      }
    }
    
    return destinations.sort((a, b) => a.name.localeCompare(b.name));
  }, [currentLocation, locations, useCarriage, filterHold, filterType]);

  // Calculate cost for selected destination
  const travelCost = useMemo(() => {
    if (!selectedDestination) return null;
    return calculateTravelCost(currentLocation, selectedDestination, useCarriage);
  }, [currentLocation, selectedDestination, useCarriage]);

  const canAffordTravel = !travelCost || playerGold >= travelCost.gold;

  const handleTravel = () => {
    if (!selectedDestination || !travelCost || !canAffordTravel) return;
    onTravel(selectedDestination, useCarriage, { gold: travelCost.gold, timeHours: travelCost.timeHours });
    onClose();
  };

  if (!isOpen) return null;

  const holds: HoldName[] = [
    'Whiterun', 'Haafingar', 'Eastmarch', 'The Rift', 'The Reach',
    'Falkreath', 'The Pale', 'Winterhold', 'Hjaalmarch'
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      city: '🏰',
      town: '🏘️',
      village: '🏚️',
      fort: '🏯',
      camp: '⛺',
      ruin: '🏚️',
      cave: '🕳️',
      mine: '⛏️',
      dungeon: '💀',
      tower: '🗼',
      landmark: '⭐',
      farm: '🌾',
      mill: '🏭',
      estate: '🏠',
      dock: '⚓',
      standing_stone: '🪨',
      dragon_lair: '🐉',
      giant_camp: '👹',
      bandit_camp: '🏴',
      nordic_ruin: '⚔️',
    };
    return icons[type] || '📍';
  };

  const getDangerColor = (level?: number) => {
    if (!level || level <= 2) return '#10B981';
    if (level <= 4) return '#F59E0B';
    if (level <= 6) return '#F97316';
    if (level <= 8) return '#EF4444';
    return '#DC2626';
  };

  return (
    <div className="modal-overlay travel-modal" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '950px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #4a5568',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #4a5568',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#F59E0B', fontSize: '1.5rem' }}>
              🗺️ Fast Travel
            </h2>
            <p style={{ margin: '5px 0 0', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Current location: <strong style={{ color: '#fff' }}>{currentLocation.name}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#FFD700', fontSize: '1.1rem' }}>
              💰 {playerGold}g
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Travel Mode */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Mode:</span>
            <button
              onClick={() => setUseCarriage(false)}
              style={{
                padding: '6px 12px',
                background: !useCarriage ? '#F59E0B' : 'transparent',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                color: !useCarriage ? '#000' : '#F59E0B',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              🚶 Walk (Free)
            </button>
            <button
              onClick={() => canUseCarriage && setUseCarriage(true)}
              disabled={!canUseCarriage}
              style={{
                padding: '6px 12px',
                background: useCarriage ? '#F59E0B' : 'transparent',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                color: useCarriage ? '#000' : '#F59E0B',
                cursor: canUseCarriage ? 'pointer' : 'not-allowed',
                opacity: canUseCarriage ? 1 : 0.5,
                fontSize: '0.85rem',
              }}
            >
              🐴 Carriage
            </button>
          </div>

          {/* Hold Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Hold:</span>
            <select
              value={filterHold}
              onChange={e => setFilterHold(e.target.value as HoldName | 'all')}
              style={{
                padding: '6px 10px',
                background: '#374151',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="all">All Holds</option>
              {holds.map(hold => (
                <option key={hold} value={hold}>{hold}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Type:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as 'all' | 'city' | 'town' | 'dungeon')}
              style={{
                padding: '6px 10px',
                background: '#374151',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="all">All Types</option>
              <option value="city">Cities & Towns</option>
              <option value="dungeon">Dungeons & Ruins</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Locations List */}
          <div style={{ 
            flex: 1, 
            borderRight: '1px solid #4a5568',
            overflowY: 'auto',
            padding: '15px',
          }}>
            {availableDestinations.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#6B7280',
                paddingTop: '40px',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗺️</div>
                <p>No discovered locations match your filters.</p>
                <p style={{ fontSize: '0.85rem' }}>Explore more of Skyrim to discover new places!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
              }}>
                {availableDestinations.map(location => {
                  const isSelected = selectedDestination?.id === location.id;
                  const cost = calculateTravelCost(currentLocation, location, useCarriage);
                  
                  return (
                    <div
                      key={location.id}
                      onClick={() => setSelectedDestination(location)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected 
                          ? 'rgba(245, 158, 11, 0.2)' 
                          : 'rgba(55, 65, 81, 0.5)',
                        border: `2px solid ${isSelected ? '#F59E0B' : '#374151'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {getTypeIcon(location.type)}
                        </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: '#fff',
                          fontSize: '0.95rem',
                        }}>
                          {location.name}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#9CA3AF',
                      }}>
                        <span>{location.hold}</span>
                        <span>⏱️ {formatTravelTime(cost.timeHours)}</span>
                      </div>
                      {location.dangerLevel && !useCarriage && (
                        <div style={{
                          marginTop: '4px',
                          fontSize: '0.7rem',
                          color: getDangerColor(location.dangerLevel),
                        }}>
                          ⚠️ Danger: {location.dangerLevel}/10
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div style={{ 
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {selectedDestination ? (
              <>
                {/* Location Details */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #374151',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}>
                    <span style={{ fontSize: '2rem' }}>
                      {getTypeIcon(selectedDestination.type)}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, color: '#F59E0B' }}>
                        {selectedDestination.name}
                      </h3>
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                        {selectedDestination.hold}
                      </span>
                    </div>
                  </div>
                  <p style={{ 
                    color: '#D1D5DB', 
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {selectedDestination.description}
                  </p>
                </div>

                {/* Services */}
                {selectedDestination.services && selectedDestination.services.length > 0 && (
                  <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #374151',
                  }}>
                    <h4 style={{ margin: '0 0 10px', color: '#82E0AA', fontSize: '0.9rem' }}>
                      Services Available
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedDestination.services.map(service => {
                        const icons: Record<string, string> = {
                          inn: '🛏️ Inn',
                          shop: '🏪 Shop',
                          blacksmith: '⚒️ Blacksmith',
                          temple: '⛪ Temple',
                          stables: '🐴 Stables',
                          carriage: '🚗 Carriage',
                        };
                        return (
                          <span
                            key={service}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(130, 224, 170, 0.15)',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              color: '#82E0AA',
                            }}
                          >
                            {icons[service] || service}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Travel Cost */}
                {travelCost && (
                  <div style={{
                    padding: '20px',
                    flex: 1,
                  }}>
                    <h4 style={{ margin: '0 0 15px', color: '#fff', fontSize: '0.95rem' }}>
                      Travel Details
                    </h4>
                    <div style={{
                      display: 'grid',
                      gap: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'rgba(55, 65, 81, 0.5)',
                        borderRadius: '6px',
                      }}>
                        <span style={{ color: '#9CA3AF' }}>⏱️ Time</span>
                        <span style={{ color: '#fff' }}>{formatTravelTime(travelCost.timeHours)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'rgba(55, 65, 81, 0.5)',
                        borderRadius: '6px',
                      }}>
                        <span style={{ color: '#9CA3AF' }}>💰 Cost</span>
                        <span style={{ 
                          color: canAffordTravel ? '#FFD700' : '#EF4444',
                          fontWeight: 'bold',
                        }}>
                          {travelCost.gold > 0 ? `${travelCost.gold}g` : 'Free'}
                        </span>
                      </div>
                      {!useCarriage && travelCost.dangerRating > 0 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px',
                          background: 'rgba(55, 65, 81, 0.5)',
                          borderRadius: '6px',
                        }}>
                          <span style={{ color: '#9CA3AF' }}>⚠️ Danger</span>
                          <span style={{ color: getDangerColor(travelCost.dangerRating) }}>
                            {travelCost.dangerRating}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {!useCarriage && travelCost.dangerRating > 3 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#FCA5A5',
                      }}>
                        ⚠️ High danger! You may encounter enemies on the road.
                      </div>
                    )}
                  </div>
                )}

                {/* Travel Button */}
                <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
                  <button
                    onClick={handleTravel}
                    disabled={!canAffordTravel}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: canAffordTravel 
                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                        : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      color: canAffordTravel ? '#000' : '#6B7280',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: canAffordTravel ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                  >
                    {useCarriage ? '🐴' : '🚶'} Travel to {selectedDestination.name}
                  </button>
                  {!canAffordTravel && (
                    <p style={{
                      margin: '10px 0 0',
                      textAlign: 'center',
                      color: '#EF4444',
                      fontSize: '0.85rem',
                    }}>
                      Not enough gold for carriage
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                padding: '20px',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🗺️</div>
                <p style={{ textAlign: 'center' }}>
                  Select a destination to view details and travel options.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelModal;
