export type Dir = 'up' | 'down' | 'left' | 'right';

export type Point = { x: number; y: number };

export type FoodKind = 'cherry' | 'mushroom' | 'pizza' | 'banana' | 'coconut' | 'pineapple';

export type Food = { pos: Point; kind: FoodKind; value: number; effect?: string };