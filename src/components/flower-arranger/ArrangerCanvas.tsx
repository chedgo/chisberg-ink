'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Text } from 'react-konva';
import { DraggableFlower } from './DraggableFlower';
import {
  POT_W,
  POT_H,
  SHEET_W,
  SHEET_H,
  PAD,
  POT_ROT,
  SHEET_X,
  TOTAL_W,
  TOTAL_H,
  LOGO_X,
  LOGO_Y,
  LOGO_W,
  LOGO_ROT,
  TEXT_X,
  TEXT_Y,
  TEXT_W,
  FONT_SIZE,
  SIGNATURE_FONT_SIZE,
  SIGNATURE_LETTER_SPACING,
} from './layout';

export interface PlacedFlower {
  id: string;
  src: string;
  x: number; // fraction of stage width (0-1)
  y: number; // fraction of stage height (0-1)
  rotation: number;
}

interface ArrangerCanvasProps {
  flowers: PlacedFlower[];
  selectedId: string | null;
  onSelectFlower: (id: string | null) => void;
  onUpdateFlower: (
    id: string,
    attrs: { x?: number; y?: number; rotation?: number }
  ) => void;
  artistName: string;
  onArtistNameChange: (name: string) => void;
}

function useImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);

  return image;
}

function FlowerImageWrapper({
  flower,
  isSelected,
  imageScale,
  cardOffsetX,
  cardOffsetY,
  layoutW,
  layoutH,
  onSelect,
  onChange,
}: {
  flower: PlacedFlower;
  isSelected: boolean;
  imageScale: number;
  cardOffsetX: number;
  cardOffsetY: number;
  layoutW: number;
  layoutH: number;
  onSelect: () => void;
  onChange: (attrs: { x?: number; y?: number; rotation?: number }) => void;
}) {
  const image = useImage(flower.src);

  if (!image) return null;

  return (
    <DraggableFlower
      id={flower.id}
      image={image}
      x={cardOffsetX + flower.x * layoutW}
      y={cardOffsetY + flower.y * layoutH}
      rotation={flower.rotation}
      isSelected={isSelected}
      imageScale={imageScale}
      onSelect={onSelect}
      onChange={(attrs) => {
        const converted: { x?: number; y?: number; rotation?: number } = {};
        if (attrs.x !== undefined)
          converted.x = (attrs.x - cardOffsetX) / layoutW;
        if (attrs.y !== undefined)
          converted.y = (attrs.y - cardOffsetY) / layoutH;
        if (attrs.rotation !== undefined) converted.rotation = attrs.rotation;
        onChange(converted);
      }}
    />
  );
}

export function ArrangerCanvas({
  flowers,
  selectedId,
  onSelectFlower,
  onUpdateFlower,
  artistName,
  onArtistNameChange,
}: ArrangerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(artistName);
  const inputRef = useRef<HTMLInputElement>(null);
  const potImg = useImage('/flower-arranger/flowervase.jpg');
  const sheetImg = useImage(
    '/flower-arranger/new%20assets/flowers_stickersheet.jpg'
  );
  const logoImg = useImage('/flower-arranger/flowerslogo.png');

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Cards occupy the right portion of the viewport
  const cardAreaLeft = dims.w * 0.18;
  const cardAreaW = dims.w * 0.79;
  const cardAreaH = dims.h * 0.92;

  const scaleX = cardAreaW / TOTAL_W;
  const scaleY = cardAreaH / TOTAL_H;
  const s = Math.min(scaleX, scaleY);

  const renderedW = TOTAL_W * s;
  const renderedH = TOTAL_H * s;
  const cardOffsetX = cardAreaLeft + (cardAreaW - renderedW) / 2;
  const cardOffsetY = (dims.h - renderedH) / 2;

  const handleStageClick = (e: { target: { getStage: () => unknown } }) => {
    if (e.target === e.target.getStage()) {
      onSelectFlower(null);
    }
  };

  // Logo and text positioning (unified with card scaling)
  const logoX = cardOffsetX + LOGO_X * s;
  const logoY = cardOffsetY + LOGO_Y * s;
  const logoWidth = LOGO_W * s;
  const logoHeight = logoImg ? (logoWidth / logoImg.width) * logoImg.height : 0;
  const logoRotation = LOGO_ROT;
  const textX = cardOffsetX + TEXT_X * s;
  const textY = cardOffsetY + TEXT_Y * s;
  const textWidth = TEXT_W * s;
  const fontSize = FONT_SIZE * s;

  // Signature text positioning - below the pot
  const potCenterX = cardOffsetX + (PAD + POT_W / 2.2) * s;
  const potCenterY = cardOffsetY + (PAD + SHEET_H / 1.4) * s;
  const potHeight = POT_H * s;
  const signatureY = potCenterY + potHeight / 2 -40 * s;
  const signatureX = potCenterX -0;
  const signatureFontSize = SIGNATURE_FONT_SIZE * s;

  const handleSignatureClick = () => {
    setEditingNameValue(artistName);
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleNameSubmit = () => {
    onArtistNameChange(editingNameValue);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const instructionsText = `   DESIGN
  YOUR OWN
   FLOWERS

•

DRAG, DROP,
AND ROTATE
YOUR FAVORITE
FLOWERS FROM
THE STICKER
SHEET UNTIL YOU
LOVE WHAT YOU SEE.

•

USE AS FEW
OR AS MANY
AS YOU LIKE.`;

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Stage
        width={dims.w}
        height={dims.h}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {/* Logo */}
          {logoImg && (
            <Image
              image={logoImg}
              x={logoX}
              y={logoY}
              width={logoWidth}
              height={logoHeight}
              listening={false}
              rotation={logoRotation}
            />
          )}
          {/* Instructions text */}
          <Text
            x={textX}
            y={textY}
            width={textWidth}
            text={instructionsText}
            fontSize={fontSize}
            fontFamily="Junicode Condensed Italic"
            fontStyle="italic"
            fill="#000"
            lineHeight={1.2}
            letterSpacing={0.4}
            align="center"
            listening={false}
          />
        </Layer>
        <Layer>
          {/* Sticker sheet (behind) */}
          {sheetImg && (
            <Image
              image={sheetImg}
              x={cardOffsetX + SHEET_X * s}
              y={cardOffsetY + PAD * s}
              width={SHEET_W * s}
              height={SHEET_H * s}
              shadowColor="rgba(0,0,0,0.25)"
              shadowBlur={15 * s}
              shadowOffsetX={4 * s}
              shadowOffsetY={4 * s}
              shadowEnabled
            />
          )}
          {/* Pot/vase card (in front, slightly rotated) */}
          {potImg && (
            <Image
              image={potImg}
              x={cardOffsetX + (PAD + POT_W / 2.2) * s}
              y={cardOffsetY + (PAD + SHEET_H / 1.4) * s}
              width={POT_W * s}
              height={POT_H * s}
              offsetX={(POT_W * s) / 2}
              offsetY={(POT_H * s) / 2}
              rotation={POT_ROT}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={20 * s}
              shadowOffsetX={6 * s}
              shadowOffsetY={6 * s}
              shadowEnabled
            />
          )}
          {/* Artist signature - "BY " prefix always visible */}
          <Text
            x={signatureX}
            y={signatureY}
            text="BY "
            fontSize={signatureFontSize}
            fontFamily="Junicode Condensed Italic"
            fontStyle="italic"
            fill="#444"
            letterSpacing={SIGNATURE_LETTER_SPACING * s}
            offsetX={(POT_W * 0.9 * s) / 2}
            rotation={POT_ROT}
            onClick={handleSignatureClick}
            onTap={handleSignatureClick}
          />
          {/* Artist name - shown when not editing */}
          {!isEditingName && (
            <Text
              x={signatureX}
              y={signatureY}
              text={`BY ${artistName || 'YOUR NAME'}`.toUpperCase()}
              fontSize={signatureFontSize}
              fontFamily="Junicode Condensed Italic"
              fontStyle="italic"
              fill="#444"
              letterSpacing={SIGNATURE_LETTER_SPACING * s}
              align="left"
              wrap="none"
              width={POT_W * 0.9 * s}
              offsetX={(POT_W * 0.9 * s) / 2}
              rotation={POT_ROT}
              onClick={handleSignatureClick}
              onTap={handleSignatureClick}
            />
          )}
        </Layer>
        <Layer>
          {flowers.map((flower) => (
            <FlowerImageWrapper
              key={flower.id}
              flower={flower}
              isSelected={flower.id === selectedId}
              imageScale={s}
              cardOffsetX={cardOffsetX}
              cardOffsetY={cardOffsetY}
              layoutW={TOTAL_W * s}
              layoutH={TOTAL_H * s}
              onSelect={() => onSelectFlower(flower.id)}
              onChange={(attrs) => onUpdateFlower(flower.id, attrs)}
            />
          ))}
        </Layer>
      </Stage>
      {/* Editable name input overlay - positioned after "BY " */}
      {isEditingName && (
        <input
          ref={inputRef}
          type="text"
          value={editingNameValue}
          onChange={(e) => setEditingNameValue(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleNameKeyDown}
          placeholder="YOUR NAME"
          className="absolute bg-transparent border-none outline-none"
          style={{
            left: signatureX - (POT_W * 0.9 * s) / 2 + signatureFontSize * 1.8,
            top: signatureY,
            width: POT_W * 0.9 * s - signatureFontSize * 1.8,
            fontSize: signatureFontSize,
            fontFamily: 'Junicode Condensed Italic',
            fontStyle: 'italic',
            color: '#444',
            textTransform: 'uppercase',
            letterSpacing: SIGNATURE_LETTER_SPACING * s,
            transform: `rotate(${POT_ROT}deg)`,
            transformOrigin: 'left top',
          }}
        />
      )}
    </div>
  );
}
