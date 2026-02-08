// Native image dimensions (must match actual image files)
export const POT_W = 937;
export const POT_H = 1362;
export const SHEET_W = 1645;
export const SHEET_H = 2147;

// Canvas layout parameters (in native image pixels)
export const PAD = 120;
export const OVERLAP = 120;
export const POT_ROT = -1;

// Logo/text sidebar (in native pixels, to the left of the cards)
export const SIDEBAR_W = 500;
export const LOGO_X = -600;
export const LOGO_Y = 500;
export const LOGO_W = 1250;
export const LOGO_ROT = -20;
export const TEXT_X = -525;
export const TEXT_Y = 1250;
export const TEXT_W = 600;
export const FONT_SIZE = 45;

// Derived positions
export const SHEET_X = PAD + POT_W - OVERLAP;
export const TOTAL_W = PAD + POT_W + SHEET_W - OVERLAP + PAD;
export const TOTAL_H = PAD + SHEET_H + PAD;

// Artist signature text below the pot
export const SIGNATURE_FONT_SIZE = 36;
export const SIGNATURE_LETTER_SPACING = 5;

// Mobile layout constants
export const MOBILE_BREAKPOINT = 768;
export const DRAWER_WIDTH_FRAC = 0.85; // drawer covers 85% of screen width
export const DRAWER_HANDLE_W = 44; // tap target width in CSS px

// Fraction of TOTAL_W where the sticker sheet begins
export const SHEET_LEFT_FRAC = SHEET_X / TOTAL_W; // ~0.35

// Check if a flower (by its layout-fraction x) is still on the sticker sheet
export function isFlowerOnSheet(flowerX: number): boolean {
  return flowerX >= SHEET_LEFT_FRAC - 0.05;
}

// Convert layout-fraction coords to pot-local fraction (0-1 within pot area)
export function layoutFracToPotLocal(
  fx: number,
  fy: number
): { px: number; py: number } {
  // Pot occupies from PAD to PAD+POT_W horizontally, and is vertically centered in TOTAL_H
  const potLeftFrac = PAD / TOTAL_W;
  const potWidthFrac = POT_W / TOTAL_W;
  const potTopFrac = PAD / TOTAL_H;
  const potHeightFrac = SHEET_H / TOTAL_H; // pot area spans same vertical as sheet

  const px = (fx - potLeftFrac) / potWidthFrac;
  const py = (fy - potTopFrac) / potHeightFrac;
  return { px, py };
}

// Convert pot-local fraction (0-1) back to layout-fraction coords
export function potLocalToLayoutFrac(
  px: number,
  py: number
): { fx: number; fy: number } {
  const potLeftFrac = PAD / TOTAL_W;
  const potWidthFrac = POT_W / TOTAL_W;
  const potTopFrac = PAD / TOTAL_H;
  const potHeightFrac = SHEET_H / TOTAL_H;

  const fx = potLeftFrac + px * potWidthFrac;
  const fy = potTopFrac + py * potHeightFrac;
  return { fx, fy };
}
