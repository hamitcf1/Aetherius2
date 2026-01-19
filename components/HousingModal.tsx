import React, { useState } from 'react';
import { X, Home, Heart, Users, Package, Coins, MapPin, Lock, Check, Crown, Gift, Baby } from 'lucide-react';
import {
  HousingState,
  HouseId,
  HOUSES,
  SPOUSES,
  SpouseId,
  canPurchaseHouse,
  purchaseHouse,
  upgradeHouseRoom,
  getHouseBenefits,
  proposeMarriage,
  getMarryableNPCs,
  canMarry,
  adoptChild,
  collectSpouseIncome,
  RoomType,
} from '../services/housingService';

interface HousingModalProps {
  isOpen: boolean;
  onClose: () => void;
  housingState: HousingState;
  playerGold: number;
  onPurchaseHouse: (houseId: HouseId) => void;
  onUpgradeRoom: (houseId: HouseId, roomType: RoomType) => void;
  onMarry: (spouseId: SpouseId, homeId: HouseId) => void;
  onCollectIncome: () => void;
  onAdoptChild: (childName: string) => void;
  onSetActiveHome: (houseId: HouseId | null) => void;
}

type TabType = 'houses' | 'marriage' | 'children';

const ROOM_ICONS: Record<RoomType, string> = {
  bedroom: '🛏️',
  kitchen: '🍳',
  alchemy: '⚗️',
  enchanting: '✨',
  armory: '⚔️',
  trophy: '🏆',
  library: '📚',
  storage: '📦',
  greenhouse: '🌿',
};

const ROOM_NAMES: Record<RoomType, string> = {
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  alchemy: 'Alchemy Lab',
  enchanting: 'Enchanting Table',
  armory: 'Armory',
  trophy: 'Trophy Room',
  library: 'Library',
  storage: 'Storage',
  greenhouse: 'Greenhouse',
};

export default function HousingModal({
  isOpen,
  onClose,
  housingState,
  playerGold,
  onPurchaseHouse,
  onUpgradeRoom,
  onMarry,
  onCollectIncome,
  onAdoptChild,
  onSetActiveHome,
}: HousingModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('houses');
  const [selectedHouse, setSelectedHouse] = useState<HouseId | null>(null);
  const [selectedSpouse, setSelectedSpouse] = useState<SpouseId | null>(null);

  if (!isOpen) return null;

  const ownedHouses = Object.entries(housingState.houses)
    .filter(([_, data]) => data.owned)
    .map(([id]) => id as HouseId);
  
  const currentSpouse = housingState.spouse;
  const childCount = housingState.children.length;
  const maxChildren = 2;

  const renderHousesTab = () => {
    const houseEntries = Object.entries(HOUSES) as [HouseId, typeof HOUSES[HouseId]][];
    
    return (
      <div className="space-y-4">
        {/* House List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houseEntries.map(([houseId, house]) => {
            const houseData = housingState.houses[houseId];
            const owned = houseData?.owned || false;
            const canBuy = !owned && canPurchaseHouse(housingState, houseId, playerGold);
            const isActive = housingState.activeHome === houseId;
            
            return (
              <div
                key={houseId}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  owned
                    ? isActive 
                      ? 'border-skyrim-gold bg-skyrim-gold/10'
                      : 'border-green-600/50 bg-green-900/20 hover:bg-green-900/30'
                    : canBuy
                      ? 'border-skyrim-border hover:border-skyrim-gold/50 bg-skyrim-dark/30'
                      : 'border-gray-700/50 bg-gray-900/20 opacity-60'
                }`}
                onClick={() => setSelectedHouse(houseId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home size={18} className={owned ? 'text-green-400' : 'text-skyrim-text'} />
                    <span className="font-semibold text-skyrim-gold">{house.name}</span>
                  </div>
                  {owned && isActive && (
                    <Crown size={16} className="text-yellow-400" />
                  )}
                  {owned && !isActive && (
                    <Check size={16} className="text-green-400" />
                  )}
                  {!owned && (
                    <Lock size={16} className="text-gray-500" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-skyrim-text mb-2">
                  <MapPin size={14} />
                  <span>{house.location}, {house.hold}</span>
                </div>
                
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{house.description}</p>
                
                {!owned && (
                  <div className="flex items-center gap-1 text-sm">
                    <Coins size={14} className="text-yellow-400" />
                    <span className={playerGold >= house.baseCost ? 'text-yellow-400' : 'text-red-400'}>
                      {house.baseCost.toLocaleString()} gold
                    </span>
                  </div>
                )}
                
                {owned && houseData && (
                  <div className="flex flex-wrap gap-1">
                    {houseData.upgrades.map(room => (
                      <span key={room} className="px-1.5 py-0.5 bg-green-900/30 rounded text-xs text-green-300">
                        {ROOM_ICONS[room]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Selected House Details */}
        {selectedHouse && (
          <div className="mt-6 p-4 border border-skyrim-border rounded-lg bg-skyrim-dark/40">
            <HouseDetails
              houseId={selectedHouse}
              housingState={housingState}
              playerGold={playerGold}
              onPurchase={() => onPurchaseHouse(selectedHouse)}
              onUpgrade={(room) => onUpgradeRoom(selectedHouse, room)}
              onSetActive={() => onSetActiveHome(selectedHouse)}
              onClose={() => setSelectedHouse(null)}
            />
          </div>
        )}
      </div>
    );
  };

  const renderMarriageTab = () => {
    const availableSpouses = getMarryableNPCs(housingState);
    
    return (
      <div className="space-y-6">
        {/* Current Spouse */}
        {currentSpouse && (
          <div className="p-4 border border-pink-600/50 rounded-lg bg-pink-900/20">
            <div className="flex items-center gap-3 mb-3">
              <Heart size={20} className="text-pink-400" fill="currentColor" />
              <span className="font-semibold text-pink-300">Married to {SPOUSES[currentSpouse]?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Location: </span>
                <span className="text-skyrim-text">{SPOUSES[currentSpouse]?.location}</span>
              </div>
              <div>
                <span className="text-gray-400">Home: </span>
                <span className="text-skyrim-text">
                  {housingState.spouseHome ? HOUSES[housingState.spouseHome]?.name : 'None'}
                </span>
              </div>
            </div>
            {SPOUSES[currentSpouse]?.merchant && (
              <button
                onClick={onCollectIncome}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded text-yellow-300 hover:bg-yellow-600/30 transition-colors"
              >
                <Coins size={16} />
                <span>Collect Daily Income (100 gold)</span>
              </button>
            )}
          </div>
        )}
        
        {/* Available Spouses */}
        {!currentSpouse && (
          <>
            <div className="text-sm text-gray-400 mb-4">
              <Heart size={14} className="inline mr-2" />
              You must own a house and have an Amulet of Mara to propose marriage.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSpouses.map(spouseId => {
                const spouse = SPOUSES[spouseId];
                const canMarryNow = canMarry(housingState, spouseId);
                
                return (
                  <div
                    key={spouseId}
                    className={`p-4 rounded-lg border transition-all ${
                      canMarryNow
                        ? 'border-pink-600/50 bg-pink-900/20 hover:bg-pink-900/30 cursor-pointer'
                        : 'border-gray-700/50 bg-gray-900/20 opacity-60'
                    }`}
                    onClick={() => canMarryNow && setSelectedSpouse(spouseId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-skyrim-gold">{spouse.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        spouse.gender === 'male' ? 'bg-blue-900/50 text-blue-300' : 'bg-pink-900/50 text-pink-300'
                      }`}>
                        {spouse.gender}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      <MapPin size={12} className="inline mr-1" />
                      {spouse.location}
                    </div>
                    <p className="text-xs text-gray-500">{spouse.profession}</p>
                    {spouse.merchant && (
                      <div className="mt-2 text-xs text-yellow-400">
                        <Coins size={12} className="inline mr-1" />
                        Merchant (100g daily income)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {selectedSpouse && ownedHouses.length > 0 && (
              <div className="mt-4 p-4 border border-pink-600 rounded-lg bg-pink-900/30">
                <h4 className="font-semibold text-pink-300 mb-3">Choose a Home for {SPOUSES[selectedSpouse]?.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ownedHouses.map(houseId => (
                    <button
                      key={houseId}
                      onClick={() => {
                        onMarry(selectedSpouse, houseId);
                        setSelectedSpouse(null);
                      }}
                      className="px-3 py-2 bg-pink-700/30 border border-pink-600/50 rounded text-pink-200 hover:bg-pink-700/50 transition-colors text-sm"
                    >
                      {HOUSES[houseId].name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderChildrenTab = () => {
    return (
      <div className="space-y-6">
        {/* Current Children */}
        {childCount > 0 && (
          <div className="p-4 border border-blue-600/50 rounded-lg bg-blue-900/20">
            <div className="flex items-center gap-3 mb-3">
              <Baby size={20} className="text-blue-400" />
              <span className="font-semibold text-blue-300">Your Children ({childCount}/{maxChildren})</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {housingState.children.map((child, idx) => (
                <div key={idx} className="p-3 bg-blue-900/30 rounded border border-blue-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-skyrim-gold font-medium">{child.name}</span>
                    <span className="text-xs text-gray-400">({child.gender})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Home: {child.homeId ? HOUSES[child.homeId]?.name : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Adoption */}
        {childCount < maxChildren && ownedHouses.length > 0 && (
          <div className="p-4 border border-skyrim-border rounded-lg bg-skyrim-dark/40">
            <h4 className="font-semibold text-skyrim-gold mb-3 flex items-center gap-2">
              <Gift size={16} />
              Adopt a Child
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Visit Honorhall Orphanage in Riften to adopt a child. You can adopt up to 2 children.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Lucia', 'Sofie', 'Blaise', 'Alesan'].filter(name => 
                !housingState.children.some(c => c.name === name)
              ).map(childName => (
                <button
                  key={childName}
                  onClick={() => onAdoptChild(childName)}
                  className="px-3 py-2 bg-blue-700/20 border border-blue-600/50 rounded text-blue-200 hover:bg-blue-700/40 transition-colors text-sm"
                >
                  Adopt {childName}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {ownedHouses.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Home size={48} className="mx-auto mb-4 opacity-50" />
            <p>You need to own a house before you can adopt children.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-skyrim-paper border-2 border-skyrim-gold/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skyrim-border bg-gradient-to-r from-skyrim-dark to-transparent">
          <div className="flex items-center gap-3">
            <Home size={24} className="text-skyrim-gold" />
            <div>
              <h2 className="text-xl font-serif text-skyrim-gold">Housing & Family</h2>
              <span className="text-xs text-skyrim-text">
                {ownedHouses.length} home{ownedHouses.length !== 1 ? 's' : ''} owned • 
                {currentSpouse ? ` Married to ${SPOUSES[currentSpouse]?.name}` : ' Single'} • 
                {childCount} child{childCount !== 1 ? 'ren' : ''}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-skyrim-dark/50 rounded transition-colors text-skyrim-text hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-skyrim-border bg-skyrim-dark/30">
          {[
            { id: 'houses', label: 'Houses', icon: Home },
            { id: 'marriage', label: 'Marriage', icon: Heart },
            { id: 'children', label: 'Children', icon: Baby },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-skyrim-gold/20 text-skyrim-gold border-b-2 border-skyrim-gold'
                  : 'text-skyrim-text hover:bg-skyrim-dark/30'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'houses' && renderHousesTab()}
          {activeTab === 'marriage' && renderMarriageTab()}
          {activeTab === 'children' && renderChildrenTab()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-skyrim-border bg-skyrim-dark/30 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-skyrim-text">
            <span className="flex items-center gap-1">
              <Coins size={14} className="text-yellow-400" />
              {playerGold.toLocaleString()} gold
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-skyrim-dark border border-skyrim-border rounded hover:border-skyrim-gold/50 transition-colors text-skyrim-text"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// House Details Sub-component
interface HouseDetailsProps {
  houseId: HouseId;
  housingState: HousingState;
  playerGold: number;
  onPurchase: () => void;
  onUpgrade: (room: RoomType) => void;
  onSetActive: () => void;
  onClose: () => void;
}

function HouseDetails({ houseId, housingState, playerGold, onPurchase, onUpgrade, onSetActive, onClose }: HouseDetailsProps) {
  const house = HOUSES[houseId];
  const houseData = housingState.houses[houseId];
  const owned = houseData?.owned || false;
  const isActive = housingState.activeHome === houseId;
  const benefits = owned ? getHouseBenefits(housingState, houseId) : null;
  
  // Derive available room types from house rooms
  const houseRoomTypes = house.rooms
    .map(r => r.type)
    .filter((type): type is RoomType => 
      ['bedroom', 'kitchen', 'alchemy', 'enchanting', 'armory', 'trophy', 'library', 'storage', 'greenhouse'].includes(type)
    );
  const uniqueRoomTypes = [...new Set(houseRoomTypes)];
  
  // Available upgrades (not yet purchased)
  const availableUpgrades = uniqueRoomTypes.filter(
    room => !houseData?.upgrades.includes(room)
  );
  
  const getUpgradeCost = (room: RoomType) => {
    const baseCosts: Record<RoomType, number> = {
      bedroom: 500,
      kitchen: 750,
      alchemy: 1000,
      enchanting: 1500,
      armory: 1250,
      trophy: 1000,
      library: 750,
      storage: 500,
      greenhouse: 1500,
    };
    return baseCosts[room] || 500;
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-skyrim-gold">{house.name}</h3>
          <div className="text-sm text-gray-400">{house.location}, {house.hold}</div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-skyrim-dark rounded">
          <X size={16} className="text-gray-400" />
        </button>
      </div>
      
      <p className="text-sm text-skyrim-text mb-4">{house.description}</p>
      
      {/* Benefits */}
      {benefits && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-700/30 rounded">
          <h4 className="text-sm font-semibold text-green-400 mb-2">House Benefits</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-skyrim-gold font-bold">+{benefits.restBonus}%</div>
              <div className="text-gray-400">Rest Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-skyrim-gold font-bold">{benefits.storageSlots}</div>
              <div className="text-gray-400">Storage</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold">{benefits.bonuses.length}</div>
              <div className="text-gray-400">Bonuses</div>
            </div>
          </div>
          {benefits.bonuses.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {benefits.bonuses.map((bonus, i) => (
                <span key={i} className="px-2 py-0.5 bg-green-900/30 rounded text-xs text-green-300">
                  {bonus}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Purchase or Set Active */}
      {!owned ? (
        <button
          onClick={onPurchase}
          disabled={playerGold < house.baseCost}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded transition-colors ${
            playerGold >= house.baseCost
              ? 'bg-skyrim-gold/20 border border-skyrim-gold text-skyrim-gold hover:bg-skyrim-gold/30'
              : 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Coins size={18} />
          <span>Purchase for {house.baseCost.toLocaleString()} gold</span>
        </button>
      ) : (
        <div className="space-y-3">
          {!isActive && (
            <button
              onClick={onSetActive}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded text-yellow-300 hover:bg-yellow-600/30 transition-colors"
            >
              <Crown size={16} />
              <span>Set as Active Home</span>
            </button>
          )}
          
          {/* Upgrades */}
          {availableUpgrades.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-skyrim-text mb-2">Available Upgrades</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableUpgrades.map(room => {
                  const cost = getUpgradeCost(room);
                  const canAfford = playerGold >= cost;
                  
                  return (
                    <button
                      key={room}
                      onClick={() => canAfford && onUpgrade(room)}
                      disabled={!canAfford}
                      className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                        canAfford
                          ? 'bg-skyrim-dark/50 border border-skyrim-border hover:border-skyrim-gold/50 text-skyrim-text'
                          : 'bg-gray-900/50 border border-gray-800 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <span>{ROOM_ICONS[room]}</span>
                      <span className="flex-1 text-left">{ROOM_NAMES[room]}</span>
                      <span className={canAfford ? 'text-yellow-400' : 'text-red-400'}>
                        {cost}g
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Owned Rooms */}
          {houseData?.upgrades.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">Owned Rooms</h4>
              <div className="flex flex-wrap gap-2">
                {houseData.upgrades.map(room => (
                  <span key={room} className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/30 rounded text-xs text-green-300">
                    {ROOM_ICONS[room]} {ROOM_NAMES[room]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
