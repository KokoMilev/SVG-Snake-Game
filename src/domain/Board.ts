export class Board {
  private w: number;
  private h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  getWidth() { return this.w; }
  getHeight() { return this.h; }
  key(p: { x: number; y: number }) { return `${p.x},${p.y}`; }
  inBounds(p: { x: number; y: number }) {
    return p.x >= 0 && p.y >= 0 && p.x < this.w && p.y < this.h;
  }
}
