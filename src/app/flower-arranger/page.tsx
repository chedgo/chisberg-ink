'use client';

import { useState, useCallback } from 'react';
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

function stageToSheet(x: number, y: number) {
  return {
    sx: (x * TOTAL_W - SHEET_X) / SHEET_W,
    sy: (y * TOTAL_H - PAD) / SHEET_H,
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

export default function FlowerArrangerPage() {
  const [flowers, setFlowers] = useState<PlacedFlower[]>(INITIAL_FLOWERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastTouched, setLastTouched] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleUpdateFlower = useCallback(
    (id: string, attrs: { x?: number; y?: number; rotation?: number }) => {
      setFlowers((prev) =>
        prev.map((flower) => {
          if (flower.id === id) {
            const updated = { ...flower, ...attrs };
            setLastTouched({ id, x: updated.x, y: updated.y });
            return updated;
          }
          return flower;
        })
      );
    },
    []
  );

  const handleClearAll = useCallback(() => {
    setFlowers(INITIAL_FLOWERS.map((f) => ({ ...f })));
    setSelectedId(null);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#d4d88b] relative">
      {/* Full-viewport canvas */}
      <ArrangerCanvas
        flowers={flowers}
        selectedId={selectedId}
        onSelectFlower={setSelectedId}
        onUpdateFlower={handleUpdateFlower}
      />

      {/* Debug: Last touched flower info */}
      {lastTouched && (() => {
        const sheet = stageToSheet(lastTouched.x, lastTouched.y);
        return (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded font-mono text-xs">
            <div>id: {lastTouched.id}</div>
            <div>sx: {sheet.sx.toFixed(4)}</div>
            <div>sy: {sheet.sy.toFixed(4)}</div>
          </div>
        );
      })()}

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
