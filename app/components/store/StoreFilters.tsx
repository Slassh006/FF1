'use client';

import { StoreItemType } from '@/app/types/store';

interface StoreFiltersProps {
  selectedType: StoreItemType | 'all';
  onTypeChange: (type: StoreItemType | 'all') => void;
  itemTypes: StoreItemType[];
}

const itemTypes = [
  { id: 'all' as const, label: 'All Items' },
  { id: 'skin' as StoreItemType, label: 'Skins' },
  { id: 'emote' as StoreItemType, label: 'Emotes' },
  { id: 'character' as StoreItemType, label: 'Characters' },
  { id: 'bundle' as StoreItemType, label: 'Bundles' },
  { id: 'weapon' as StoreItemType, label: 'Weapons' },
  { id: 'redeem_code' as StoreItemType, label: 'Redeem Codes' },
  { id: 'digital_reward' as StoreItemType, label: 'Digital Rewards' },
];

export default function StoreFilters({ selectedType, onTypeChange, itemTypes: availableTypes }: StoreFiltersProps) {
  const filteredTypes = itemTypes.filter(type => 
    type.id === 'all' || availableTypes.includes(type.id)
  );

  return (
    <div className="flex flex-wrap gap-3">
      {filteredTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id)}
          className={`px-4 py-2 rounded-full font-medium transition-colors
            ${selectedType === type.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
} 