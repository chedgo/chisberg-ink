// Native image dimensions (must match actual image files)
export const POT_W = 937;
export const POT_H = 1362;
export const SHEET_W = 1645;
export const SHEET_H = 2147;

// Canvas layout parameters (in native image pixels)
export const PAD = 120;
export const OVERLAP = 120;
export const POT_ROT = -1;

// Derived positions
export const SHEET_X = PAD + POT_W - OVERLAP;
export const TOTAL_W = PAD + POT_W + SHEET_W - OVERLAP + PAD;
export const TOTAL_H = PAD + SHEET_H + PAD;
