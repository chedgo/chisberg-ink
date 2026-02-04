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
