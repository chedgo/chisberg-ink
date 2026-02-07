'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const GalleryCard = dynamic(
  () => import('@/components/gallery/GalleryCard').then((mod) => mod.GalleryCard),
  { ssr: false }
);

interface Arrangement {
  id: string;
  artist_name: string;
  flowers: Array<{
    id: string;
    src: string;
    x: number;
    y: number;
    rotation: number;
  }>;
  created_at: string;
}

export default function GalleryPage() {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('arrangements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setArrangements(data as Arrangement[]);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{
        backgroundImage: "url('/flower-arranger/tile_lightlime.jpg')",
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="junicode-italic-condensed text-[28px] uppercase tracking-wider text-center mb-2">
          Gallery
        </h1>
        <p className="junicode-italic-condensed text-[14px] text-black/50 uppercase tracking-wider text-center mb-10">
          Arrangements shared by visitors
        </p>

        {loading && (
          <p className="junicode-italic-condensed text-[14px] text-black/40 text-center">
            Loading...
          </p>
        )}

        {!loading && arrangements.length === 0 && (
          <p className="junicode-italic-condensed text-[14px] text-black/40 text-center">
            No arrangements shared yet. Be the first!
          </p>
        )}

        <div className="flex flex-wrap gap-8 justify-center">
          {arrangements.map((arr) => (
            <GalleryCard
              key={arr.id}
              id={arr.id}
              artistName={arr.artist_name}
              flowers={arr.flowers}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/flower-arranger"
            className="junicode-italic-condensed text-[13px] uppercase tracking-wider text-black/40 hover:text-black transition-colors"
          >
            Create Your Own
          </Link>
        </div>
      </div>
    </div>
  );
}
