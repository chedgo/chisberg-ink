'use client';

interface FlowerOption {
  id: string;
  name: string;
  src: string;
  initialX?: number;
  initialY?: number;
}

const FLOWER_OPTIONS: FlowerOption[] = [
  { id: 'flowers_1', name: 'Lily Buds', src: '/flower-arranger/flowers/flowers_1.png', initialX: 0.13, initialY: 0.13 },
  { id: 'flowers_2', name: 'Greenery', src: '/flower-arranger/flowers/flowers_2.png', initialX: 0.48, initialY: 0.10 },
  { id: 'flowers_3', name: 'Calla Lily', src: '/flower-arranger/flowers/flowers_3.png', initialX: 0.82, initialY: 0.11 },
  { id: 'flowers_4', name: 'Oak Leaf', src: '/flower-arranger/flowers/flowers_4.png', initialX: 0.18, initialY: 0.33 },
  { id: 'flowers_5', name: 'Cherry Blossom', src: '/flower-arranger/flowers/flowers_5.png', initialX: 0.52, initialY: 0.30 },
  { id: 'flowers_6', name: 'Rose', src: '/flower-arranger/flowers/flowers_6.png', initialX: 0.85, initialY: 0.28 },
  { id: 'flowers_7', name: 'Carnation', src: '/flower-arranger/flowers/flowers_7.png', initialX: 0.12, initialY: 0.52 },
  { id: 'flowers_8', name: 'Stock', src: '/flower-arranger/flowers/flowers_8.png', initialX: 0.45, initialY: 0.55 },
  { id: 'flowers_9', name: 'Tulip', src: '/flower-arranger/flowers/flowers_9.png', initialX: 0.80, initialY: 0.52 },
  { id: 'flowers_10', name: 'Sweet Pea', src: '/flower-arranger/flowers/flowers_10.png', initialX: 0.25, initialY: 0.77 },
  { id: 'flowers_11', name: 'Lily', src: '/flower-arranger/flowers/flowers_11.png', initialX: 0.65, initialY: 0.75 },
];

interface FlowerPickerProps {
  onAddFlower: (src: string) => void;
}

export function FlowerPicker({ onAddFlower }: FlowerPickerProps) {
  return (
    <div className="flex-1">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Flowers</h2>
      <div className="grid grid-cols-2 gap-1">
        {FLOWER_OPTIONS.map((flower) => (
          <button
            key={flower.id}
            onClick={() => onAddFlower(flower.src)}
            className="flex flex-col items-center p-1 rounded border border-transparent hover:border-emerald-400 hover:bg-emerald-100/50 transition-all"
            title={flower.name}
          >
            <img
              src={flower.src}
              alt={flower.name}
              className="w-12 h-12 object-contain"
            />
            <span className="text-xs text-gray-600">{flower.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
