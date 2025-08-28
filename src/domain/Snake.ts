import type { Point, Dir } from './types';

export class Snake {
  private body: Point[];
  private dir: Dir;

  constructor(start: Point, dir: Dir = 'right') {
    this.body = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }];
    this.dir = dir;
  }

  getBody() { return this.body; }
  getHead() { return this.body[0]; }
  getTail() { return this.body[this.body.length - 1]; }
  setDirection(d: Dir) {
    const opposite: Record<Dir, Dir> = { up:'down', down:'up', left:'right', right:'left' };
    if (opposite[d] !== this.dir) this.dir = d;
  }
  getDirection() { return this.dir; }

  nextHead(): Point {
    const h = this.getHead();
    if (this.dir === 'up')    return { x: h.x,     y: h.y - 1 };
    if (this.dir === 'down')  return { x: h.x,     y: h.y + 1 };
    if (this.dir === 'left')  return { x: h.x - 1, y: h.y     };
    return                       { x: h.x + 1, y: h.y     }; // right
  }

  move(grow: boolean) {
    this.body.unshift(this.nextHead());
    if (!grow) this.body.pop();
  }

  occupies(p: Point) {
    return this.body.some(s => s.x === p.x && s.y === p.y);
  }
}
