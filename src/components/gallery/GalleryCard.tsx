'use client';

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Link from 'next/link';
import {
  POT_W,
  POT_H,
  SHEET_H,
  PAD,
  POT_ROT,
  TOTAL_W,
  TOTAL_H,
} from '@/components/flower-arranger/layout';

interface PlacedFlower {
  id: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
}

interface GalleryCardProps {
  id: string;
  artistName: string;
  flowers: PlacedFlower[];
}

const THUMB_W = 280;
const THUMB_H = 370;

function useImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);
  return image;
}

function FlowerThumbnail({ flower, scale, offsetX, offsetY, layoutW, layoutH }: {
  flower: PlacedFlower;
  scale: number;
  offsetX: number;
  offsetY: number;
  layoutW: number;
  layoutH: number;
}) {
  const image = useImage(flower.src);
  if (!image) return null;

  const imgW = image.width * scale;
  const imgH = image.height * scale;

  return (
    <KonvaImage
      image={image}
      x={offsetX + flower.x * layoutW}
      y={offsetY + flower.y * layoutH}
      width={imgW}
      height={imgH}
      offsetX={imgW / 2}
      offsetY={imgH / 2}
      rotation={flower.rotation}
      listening={false}
    />
  );
}

export function GalleryCard({ id, artistName, flowers }: GalleryCardProps) {
  const potImg = useImage('/flower-arranger/flowervase.jpg');
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale to fit the thumbnail
  const s = Math.min(THUMB_W / TOTAL_W, THUMB_H / TOTAL_H);
  const renderedW = TOTAL_W * s;
  const renderedH = TOTAL_H * s;
  const offsetX = (THUMB_W - renderedW) / 2;
  const offsetY = (THUMB_H - renderedH) / 2;

  return (
    <Link href={`/flower-arranger?id=${id}`} className="block group">
      <div
        ref={containerRef}
        className="bg-white/60 border border-black/10 overflow-hidden group-hover:border-black/30 transition-colors"
        style={{ width: THUMB_W, height: THUMB_H }}
      >
        <Stage width={THUMB_W} height={THUMB_H} listening={false}>
          <Layer>
            {potImg && (
              <KonvaImage
                image={potImg}
                x={offsetX + (PAD + POT_W / 2.2) * s}
                y={offsetY + (PAD + SHEET_H / 1.4) * s}
                width={POT_W * s}
                height={POT_H * s}
                offsetX={(POT_W * s) / 2}
                offsetY={(POT_H * s) / 2}
                rotation={POT_ROT}
                listening={false}
              />
            )}
          </Layer>
          <Layer>
            {flowers.map((flower) => (
              <FlowerThumbnail
                key={flower.id}
                flower={flower}
                scale={s}
                offsetX={offsetX}
                offsetY={offsetY}
                layoutW={renderedW}
                layoutH={renderedH}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <p className="mt-2 junicode-italic-condensed text-[13px] text-black/60 uppercase tracking-wider text-center">
        {artistName ? `by ${artistName}` : 'Anonymous'}
      </p>
    </Link>
  );
}
