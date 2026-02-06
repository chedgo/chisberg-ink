'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { PlacedFlower } from '@/components/flower-arranger/ArrangerCanvas';
import {
  SHEET_W,
  SHEET_H,
  PAD,
  SHEET_X,
  TOTAL_W,
  TOTAL_H,
} from '@/components/flower-arranger/layout';

const ArrangerCanvas = dynamic(
  () =>
    import('@/components/flower-arranger/ArrangerCanvas').then(
      (mod) => mod.ArrangerCanvas
    ),
  { ssr: false }
);

function sheetToStage(sx: number, sy: number) {
  return {
    x: (SHEET_X + sx * SHEET_W) / TOTAL_W,
    y: (PAD + sy * SHEET_H) / TOTAL_H,
  };
}

const FLOWER_DEFS = [
  {
    id: 'flowers_1',
    src: '/flower-arranger/flowers/flowers_1.png',
    sx: 0.8062,
    sy: 0.8293,
  },
  {
    id: 'flowers_2',
    src: '/flower-arranger/flowers/flowers_2.png',
    sx: 0.4417,
    sy: 0.8276,
  },
  {
    id: 'flowers_3',
    src: '/flower-arranger/flowers/flowers_3.png',
    sx: 0.1339,
    sy: 0.8209,
  },
  {
    id: 'flowers_4',
    src: '/flower-arranger/flowers/flowers_4.png',
    sx: 0.8302,
    sy: 0.5567,
  },
  {
    id: 'flowers_5',
    src: '/flower-arranger/flowers/flowers_5.png',
    sx: 0.5072,
    sy: 0.5384,
  },
  {
    id: 'flowers_6',
    src: '/flower-arranger/flowers/flowers_6.png',
    sx: 0.1687,
    sy: 0.5367,
  },
  {
    id: 'flowers_7',
    src: '/flower-arranger/flowers/flowers_7.png',
    sx: 0.6338,
    sy: 0.3578,
  },
  {
    id: 'flowers_8',
    src: '/flower-arranger/flowers/flowers_8.png',
    sx: 0.8412,
    sy: 0.2006,
  },
  {
    id: 'flowers_9',
    src: '/flower-arranger/flowers/flowers_9.png',
    sx: 0.6534,
    sy: 0.1806,
  },
  {
    id: 'flowers_10',
    src: '/flower-arranger/flowers/flowers_10.png',
    sx: 0.3806,
    sy: 0.214,
  },
  {
    id: 'flowers_11',
    src: '/flower-arranger/flowers/flowers_11.png',
    sx: 0.1306,
    sy: 0.246,
  },
];

const INITIAL_FLOWERS: PlacedFlower[] = FLOWER_DEFS.map((f) => {
  const pos = sheetToStage(f.sx, f.sy);
  return { id: f.id, src: f.src, x: pos.x, y: pos.y, rotation: 0 };
});

const STORAGE_KEY = 'flower-arranger-positions';
const ARTIST_NAME_KEY = 'flower-arranger-artist-name';

function loadFlowersFromStorage(): PlacedFlower[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PlacedFlower[];
    }
  } catch {
    // Invalid JSON, ignore
  }
  return null;
}

function loadArtistNameFromStorage(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ARTIST_NAME_KEY) || '';
}

export default function FlowerArrangerPage() {
  const [flowers, setFlowers] = useState<PlacedFlower[]>(INITIAL_FLOWERS);
  const [artistName, setArtistName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFlowersFromStorage();
    if (saved) {
      setFlowers(saved);
    }
    setArtistName(loadArtistNameFromStorage());
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever flowers change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flowers));
    }
  }, [flowers, isLoaded]);

  // Save artist name to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ARTIST_NAME_KEY, artistName);
    }
  }, [artistName, isLoaded]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectFlower = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      // Bring the selected flower to the top of the stack
      setFlowers((prev) => {
        const index = prev.findIndex((f) => f.id === id);
        if (index === -1 || index === prev.length - 1) return prev;
        const flower = prev[index];
        return [...prev.slice(0, index), ...prev.slice(index + 1), flower];
      });
    }
  }, []);

  const handleUpdateFlower = useCallback(
    (id: string, attrs: { x?: number; y?: number; rotation?: number }) => {
      setFlowers((prev) =>
        prev.map((flower) =>
          flower.id === id ? { ...flower, ...attrs } : flower
        )
      );
    },
    []
  );

  const handleClearAll = useCallback(() => {
    setFlowers(INITIAL_FLOWERS.map((f) => ({ ...f })));
    setSelectedId(null);
  }, []);

  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundImage: "url('/flower-arranger/tile_lightlime.jpg')", backgroundRepeat: 'repeat' }}>
      {/* Full-viewport canvas */}
      <ArrangerCanvas
        flowers={flowers}
        selectedId={selectedId}
        onSelectFlower={handleSelectFlower}
        onUpdateFlower={handleUpdateFlower}
        artistName={artistName}
        onArtistNameChange={setArtistName}
      />

      {/* Hidden reset button */}
      <button
        onClick={handleClearAll}
        className="absolute bottom-6 left-8 junicode-italic-condensed text-[11px] uppercase tracking-wider text-black/40 hover:text-black transition-colors text-left"
      >
        Reset All
      </button>

      {/* Share Your Work button */}
      <button
        className="absolute bottom-6 right-8 border-[1.5px] border-black px-6 py-3 junicode-italic-condensed uppercase text-[12px] tracking-[0.04em] leading-snug text-center bg-transparent hover:bg-black/5 transition-colors"
        style={{ borderRadius: '50%' }}
      >
        Share
        <br />
        Your Work
      </button>
    </div>
  );
}
