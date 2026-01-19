import React, { useState, useMemo } from 'react';
import {
  FactionId,
  FACTIONS,
  FactionReputation,
  getReputationLevel,
  getReputationDisplayName,
  getFactionRank,
  canJoinFaction,
  ReputationLevel,
} from '../services/factionService';

interface FactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  factionReputations: FactionReputation[];
  onJoinFaction?: (factionId: FactionId) => void;
}

const FactionModal: React.FC<FactionModalProps> = ({
  isOpen,
  onClose,
  factionReputations,
  onJoinFaction,
}) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'guild' | 'political' | 'hold'>('all');

  // Get reputation for a faction
  const getReputation = (factionId: FactionId): FactionReputation | undefined => {
    return factionReputations.find(r => r.factionId === factionId);
  };

  // Filter factions
  const filteredFactions = useMemo(() => {
    return Object.values(FACTIONS).filter(faction => {
      if (filterType === 'all') return true;
      if (filterType === 'hold') return faction.type === 'hold';
      if (filterType === 'guild') return faction.type === 'guild';
      if (filterType === 'political') return faction.type === 'political' || faction.type === 'religious';
      return true;
    });
  }, [filterType]);

  // Get joined factions
  const joinedFactions = useMemo(() => {
    return factionReputations.filter(r => r.joined);
  }, [factionReputations]);

  if (!isOpen) return null;

  const getReputationColor = (level: ReputationLevel): string => {
    const colors: Record<ReputationLevel, string> = {
      hated: '#DC2626',
      hostile: '#EF4444',
      unfriendly: '#F97316',
      neutral: '#9CA3AF',
      friendly: '#10B981',
      honored: '#3B82F6',
      revered: '#8B5CF6',
      exalted: '#FFD700',
    };
    return colors[level];
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      guild: '⚔️',
      political: '🏛️',
      religious: '⛪',
      hold: '🏰',
      hostile: '💀',
    };
    return icons[type] || '📍';
  };

  const renderReputationBar = (reputation: number) => {
    const normalized = (reputation + 1000) / 2000; // Convert -1000 to 1000 -> 0 to 1
    const level = getReputationLevel(reputation);
    const color = getReputationColor(level);
    
    return (
      <div style={{
        width: '100%',
        height: '8px',
        background: '#374151',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Center marker (neutral) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '2px',
          background: '#6B7280',
          transform: 'translateX(-50%)',
        }} />
        {/* Reputation bar */}
        <div style={{
          position: 'absolute',
          left: reputation < 0 ? `${normalized * 100}%` : '50%',
          width: `${Math.abs(normalized - 0.5) * 100}%`,
          height: '100%',
          background: color,
          borderRadius: reputation < 0 ? '4px 0 0 4px' : '0 4px 4px 0',
        }} />
      </div>
    );
  };

  const selectedFactionData = selectedFaction ? FACTIONS[selectedFaction] : null;
  const selectedRep = selectedFaction ? getReputation(selectedFaction) : null;

  return (
    <div className="modal-overlay faction-modal" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '900px',
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
            <h2 style={{ margin: 0, color: '#8B5CF6', fontSize: '1.5rem' }}>
              🏛️ Factions & Reputation
            </h2>
            <p style={{ margin: '5px 0 0', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Your standing with Skyrim's organizations
            </p>
          </div>
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

        {/* Joined Factions Summary */}
        {joinedFactions.length > 0 && (
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #374151',
            background: 'rgba(139, 92, 246, 0.1)',
          }}>
            <h4 style={{ margin: '0 0 10px', color: '#8B5CF6', fontSize: '0.9rem' }}>
              Your Memberships
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {joinedFactions.map(rep => {
                const faction = FACTIONS[rep.factionId];
                const rank = getFactionRank(rep);
                return (
                  <div
                    key={rep.factionId}
                    onClick={() => setSelectedFaction(rep.factionId)}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid #8B5CF6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {getTypeIcon(faction.type)} {faction.name}
                    </div>
                    {rank && (
                      <div style={{ color: '#A78BFA', fontSize: '0.75rem' }}>
                        {rank}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          gap: '10px',
        }}>
          {(['all', 'guild', 'political', 'hold'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '6px 14px',
                background: filterType === type ? '#8B5CF6' : 'transparent',
                border: '1px solid #8B5CF6',
                borderRadius: '6px',
                color: filterType === type ? '#fff' : '#8B5CF6',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textTransform: 'capitalize',
              }}
            >
              {type === 'all' ? 'All' : type === 'guild' ? 'Guilds' : type === 'political' ? 'Political' : 'Holds'}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Factions List */}
          <div style={{ 
            flex: 1, 
            borderRight: '1px solid #4a5568',
            overflowY: 'auto',
            padding: '15px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {filteredFactions.map(faction => {
                const rep = getReputation(faction.id);
                const reputation = rep?.reputation || 0;
                const level = getReputationLevel(reputation);
                const isSelected = selectedFaction === faction.id;
                
                return (
                  <div
                    key={faction.id}
                    onClick={() => setSelectedFaction(faction.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isSelected 
                        ? 'rgba(139, 92, 246, 0.2)' 
                        : 'rgba(55, 65, 81, 0.3)',
                      border: `2px solid ${isSelected ? '#8B5CF6' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getTypeIcon(faction.type)}</span>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>
                          {faction.name}
                        </span>
                        {rep?.joined && (
                          <span style={{
                            padding: '2px 6px',
                            background: '#8B5CF6',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            color: '#fff',
                          }}>
                            MEMBER
                          </span>
                        )}
                      </div>
                      <span style={{ 
                        color: getReputationColor(level),
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}>
                        {getReputationDisplayName(level)}
                      </span>
                    </div>
                    {renderReputationBar(reputation)}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                      fontSize: '0.7rem',
                      color: '#6B7280',
                    }}>
                      <span>-1000</span>
                      <span>{reputation}</span>
                      <span>+1000</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Panel */}
          <div style={{ 
            width: '340px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {selectedFactionData ? (
              <>
                {/* Faction Details */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #374151',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: '2.5rem' }}>
                      {getTypeIcon(selectedFactionData.type)}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, color: '#8B5CF6' }}>
                        {selectedFactionData.name}
                      </h3>
                      <span style={{ 
                        color: '#9CA3AF', 
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                      }}>
                        {selectedFactionData.type} Organization
                      </span>
                    </div>
                  </div>
                  <p style={{ 
                    color: '#D1D5DB', 
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {selectedFactionData.description}
                  </p>
                </div>

                {/* Faction Info */}
                <div style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid #374151',
                }}>
                  {selectedFactionData.headquarters && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                        📍 Headquarters:
                      </span>
                      <span style={{ color: '#fff', marginLeft: '8px', fontSize: '0.9rem' }}>
                        {selectedFactionData.headquarters}
                      </span>
                    </div>
                  )}
                  {selectedFactionData.leader && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                        👤 Leader:
                      </span>
                      <span style={{ color: '#fff', marginLeft: '8px', fontSize: '0.9rem' }}>
                        {selectedFactionData.leader}
                      </span>
                    </div>
                  )}
                  {selectedRep?.joined && (
                    <div>
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                        🎖️ Your Rank:
                      </span>
                      <span style={{ 
                        color: '#8B5CF6', 
                        marginLeft: '8px', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                      }}>
                        {getFactionRank(selectedRep) || 'Initiate'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Relations */}
                <div style={{
                  padding: '15px 20px',
                  flex: 1,
                  overflowY: 'auto',
                }}>
                  {selectedFactionData.allies && selectedFactionData.allies.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 8px', color: '#10B981', fontSize: '0.85rem' }}>
                        🤝 Allies
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedFactionData.allies.map(allyId => {
                          const ally = FACTIONS[allyId];
                          return (
                            <span
                              key={allyId}
                              onClick={() => setSelectedFaction(allyId)}
                              style={{
                                padding: '4px 10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: '#10B981',
                                cursor: 'pointer',
                              }}
                            >
                              {ally?.name || allyId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {selectedFactionData.enemies && selectedFactionData.enemies.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px', color: '#EF4444', fontSize: '0.85rem' }}>
                        ⚔️ Enemies
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedFactionData.enemies.map(enemyId => {
                          const enemy = FACTIONS[enemyId];
                          return (
                            <span
                              key={enemyId}
                              onClick={() => setSelectedFaction(enemyId)}
                              style={{
                                padding: '4px 10px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: '#EF4444',
                                cursor: 'pointer',
                              }}
                            >
                              {enemy?.name || enemyId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Join Button */}
                {selectedFactionData.joinable && !selectedRep?.joined && onJoinFaction && (
                  <div style={{ padding: '15px 20px', borderTop: '1px solid #374151' }}>
                    {(() => {
                      const { canJoin, reason } = canJoinFaction(
                        selectedFaction!,
                        factionReputations
                      );
                      return (
                        <>
                          <button
                            onClick={() => canJoin && onJoinFaction(selectedFaction!)}
                            disabled={!canJoin}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: canJoin 
                                ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                                : '#374151',
                              border: 'none',
                              borderRadius: '8px',
                              color: canJoin ? '#fff' : '#6B7280',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              cursor: canJoin ? 'pointer' : 'not-allowed',
                            }}
                          >
                            🤝 Request to Join
                          </button>
                          {!canJoin && reason && (
                            <p style={{
                              margin: '8px 0 0',
                              textAlign: 'center',
                              color: '#9CA3AF',
                              fontSize: '0.8rem',
                            }}>
                              {reason}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
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
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏛️</div>
                <p style={{ textAlign: 'center' }}>
                  Select a faction to view details and your standing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactionModal;
