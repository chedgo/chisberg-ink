'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Image, Transformer } from 'react-konva';
import Konva from 'konva';

interface DraggableFlowerProps {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  rotation: number;
  isSelected: boolean;
  imageScale: number;
  onSelect: () => void;
  onChange: (attrs: { x?: number; y?: number; rotation?: number }) => void;
}

export function DraggableFlower({
  image,
  x,
  y,
  rotation,
  isSelected,
  imageScale,
  onSelect,
  onChange,
}: DraggableFlowerProps) {
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hue, setHue] = useState(0);
  const animationRef = useRef<number | null>(null);

  const displayWidth = image.width * imageScale;
  const displayHeight = image.height * imageScale;

  // Cache the image for filters when mounted or when filter state changes
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache();
    }
  }, [image, displayWidth, displayHeight, isHovered, isSelected]);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Hue cycling animation when selected
  useEffect(() => {
    if (isSelected) {
      let startTime: number | null = null;
      const cycleDuration = 8000; // 8 seconds for full hue cycle

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const newHue = ((elapsed / cycleDuration) * 360) % 360;
        setHue(newHue);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Reset hue when deselected
      setHue(0);
    }
  }, [isSelected]);

  // Update the Konva node's hue filter
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.hue(isSelected ? hue : 0);
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [hue, isSelected]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (imageRef.current) {
      imageRef.current.getStage()!.container().style.cursor = 'grab';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (imageRef.current) {
      imageRef.current.getStage()!.container().style.cursor = 'default';
    }
  }, []);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onSelect();
    if (imageRef.current) {
      imageRef.current.getStage()!.container().style.cursor = 'grabbing';
    }
  }, [onSelect]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (imageRef.current) {
      imageRef.current.getStage()!.container().style.cursor = 'grab';
    }
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [onChange]);

  // Determine filters based on hover/selected state
  const filters = isHovered || isSelected ? [Konva.Filters.HSL] : [];

  return (
    <>
      <Image
        ref={imageRef}
        image={image}
        x={x}
        y={y}
        width={displayWidth}
        height={displayHeight}
        rotation={rotation}
        draggable
        offsetX={displayWidth / 2}
        offsetY={displayHeight / 2}
        onClick={(e) => { e.cancelBubble = true; onSelect(); }}
        onTap={(e) => { e.cancelBubble = true; onSelect(); }}
        onDragStart={handleDragStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        filters={filters}
        saturation={isHovered && !isSelected ? 0.3 : 0}
        luminance={isHovered && !isSelected ? 0.1 : 0}
        onDragEnd={handleDragEnd}
        onTransformEnd={() => {
          const node = imageRef.current;
          if (node) {
            onChange({
              rotation: node.rotation(),
            });
            // Reset scale to 1 since we only want rotation
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          resizeEnabled={false}
          borderStroke="#000000"
          anchorStroke="#000000"
          anchorFill="#ffffff"
          anchorSize={12}
          anchorCornerRadius={6}
          borderStrokeWidth={1}
          onClick={(e) => { e.cancelBubble = true; }}
          onTap={(e) => { e.cancelBubble = true; }}
        />
      )}
    </>
  );
}
