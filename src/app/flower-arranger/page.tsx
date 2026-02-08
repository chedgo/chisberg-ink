'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> =
  Object.fromEntries(INITIAL_FLOWERS.map((f) => [f.id, { x: f.x, y: f.y }]));

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

type ShareStatus = 'idle' | 'sharing' | 'shared' | 'error' | 'needs-name';

function FlowerArrangerInner() {
  const searchParams = useSearchParams();
  const sharedId = searchParams.get('id');

  const [flowers, setFlowers] = useState<PlacedFlower[]>(INITIAL_FLOWERS);
  const [artistName, setArtistName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [mobileGuidanceHidden, setMobileGuidanceHidden] = useState(false);

  // Load from API if ?id= present, otherwise localStorage
  useEffect(() => {
    if (sharedId) {
      fetch(`/api/arrangements?id=${sharedId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && !data.error) {
            setFlowers(data.flowers as PlacedFlower[]);
            setArtistName(data.artist_name);
            setIsViewingShared(true);
          } else {
            const saved = loadFlowersFromStorage();
            if (saved) setFlowers(saved);
            setArtistName(loadArtistNameFromStorage());
          }
          setIsLoaded(true);
        });
    } else {
      const saved = loadFlowersFromStorage();
      if (saved) setFlowers(saved);
      setArtistName(loadArtistNameFromStorage());
      setIsLoaded(true);
    }
  }, [sharedId]);

  // Save to localStorage whenever flowers change (after initial load, only if not viewing shared)
  useEffect(() => {
    if (isLoaded && !isViewingShared) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flowers));
    }
  }, [flowers, isLoaded, isViewingShared]);

  // Save artist name to localStorage
  useEffect(() => {
    if (isLoaded && !isViewingShared) {
      localStorage.setItem(ARTIST_NAME_KEY, artistName);
    }
  }, [artistName, isLoaded, isViewingShared]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectFlower = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
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
    setIsViewingShared(false);
    setMobileGuidanceHidden(false);
    if (sharedId) {
      window.history.replaceState({}, '', '/flower-arranger');
    }
  }, [sharedId]);

  const handleShare = async () => {
    if (!artistName.trim()) {
      setShareStatus('needs-name');
      setTimeout(() => setShareStatus('idle'), 2500);
      return;
    }
    setShareStatus('sharing');
    try {
      const res = await fetch('/api/arrangements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_name: artistName, flowers }),
      });
      if (!res.ok) throw new Error('Failed to share');
      const { id } = await res.json();

      const url = `${window.location.origin}/flower-arranger?id=${id}`;
      await navigator.clipboard.writeText(url);
      setShareStatus('shared');
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2500);
    }
  };

  const shareButtonText = () => {
    switch (shareStatus) {
      case 'sharing':
        return 'Sharing...';
      case 'shared':
        return 'Link\nCopied!';
      case 'needs-name':
        return 'Introduce\nYourself First';
      case 'error':
        return 'Error\nTry Again';
      default:
        return 'Share\nYour Work';
    }
  };

  return (
    <div className="h-dvh overflow-hidden relative flex flex-col" style={{ backgroundImage: "url('/flower-arranger/tile_lightlime.jpg')", backgroundRepeat: 'repeat' }}>
      {/* Full-viewport canvas */}
      <ArrangerCanvas
        flowers={flowers}
        selectedId={selectedId}
        onSelectFlower={handleSelectFlower}
        onUpdateFlower={handleUpdateFlower}
        initialPositions={INITIAL_POSITIONS}
        artistName={artistName}
        onArtistNameChange={setArtistName}
        highlightName={shareStatus === 'needs-name'}
        readOnly={isViewingShared}
        mobileGuidanceHidden={mobileGuidanceHidden}
        onMobileInteraction={() => setMobileGuidanceHidden(true)}
      />

      {/* Mobile bottom bar */}
      {isViewingShared ? (
        <div className="shrink-0 flex items-center gap-4 px-4 py-3 md:hidden">
          <Link
            href="/flower-arranger"
            className="junicode-italic-condensed text-[10px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Make Your Own
          </Link>
          <Link
            href="/gallery"
            className="junicode-italic-condensed text-[10px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Gallery
          </Link>
        </div>
      ) : (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearAll}
              className="junicode-italic-condensed text-[10px] uppercase tracking-wider text-black/40 hover:text-black transition-colors text-left"
            >
              Reset All
            </button>
            <Link
              href="/gallery"
              className="junicode-italic-condensed text-[10px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
            >
              Gallery
            </Link>
          </div>
          <button
            onClick={handleShare}
            disabled={shareStatus === 'sharing'}
            className="border-[1.5px] border-black px-3 py-1.5 junicode-italic-condensed uppercase text-[10px] tracking-[0.04em] leading-snug text-center hover:bg-black/5 transition-colors disabled:opacity-50"
            style={{ borderRadius: '50%', whiteSpace: 'pre-line', backgroundImage: "url('/flower-arranger/tile_lightlime.jpg')", backgroundRepeat: 'repeat' }}
          >
            {shareButtonText()}
          </button>
        </div>
      )}

      {/* Desktop buttons (absolute positioned) */}
      {isViewingShared ? (
        <div className="hidden md:block">
          <Link
            href="/flower-arranger"
            className="absolute bottom-6 left-8 junicode-italic-condensed text-[11px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Make Your Own
          </Link>
          <Link
            href="/gallery"
            className="absolute bottom-6 left-36 junicode-italic-condensed text-[11px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Gallery
          </Link>
        </div>
      ) : (
        <div className="hidden md:block">
          <button
            onClick={handleClearAll}
            className="absolute bottom-6 left-8 junicode-italic-condensed text-[11px] uppercase tracking-wider text-black/40 hover:text-black transition-colors text-left"
          >
            Reset All
          </button>
          <Link
            href="/gallery"
            className="absolute bottom-6 left-28 junicode-italic-condensed text-[11px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Gallery
          </Link>
          <button
            onClick={handleShare}
            disabled={shareStatus === 'sharing'}
            className="absolute bottom-6 right-8 border-[1.5px] border-black px-6 py-3 junicode-italic-condensed uppercase text-[12px] tracking-[0.04em] leading-snug text-center hover:bg-black/5 transition-colors disabled:opacity-50"
            style={{ borderRadius: '50%', whiteSpace: 'pre-line', backgroundImage: "url('/flower-arranger/tile_lightlime.jpg')", backgroundRepeat: 'repeat' }}
          >
            {shareButtonText()}
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlowerArrangerPage() {
  return (
    <Suspense>
      <FlowerArrangerInner />
    </Suspense>
  );
}
