'use client';

import { useRef, useEffect } from 'react';
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

  const displayWidth = image.width * imageScale;
  const displayHeight = image.height * imageScale;

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
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
          borderStroke="#10b981"
          anchorStroke="#10b981"
          anchorFill="#ffffff"
          anchorSize={12}
          borderStrokeWidth={2}
        />
      )}
    </>
  );
}
