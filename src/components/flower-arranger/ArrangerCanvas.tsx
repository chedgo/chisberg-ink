'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image, Text, Group, Rect } from 'react-konva';
import Konva from 'konva';
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
  MOBILE_BREAKPOINT,
  DRAWER_WIDTH_FRAC,
  DRAWER_HANDLE_W,
  isFlowerOnSheet,
  isFlowerOnSheetMobile,
  layoutFracToPotLocal,
  potLocalToLayoutFrac,
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
  initialPositions?: Record<string, { x: number; y: number }>;
  artistName: string;
  onArtistNameChange: (name: string) => void;
  highlightName?: boolean;
  readOnly?: boolean;
  mobileGuidanceHidden?: boolean;
  onMobileInteraction?: () => void;
}

function useImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);

  return image;
}

// Desktop: flower wrapper (unchanged)
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

// Mobile: flower on the pot, draggable at pot scale
function MobilePotFlower({
  flower,
  isSelected,
  imageScale,
  areaX,
  areaY,
  areaW,
  areaH,
  potRect,
  onSelect,
  onChange,
  onDropOutside,
}: {
  flower: PlacedFlower;
  isSelected: boolean;
  imageScale: number;
  areaX: number;
  areaY: number;
  areaW: number;
  areaH: number;
  potRect: { x: number; y: number; w: number; h: number };
  onSelect: () => void;
  onChange: (attrs: { x?: number; y?: number; rotation?: number }) => void;
  onDropOutside: () => void;
}) {
  const image = useImage(flower.src);
  if (!image) return null;

  const { px, py } = layoutFracToPotLocal(flower.x, flower.y);
  const pixelX = areaX + px * areaW;
  const pixelY = areaY + py * areaH;

  return (
    <DraggableFlower
      id={flower.id}
      image={image}
      x={pixelX}
      y={pixelY}
      rotation={flower.rotation}
      isSelected={isSelected}
      imageScale={imageScale}
      onSelect={onSelect}
      onChange={(attrs) => {
        // Check if dropped outside pot bounds
        if (attrs.x !== undefined && attrs.y !== undefined) {
          if (
            attrs.x < potRect.x || attrs.x > potRect.x + potRect.w ||
            attrs.y < potRect.y || attrs.y > potRect.y + potRect.h
          ) {
            onDropOutside();
            return;
          }
        }
        const converted: { x?: number; y?: number; rotation?: number } = {};
        if (attrs.x !== undefined && attrs.y !== undefined) {
          const newPx = (attrs.x - areaX) / areaW;
          const newPy = (attrs.y - areaY) / areaH;
          const { fx, fy } = potLocalToLayoutFrac(newPx, newPy);
          converted.x = fx;
          converted.y = fy;
        } else {
          if (attrs.x !== undefined) {
            const newPx = (attrs.x - areaX) / areaW;
            const { fx } = potLocalToLayoutFrac(newPx, 0);
            converted.x = fx;
          }
          if (attrs.y !== undefined) {
            const newPy = (attrs.y - areaY) / areaH;
            const { fy } = potLocalToLayoutFrac(0, newPy);
            converted.y = fy;
          }
        }
        if (attrs.rotation !== undefined) converted.rotation = attrs.rotation;
        onChange(converted);
      }}
    />
  );
}

// Mobile: tappable flower on the sheet inside the drawer
// Not a full DraggableFlower — just an Image you touch to pick up
function MobileSheetFlower({
  flower,
  imageScale,
  sheetOffsetX,
  sheetOffsetY,
  sheetPixelW,
  sheetPixelH,
  onPickUp,
}: {
  flower: PlacedFlower;
  imageScale: number;
  sheetOffsetX: number;
  sheetOffsetY: number;
  sheetPixelW: number;
  sheetPixelH: number;
  onPickUp: (id: string, image: HTMLImageElement, stageX: number, stageY: number) => void;
}) {
  const image = useImage(flower.src);
  if (!image) return null;

  const sheetLeftFrac = SHEET_X / TOTAL_W;
  const sheetWidthFrac = SHEET_W / TOTAL_W;
  const sheetTopFrac = PAD / TOTAL_H;
  const sheetHeightFrac = SHEET_H / TOTAL_H;

  const sx = (flower.x - sheetLeftFrac) / sheetWidthFrac;
  const sy = (flower.y - sheetTopFrac) / sheetHeightFrac;
  const pixelX = sheetOffsetX + sx * sheetPixelW;
  const pixelY = sheetOffsetY + sy * sheetPixelH;

  const w = image.width * imageScale;
  const h = image.height * imageScale;

  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (pos) {
      onPickUp(flower.id, image, pos.x, pos.y);
    }
  };

  return (
    <Image
      image={image}
      x={pixelX}
      y={pixelY}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={flower.rotation}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    />
  );
}

// Static flower for read-only mode (no drag, no selection)
function StaticFlower({
  flower,
  imageScale,
  offsetX,
  offsetY,
  areaW,
  areaH,
}: {
  flower: PlacedFlower;
  imageScale: number;
  offsetX: number;
  offsetY: number;
  areaW: number;
  areaH: number;
}) {
  const image = useImage(flower.src);
  if (!image) return null;

  const w = image.width * imageScale;
  const h = image.height * imageScale;

  return (
    <Image
      image={image}
      x={offsetX + flower.x * areaW}
      y={offsetY + flower.y * areaH}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={flower.rotation}
      listening={false}
    />
  );
}

// Static flower for read-only mobile (pot-local coords)
function StaticMobilePotFlower({
  flower,
  imageScale,
  areaX,
  areaY,
  areaW,
  areaH,
}: {
  flower: PlacedFlower;
  imageScale: number;
  areaX: number;
  areaY: number;
  areaW: number;
  areaH: number;
}) {
  const image = useImage(flower.src);
  if (!image) return null;

  const { px, py } = layoutFracToPotLocal(flower.x, flower.y);
  const pixelX = areaX + px * areaW;
  const pixelY = areaY + py * areaH;

  const w = image.width * imageScale;
  const h = image.height * imageScale;

  return (
    <Image
      image={image}
      x={pixelX}
      y={pixelY}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={flower.rotation}
      listening={false}
    />
  );
}

// Pot center in pot-local fraction coords (derived from desktop rendering offsets)
const POT_LOCAL_CENTER_PX = (POT_W / 2.2) / POT_W;
const POT_LOCAL_CENTER_PY = (SHEET_H / 1.4) / SHEET_H;

export function ArrangerCanvas({
  flowers,
  selectedId,
  onSelectFlower,
  onUpdateFlower,
  initialPositions,
  artistName,
  onArtistNameChange,
  highlightName,
  readOnly,
  mobileGuidanceHidden,
  onMobileInteraction,
}: ArrangerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(artistName);
  const inputRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<Konva.Text>(null);
  const potImg = useImage('/flower-arranger/flowervase.jpg');
  const sheetImg = useImage(
    '/flower-arranger/new%20assets/flowers_stickersheet.jpg'
  );
  const logoImg = useImage('/flower-arranger/flowerslogo.png');
  const tileImg = useImage('/flower-arranger/tile_lightlime.jpg');

  // Mobile state
  const isMobile = dims.w < MOBILE_BREAKPOINT;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerGroupRef = useRef<Konva.Group>(null);
  const [draggingFromSheet, setDraggingFromSheet] = useState<string | null>(null);

  // Transition flower state: flower being dragged from sheet to pot
  const [transitionFlower, setTransitionFlower] = useState<{
    id: string;
    image: HTMLImageElement;
  } | null>(null);
  const transitionNodeRef = useRef<Konva.Image>(null);
  const transitionAnimRef = useRef<number | null>(null);
  const transitionStartPos = useRef({ x: 0, y: 0 });

  // Animate signature text when highlighted — scale from center
  useEffect(() => {
    const node = signatureRef.current;
    if (!highlightName || !node) return;
    setIsEditingName(false);

    const textWidth = node.getTextWidth();
    const textHeight = node.height();
    const origOffsetX = node.offsetX();
    const origOffsetY = node.offsetY();
    const origX = node.x();
    const origY = node.y();
    const newOffsetX = textWidth / 2;
    const newOffsetY = textHeight / 2;
    const angle = (node.rotation() * Math.PI) / 180;
    const dx = newOffsetX - origOffsetX;
    const dy = newOffsetY - origOffsetY;
    node.offsetX(newOffsetX);
    node.offsetY(newOffsetY);
    node.x(origX + dx * Math.cos(angle) - dy * Math.sin(angle));
    node.y(origY + dx * Math.sin(angle) + dy * Math.cos(angle));

    const tween = new Konva.Tween({
      node,
      duration: 0.6,
      scaleX: 1.15,
      scaleY: 1.15,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        new Konva.Tween({
          node,
          duration: 0.6,
          scaleX: 1,
          scaleY: 1,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => {
            node.offsetX(origOffsetX);
            node.offsetY(origOffsetY);
            node.x(origX);
            node.y(origY);
          },
        }).play();
      },
    });
    tween.play();
  }, [highlightName]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate drawer open/close
  useEffect(() => {
    const group = drawerGroupRef.current;
    if (!group || !isMobile) return;

    const dw = dims.w * DRAWER_WIDTH_FRAC;
    const targetX = drawerOpen ? dims.w - dw : dims.w;

    const tween = new Konva.Tween({
      node: group,
      duration: 0.3,
      x: targetX,
      easing: Konva.Easings.EaseInOut,
    });
    tween.play();

    return () => {
      tween.destroy();
    };
  }, [drawerOpen, isMobile, dims.w]);

  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
    onMobileInteraction?.();
  }, [onMobileInteraction]);

  // ──── Desktop layout ────
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

  // ──── Mobile layout ────
  const mobilePadding = 20;
  const mobilePotTopPad = mobilePadding + 20;
  const mobilePotScaleX = (dims.w - mobilePadding * 2) / POT_W;
  const mobileBottomPad = mobilePadding + 10; // extra breathing room above bottom bar
  const mobilePotScaleY = (dims.h - mobilePotTopPad - mobileBottomPad) / POT_H;
  const sPot = Math.min(mobilePotScaleX, mobilePotScaleY);

  const mobilePotW = POT_W * sPot;
  const mobilePotH = POT_H * sPot;
  const mobilePotX = (dims.w - mobilePotW) / 2;
  const mobilePotY = mobilePotTopPad + (dims.h - mobilePotTopPad - mobileBottomPad - mobilePotH) / 2;

  // Drawer
  const drawerW = dims.w * DRAWER_WIDTH_FRAC;
  const drawerPad = 15;
  const sSheet = (drawerW - drawerPad * 2) / SHEET_W;
  const sheetPixelW = SHEET_W * sSheet;
  const sheetPixelH = SHEET_H * sSheet;

  // Pot area: maps pot-local (0,0)-(1,1) to pixel coords, anchored at pot image center
  const potAreaW = mobilePotW;
  const potAreaH = potAreaW * (SHEET_H / POT_W);
  const potAreaX = (mobilePotX + mobilePotW / 2) - POT_LOCAL_CENTER_PX * potAreaW;
  const potAreaY = (mobilePotY + mobilePotH / 2) - POT_LOCAL_CENTER_PY * potAreaH;

  // Store these in refs so DOM event handlers always see current values
  const potAreaRef = useRef({ x: potAreaX, y: potAreaY, w: potAreaW, h: potAreaH });
  potAreaRef.current = { x: potAreaX, y: potAreaY, w: potAreaW, h: potAreaH };

  // Single drop zone rect used by both transition drops and pot flower drags
  const dropPadX = mobilePotW * 0.05;
  const dropPadY = mobilePotH * 0.05;
  const dropZone = { x: mobilePotX - dropPadX, y: mobilePotY - dropPadY, w: mobilePotW + dropPadX * 2, h: mobilePotH + dropPadY * 2 };
  const potRectRef = useRef(dropZone);
  potRectRef.current = dropZone;

  const initialPositionsRef = useRef(initialPositions);
  initialPositionsRef.current = initialPositions;

  // Ref to access transitionFlower in DOM event handlers
  const transitionFlowerRef = useRef(transitionFlower);
  transitionFlowerRef.current = transitionFlower;

  // Refs for callbacks so DOM handlers don't go stale
  const onUpdateFlowerRef = useRef(onUpdateFlower);
  onUpdateFlowerRef.current = onUpdateFlower;
  const onSelectFlowerRef = useRef(onSelectFlower);
  onSelectFlowerRef.current = onSelectFlower;

  // Pick up a flower from the sheet: start the transition
  const handlePickFromSheet = useCallback(
    (flowerId: string, image: HTMLImageElement, stageX: number, stageY: number) => {
      transitionStartPos.current = { x: stageX, y: stageY };
      setTransitionFlower({ id: flowerId, image });
      setDraggingFromSheet(flowerId);
      setDrawerOpen(false);
    },
    []
  );

  // Scale animation: tween from sSheet → sPot over 250ms
  useEffect(() => {
    if (!transitionFlower) return;

    const tryAnimate = () => {
      const node = transitionNodeRef.current;
      if (!node) {
        transitionAnimRef.current = requestAnimationFrame(tryAnimate);
        return;
      }

      // Set initial position
      node.x(transitionStartPos.current.x);
      node.y(transitionStartPos.current.y);

      const img = transitionFlower.image;
      const startScale = sSheet;
      const endScale = sPot;
      const duration = 250;
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = t * (2 - t); // ease-out quad
        const scale = startScale + (endScale - startScale) * eased;

        node.width(img.width * scale);
        node.height(img.height * scale);
        node.offsetX((img.width * scale) / 2);
        node.offsetY((img.height * scale) / 2);
        node.getLayer()?.batchDraw();

        if (t < 1) {
          transitionAnimRef.current = requestAnimationFrame(animate);
        }
      };

      transitionAnimRef.current = requestAnimationFrame(animate);
    };

    transitionAnimRef.current = requestAnimationFrame(tryAnimate);

    return () => {
      if (transitionAnimRef.current) cancelAnimationFrame(transitionAnimRef.current);
    };
  }, [transitionFlower, sSheet, sPot]);

  // DOM pointer tracking for the transition flower
  useEffect(() => {
    if (!transitionFlower) return;
    const container = containerRef.current;
    if (!container) return;

    const moveNode = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const node = transitionNodeRef.current;
      if (node) {
        node.x(x);
        node.y(y);
        node.getLayer()?.batchDraw();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) moveNode(touch.clientX, touch.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      moveNode(e.clientX, e.clientY);
    };

    const handleEnd = () => {
      const node = transitionNodeRef.current;
      const tf = transitionFlowerRef.current;
      if (!tf) return;

      const area = potAreaRef.current;
      const pot = potRectRef.current;

      // If the node mounted and the user dragged, use node position; otherwise center on pot
      let fx: number, fy: number;
      if (node) {
        const dropX = node.x();
        const dropY = node.y();
        const dx = dropX - transitionStartPos.current.x;
        const dy = dropY - transitionStartPos.current.y;
        const wasDragged = Math.abs(dx) > 5 || Math.abs(dy) > 5;

        if (wasDragged) {
          // Check if dropped outside pot bounds — send back to sheet
          const outsidePot =
            dropX < pot.x || dropX > pot.x + pot.w ||
            dropY < pot.y || dropY > pot.y + pot.h;
          if (outsidePot) {
            const initial = initialPositionsRef.current?.[tf.id];
            if (initial) {
              onUpdateFlowerRef.current(tf.id, { x: initial.x, y: initial.y, rotation: 0 });
            }
            onSelectFlowerRef.current(null);
            setTransitionFlower(null);
            setDraggingFromSheet(null);
            return;
          }
          const newPx = (dropX - area.x) / area.w;
          const newPy = (dropY - area.y) / area.h;
          ({ fx, fy } = potLocalToLayoutFrac(newPx, newPy));
        } else {
          ({ fx, fy } = potLocalToLayoutFrac(POT_LOCAL_CENTER_PX, 0.5));
        }
      } else {
        ({ fx, fy } = potLocalToLayoutFrac(POT_LOCAL_CENTER_PX, 0.5));
      }

      onUpdateFlowerRef.current(tf.id, { x: fx, y: fy });
      onSelectFlowerRef.current(tf.id); // move to top of stack
      setTransitionFlower(null);
      setDraggingFromSheet(null);
    };

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleEnd);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleEnd);

    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleEnd);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleEnd);
    };
  }, [transitionFlower]);

  const handleStageClick = () => {
    onSelectFlower(null);
  };

  const handleMobileStageClick = () => {
    onSelectFlower(null);
    onMobileInteraction?.();
  };

  // Logo and text positioning — desktop only
  const logoX = cardOffsetX + LOGO_X * s;
  const logoY = cardOffsetY + LOGO_Y * s;
  const logoWidth = LOGO_W * s;
  const logoHeight = logoImg ? (logoWidth / logoImg.width) * logoImg.height : 0;
  const logoRotation = LOGO_ROT;
  const textX = cardOffsetX + TEXT_X * s;
  const textY = cardOffsetY + TEXT_Y * s;
  const textWidth = TEXT_W * s;
  const fontSize = FONT_SIZE * s;

  // Signature positioning
  const sigScale = isMobile ? sPot : s;
  const sigPotCenterX = isMobile
    ? mobilePotX + mobilePotW / 2
    : cardOffsetX + (PAD + POT_W / 2.2) * s;
  const sigPotCenterY = isMobile
    ? mobilePotY + mobilePotH / 2
    : cardOffsetY + (PAD + SHEET_H / 1.4) * s;
  const sigPotHeight = isMobile ? mobilePotH : POT_H * s;
  const signatureY = sigPotCenterY + sigPotHeight / 2 - 40 * sigScale;
  const signatureX = sigPotCenterX;
  const signatureFontSize = SIGNATURE_FONT_SIZE * sigScale;

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

  // Classify flowers for mobile — use mobile-specific check that respects the full pot width
  const potFlowers = flowers.filter((f) => !isFlowerOnSheetMobile(f.x));
  const sheetFlowers = flowers.filter(
    (f) => isFlowerOnSheetMobile(f.x) && f.id !== draggingFromSheet
  );

  // Flowers that are on the pot (for read-only desktop view)
  const readOnlyFlowers = flowers.filter((f) => !isFlowerOnSheet(f.x));

  // ──── Desktop read-only layout ────
  // Scale based on pot dimensions to center the pot in viewport
  const roPadding = 40;
  const roScaleX = (dims.w - roPadding * 2) / POT_W;
  const roScaleY = (dims.h - roPadding * 2) / POT_H;
  const roS = Math.min(roScaleX, roScaleY);
  const roPotW = POT_W * roS;
  const roPotH = POT_H * roS;
  // Center pot in viewport
  const roPotCenterX = dims.w / 2;
  const roPotCenterY = dims.h / 2;
  // For flower positioning, we need to map layout-fraction coords to the pot-only view
  // The pot occupies PAD to PAD+POT_W horizontally and PAD to PAD+SHEET_H vertically in layout coords
  const roLayoutW = TOTAL_W * roS;
  const roLayoutH = TOTAL_H * roS;
  // Offset so that the pot center (PAD + POT_W/2.2) maps to screen center
  const roCardOffsetX = roPotCenterX - (PAD + POT_W / 2.2) * roS;
  const roCardOffsetY = roPotCenterY - (PAD + SHEET_H / 1.4) * roS;

  // Read-only signature positioning
  const roSigScale = roS;
  const roSignatureY = roPotCenterY + roPotH / 2 - 40 * roSigScale;
  const roSignatureX = roPotCenterX;
  const roSignatureFontSize = SIGNATURE_FONT_SIZE * roSigScale;

  // ──── Mobile read-only rendering ────
  if (readOnly && isMobile) {
    return (
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" style={{ touchAction: 'none' }}>
        <Stage width={dims.w} height={dims.h}>
          <Layer>
            {potImg && (
              <Image
                image={potImg}
                x={mobilePotX + mobilePotW / 2}
                y={mobilePotY + mobilePotH / 2}
                width={mobilePotW}
                height={mobilePotH}
                offsetX={mobilePotW / 2}
                offsetY={mobilePotH / 2}
                rotation={POT_ROT}
                shadowColor="rgba(0,0,0,0.3)"
                shadowBlur={20 * sPot}
                shadowOffsetX={6 * sPot}
                shadowOffsetY={6 * sPot}
                shadowEnabled
              />
            )}
            <Text
              x={signatureX}
              y={signatureY}
              text={`BY ${artistName || 'ANONYMOUS'}`.toUpperCase()}
              fontSize={signatureFontSize}
              fontFamily="Junicode Condensed Italic"
              fontStyle="italic"
              fill="#444"
              letterSpacing={SIGNATURE_LETTER_SPACING * sigScale}
              align="left"
              wrap="none"
              width={POT_W * 0.9 * sigScale}
              offsetX={(POT_W * 0.9 * sigScale) / 2}
              rotation={POT_ROT}
              listening={false}
            />
          </Layer>
          <Layer>
            {potFlowers.map((flower) => (
              <StaticMobilePotFlower
                key={flower.id}
                flower={flower}
                imageScale={sPot}
                areaX={potAreaX}
                areaY={potAreaY}
                areaW={potAreaW}
                areaH={potAreaH}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  }

  // ──── Desktop read-only rendering ────
  if (readOnly) {
    return (
      <div ref={containerRef} className="absolute inset-0">
        <Stage width={dims.w} height={dims.h}>
          <Layer>
            {potImg && (
              <Image
                image={potImg}
                x={roPotCenterX}
                y={roPotCenterY}
                width={roPotW}
                height={roPotH}
                offsetX={roPotW / 2}
                offsetY={roPotH / 2}
                rotation={POT_ROT}
                shadowColor="rgba(0,0,0,0.3)"
                shadowBlur={20 * roS}
                shadowOffsetX={6 * roS}
                shadowOffsetY={6 * roS}
                shadowEnabled
              />
            )}
            <Text
              x={roSignatureX}
              y={roSignatureY}
              text={`BY ${artistName || 'ANONYMOUS'}`.toUpperCase()}
              fontSize={roSignatureFontSize}
              fontFamily="Junicode Condensed Italic"
              fontStyle="italic"
              fill="#444"
              letterSpacing={SIGNATURE_LETTER_SPACING * roSigScale}
              align="left"
              wrap="none"
              width={POT_W * 0.9 * roSigScale}
              offsetX={(POT_W * 0.9 * roSigScale) / 2}
              rotation={POT_ROT}
              listening={false}
            />
          </Layer>
          <Layer>
            {readOnlyFlowers.map((flower) => (
              <StaticFlower
                key={flower.id}
                flower={flower}
                imageScale={roS}
                offsetX={roCardOffsetX}
                offsetY={roCardOffsetY}
                areaW={roLayoutW}
                areaH={roLayoutH}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  }

  // ──── Mobile rendering ────
  if (isMobile) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
        {/* Logo — shrinks but stays visible */}
        <div
          className="shrink-0 flex justify-center"
          style={{
            paddingTop: mobileGuidanceHidden ? 16 : 32,
            paddingBottom: mobileGuidanceHidden ? 0 : 20,
            transition: 'padding-top 1.2s ease-in-out, padding-bottom 1.2s ease-in-out',
          }}
        >
          <img
            src="/flower-arranger/flowerslogo.png"
            alt="Flowers logo"
            style={{
              width: mobileGuidanceHidden ? '30%' : '55%',
              maxWidth: mobileGuidanceHidden ? 140 : 260,
              transform: `rotate(${LOGO_ROT}deg)`,
              transition: 'width 1.2s ease-in-out, max-width 1.2s ease-in-out',
            }}
          />
        </div>

        {/* Instructions — shrink away */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            maxHeight: mobileGuidanceHidden ? 0 : 500,
            transition: 'max-height 1.2s ease-in-out',
          }}
        >
          <div className="px-3 pb-2">
          <div className="flex gap-6 justify-center items-center">
            {instructionsText.split('\n\n•\n\n').map((para, i) => (
              <p
                key={i}
                className="text-center"
                style={{
                  fontFamily: 'Junicode Condensed Italic',
                  fontStyle: 'italic',
                  fontSize: 11,
                  lineHeight: 1.25,
                  letterSpacing: 0.3,
                  whiteSpace: 'pre-line',
                }}
              >
                {para.trim()}
              </p>
            ))}
          </div>
          </div>
        </div>

        {/* Canvas — fills remaining viewport space */}
        <div
          ref={containerRef}
          className="relative w-full flex-1 min-h-0 overflow-hidden"
        >
          <Stage
            width={dims.w}
            height={dims.h}
            onClick={handleMobileStageClick}
            onTap={handleMobileStageClick}
          >
            {/* Pot layer */}
            <Layer>
              {potImg && (
                <Image
                  image={potImg}
                  x={mobilePotX + mobilePotW / 2}
                  y={mobilePotY + mobilePotH / 2}
                  width={mobilePotW}
                  height={mobilePotH}
                  offsetX={mobilePotW / 2}
                  offsetY={mobilePotH / 2}
                  rotation={POT_ROT}
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={20 * sPot}
                  shadowOffsetX={6 * sPot}
                  shadowOffsetY={6 * sPot}
                  shadowEnabled
                />
              )}
              {/* Signature */}
              {!highlightName && (
                <Text
                  x={signatureX}
                  y={signatureY}
                  text="BY "
                  fontSize={signatureFontSize}
                  fontFamily="Junicode Condensed Italic"
                  fontStyle="italic"
                  fill="#444"
                  letterSpacing={SIGNATURE_LETTER_SPACING * sigScale}
                  offsetX={(POT_W * 0.9 * sigScale) / 2}
                  rotation={POT_ROT}
                  onClick={handleSignatureClick}
                  onTap={handleSignatureClick}
                />
              )}
              {!isEditingName && (
                <Text
                  ref={signatureRef}
                  x={signatureX}
                  y={signatureY}
                  text={`BY ${artistName || 'YOUR NAME'}`.toUpperCase()}
                  fontSize={signatureFontSize}
                  fontFamily="Junicode Condensed Italic"
                  fontStyle="italic"
                  fill={highlightName ? '#c44' : '#444'}
                  letterSpacing={SIGNATURE_LETTER_SPACING * sigScale}
                  align="left"
                  wrap="none"
                  width={POT_W * 0.9 * sigScale}
                  offsetX={(POT_W * 0.9 * sigScale) / 2}
                  rotation={POT_ROT}
                  onClick={handleSignatureClick}
                  onTap={handleSignatureClick}
                />
              )}
            </Layer>

            {/* Pot flowers layer */}
            <Layer>
              {potFlowers.map((flower) => (
                <MobilePotFlower
                  key={flower.id}
                  flower={flower}
                  isSelected={flower.id === selectedId}
                  imageScale={sPot}
                  areaX={potAreaX}
                  areaY={potAreaY}
                  areaW={potAreaW}
                  areaH={potAreaH}
                  potRect={dropZone}
                  onSelect={() => { onSelectFlower(flower.id); onMobileInteraction?.(); }}
                  onChange={(attrs) => onUpdateFlower(flower.id, attrs)}
                  onDropOutside={() => {
                    const initial = initialPositions?.[flower.id];
                    if (initial) {
                      onUpdateFlower(flower.id, { x: initial.x, y: initial.y, rotation: 0 });
                      onSelectFlower(null);
                    }
                  }}
                />
              ))}
            </Layer>

            {/* Drawer layer */}
            <Layer>
              <Group
                ref={drawerGroupRef}
                x={dims.w}
                y={0}
              >
                <Rect
                  x={0}
                  y={0}
                  width={drawerW}
                  height={dims.h}
                  fill={tileImg ? undefined : '#f5f3ee'}
                  fillPatternImage={tileImg ?? undefined}
                  fillPatternRepeat="repeat"
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={20}
                  shadowOffsetX={-4}
                  shadowEnabled
                />
                {sheetImg && (
                  <Image
                    image={sheetImg}
                    x={drawerPad}
                    y={(dims.h - sheetPixelH) / 2}
                    width={sheetPixelW}
                    height={sheetPixelH}
                    shadowColor="rgba(0,0,0,0.15)"
                    shadowBlur={8}
                    shadowOffsetX={2}
                    shadowOffsetY={2}
                    shadowEnabled
                  />
                )}
                {sheetFlowers.map((flower) => (
                  <MobileSheetFlower
                    key={flower.id}
                    flower={flower}
                    imageScale={sSheet}
                    sheetOffsetX={drawerPad}
                    sheetOffsetY={(dims.h - sheetPixelH) / 2}
                    sheetPixelW={sheetPixelW}
                    sheetPixelH={sheetPixelH}
                    onPickUp={handlePickFromSheet}
                  />
                ))}
              </Group>
            </Layer>

            {/* Transition flower layer — on top of everything */}
            <Layer>
              {transitionFlower && (
                <Image
                  ref={transitionNodeRef}
                  image={transitionFlower.image}
                  x={transitionStartPos.current.x}
                  y={transitionStartPos.current.y}
                  width={transitionFlower.image.width * sSheet}
                  height={transitionFlower.image.height * sSheet}
                  offsetX={(transitionFlower.image.width * sSheet) / 2}
                  offsetY={(transitionFlower.image.height * sSheet) / 2}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>

          {/* Drawer handle */}
          <button
            onClick={handleToggleDrawer}
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/80 text-white"
            style={{
              right: drawerOpen ? drawerW - 2 : 0,
              width: DRAWER_HANDLE_W,
              height: 80,
              borderRadius: '8px 0 0 8px',
              transition: 'right 0.3s ease-in-out',
              zIndex: 10,
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: 11,
              letterSpacing: 2,
              fontFamily: 'Junicode Condensed Italic',
              fontStyle: 'italic',
              textTransform: 'uppercase',
            }}
          >
            {drawerOpen ? '✕' : 'Flowers'}
          </button>

          {/* Editable name input overlay */}
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
                left:
                  signatureX -
                  (POT_W * 0.9 * sigScale) / 2 +
                  signatureFontSize * 1.8,
                top: signatureY,
                width: POT_W * 0.9 * sigScale - signatureFontSize * 1.8,
                fontSize: signatureFontSize,
                fontFamily: 'Junicode Condensed Italic',
                fontStyle: 'italic',
                color: '#444',
                textTransform: 'uppercase',
                letterSpacing: SIGNATURE_LETTER_SPACING * sigScale,
                transform: `rotate(${POT_ROT}deg)`,
                transformOrigin: 'left top',
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // ──── Desktop rendering (unchanged) ────
  return (
    <div ref={containerRef} className="absolute inset-0">
      <Stage
        width={dims.w}
        height={dims.h}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
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
          {!highlightName && (
            <Text
              x={signatureX}
              y={signatureY}
              text="BY "
              fontSize={signatureFontSize}
              fontFamily="Junicode Condensed Italic"
              fontStyle="italic"
              fill="#444"
              letterSpacing={SIGNATURE_LETTER_SPACING * sigScale}
              offsetX={(POT_W * 0.9 * sigScale) / 2}
              rotation={POT_ROT}
              onClick={handleSignatureClick}
              onTap={handleSignatureClick}
            />
          )}
          {!isEditingName && (
            <Text
              ref={signatureRef}
              x={signatureX}
              y={signatureY}
              text={`BY ${artistName || 'YOUR NAME'}`.toUpperCase()}
              fontSize={signatureFontSize}
              fontFamily="Junicode Condensed Italic"
              fontStyle="italic"
              fill={highlightName ? '#c44' : '#444'}
              letterSpacing={SIGNATURE_LETTER_SPACING * sigScale}
              align="left"
              wrap="none"
              width={POT_W * 0.9 * sigScale}
              offsetX={(POT_W * 0.9 * sigScale) / 2}
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
            left: signatureX - (POT_W * 0.9 * sigScale) / 2 + signatureFontSize * 1.8,
            top: signatureY,
            width: POT_W * 0.9 * sigScale - signatureFontSize * 1.8,
            fontSize: signatureFontSize,
            fontFamily: 'Junicode Condensed Italic',
            fontStyle: 'italic',
            color: '#444',
            textTransform: 'uppercase',
            letterSpacing: SIGNATURE_LETTER_SPACING * sigScale,
            transform: `rotate(${POT_ROT}deg)`,
            transformOrigin: 'left top',
          }}
        />
      )}
    </div>
  );
}
