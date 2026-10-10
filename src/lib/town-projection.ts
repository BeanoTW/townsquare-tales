// Upright oblique projection preserves the street plan while revealing wall height.
export const P = (x: number, y: number, h = 0) => [x * 48 + h * 0.025, y * 36 - h * 0.57] as const;