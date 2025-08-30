import { select } from 'd3-selection';
import type { Selection } from 'd3-selection';
import type { Food, Point, Skin, GradientStop } from '../domain/types';
import { emoji } from '../domain/FoodManager';

export class SvgRenderer {
  private cols: number;
  private rows: number;
  private cell: number;
  private currentSkin: Skin = 'basic';

  private svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private grid: Selection<SVGGElement, unknown, null, undefined>;
  private foods: Selection<SVGGElement, unknown, null, undefined>;
  private snake: Selection<SVGGElement, unknown, null, undefined>;

  constructor(host: HTMLElement, cols: number, rows: number, cell = 20) {
    this.cols = cols;
    this.rows = rows;
    this.cell = cell;

    this.svg = select(host).append('svg')
      .attr('width', cols * cell)
      .attr('height', rows * cell)
      .style('background', 'transparent')
      .style('max-width', '100%')
      .style('max-height', '100%')
      .style('width', 'auto')
      .style('height', 'auto');

    this.grid = this.svg.append('g').attr('class', 'grid');
    this.foods = this.svg.append('g').attr('class', 'foods');
    this.snake = this.svg.append('g').attr('class', 'snake');

    this.addSnakeGradients();
    this.renderGrid();
  }

  resize(cols: number, rows: number, cell: number): void {
    this.cols = cols;
    this.rows = rows;
    this.cell = cell;
    
    this.svg
      .attr('width', cols * cell)
      .attr('height', rows * cell);
    
    this.addSnakeGradients();
    this.renderGrid();
  }

  setSkin(skin: Skin): void {
    this.currentSkin = skin;
    this.addSnakeGradients();
    const currentSnakeData = this.snake.selectAll('*').data() as Point[];
    if (currentSnakeData && currentSnakeData.length > 0 && currentSnakeData[0] && currentSnakeData[0].x !== undefined) {
      this.renderSnake(currentSnakeData);
    }
  }

  private addSnakeGradients(): void {
    this.svg.selectAll('defs').remove();
    
    const defs = this.svg.append('defs');
    
    const skinGradients = this.getSkinGradients();
    this.createGradient(defs, 'snakeHead', skinGradients.head);
    this.createGradient(defs, 'snakeBody', skinGradients.body);
  }

  private getSkinGradients(): { head: GradientStop[]; body: GradientStop[] } {
    const gradients = {
      basic: {
        head: [
          { offset: '0%', color: '#66BB6A' },
          { offset: '100%', color: '#4CAF50' }
        ],
        body: [
          { offset: '0%', color: '#81C784' },
          { offset: '100%', color: '#66BB6A' }
        ]
      },
      golden: {
        head: [
          { offset: '0%', color: '#FFD700' },
          { offset: '100%', color: '#FFA500' }
        ],
        body: [
          { offset: '0%', color: '#FFA500' },
          { offset: '100%', color: '#FF8C00' }
        ]
      },
      neon: {
        head: [
          { offset: '0%', color: '#00FFFF' },
          { offset: '100%', color: '#0080FF' }
        ],
        body: [
          { offset: '0%', color: '#0080FF' },
          { offset: '100%', color: '#0040FF' }
        ]
      }
    };

    return gradients[this.currentSkin];
  }

  private createGradient(defs: Selection<SVGDefsElement, unknown, null, undefined>, id: string, stops: GradientStop[]): void {
    defs.append('linearGradient')
      .attr('id', id)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
      .selectAll('stop')
      .data(stops)
      .enter().append('stop')
      .attr('offset', (d: GradientStop) => d.offset)
      .attr('stop-color', (d: GradientStop) => d.color);
  }

  renderGrid() {
    const w = this.cols * this.cell, h = this.rows * this.cell;
    
    this.grid.selectAll('rect.border').remove();
    this.grid.append('rect')
      .attr('class', 'border')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.8)')
      .attr('stroke-width', 2)
      .attr('rx', 6)
      .attr('ry', 6);
    
    for (let x = 0; x <= this.cols; x++) {
      this.grid.append('line').attr('x1', x*this.cell).attr('y1', 0).attr('x2', x*this.cell).attr('y2', h)
        .attr('stroke', 'rgba(255, 255, 255, 0.15)').attr('stroke-width', 0.5);
    }
    for (let y = 0; y <= this.rows; y++) {
      this.grid.append('line').attr('x1', 0).attr('y1', y*this.cell).attr('x2', w).attr('y2', y*this.cell)
        .attr('stroke', 'rgba(255, 255, 255, 0.15)').attr('stroke-width', 0.5);
    }
  }

  renderFoods(food: Food | null) {
    const data = food ? [food] : [];
    const foodSelection = this.foods.selectAll<SVGTextElement, Food>('text.food').data(data, d => `${d.pos.x},${d.pos.y}`);
    foodSelection.exit().remove();
    foodSelection.enter().append('text')
      .attr('class', 'food')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', this.cell * 0.9)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
      .merge(foodSelection as any)
      .text(d => emoji(d.kind))
      .attr('x', d => d.pos.x * this.cell + this.cell/2)
      .attr('y', d => d.pos.y * this.cell + this.cell/2);
  }

  renderSnake(points: Point[]) {
    this.snake.selectAll('*').remove();

    if (!points || points.length === 0) return;

    points.forEach((point, index) => {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        return;
      }
      
      const isHead = index === 0;
      const x = point.x * this.cell;
      const y = point.y * this.cell;
      
      const segmentSize = this.cell;
      const offset = 1;
      
      this.snake.append('rect')
        .attr('class', isHead ? 'snakeHead' : 'snakeBody')
        .attr('x', x - offset)
        .attr('y', y - offset)
        .attr('width', segmentSize)
        .attr('height', segmentSize)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', isHead ? 'url(#snakeHead)' : 'url(#snakeBody)')
        .attr('stroke', 'rgba(0,0,0,0.2)')
        .attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
    });

    if (points.length > 0 && points[0] && typeof points[0].x === 'number' && typeof points[0].y === 'number') {
      const head = points[0];
      const headX = head.x * this.cell + this.cell / 2;
      const headY = head.y * this.cell + this.cell / 2;
      
      const direction = this.getSnakeDirection(points);
      let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
      
      const eyeOffset = Math.max(3, Math.floor(this.cell * 0.2)); 
      
      switch (direction) {
        case 'right':
          leftEyeX = headX + eyeOffset; leftEyeY = headY - eyeOffset;
          rightEyeX = headX + eyeOffset; rightEyeY = headY + eyeOffset;
          break;
        case 'left':
          leftEyeX = headX - eyeOffset; leftEyeY = headY - eyeOffset;
          rightEyeX = headX - eyeOffset; rightEyeY = headY + eyeOffset;
          break;
        case 'up':
          leftEyeX = headX - eyeOffset; leftEyeY = headY - eyeOffset;
          rightEyeX = headX + eyeOffset; rightEyeY = headY - eyeOffset;
          break;
        case 'down':
          leftEyeX = headX - eyeOffset; leftEyeY = headY + eyeOffset;
          rightEyeX = headX + eyeOffset; rightEyeY = headY + eyeOffset;
          break;
        default:
          leftEyeX = headX + eyeOffset; leftEyeY = headY - eyeOffset;
          rightEyeX = headX + eyeOffset; rightEyeY = headY + eyeOffset;
      }
      
      const eyeRadius = Math.max(3, Math.floor(this.cell * 0.2)); 
      const eyeStrokeWidth = Math.max(1, Math.floor(this.cell * 0.05)); 
      
      this.snake.append('circle')
        .attr('class', 'eye')
        .attr('cx', leftEyeX)
        .attr('cy', leftEyeY)
        .attr('r', eyeRadius)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', eyeStrokeWidth);
      
      this.snake.append('circle')
        .attr('class', 'eye')
        .attr('cx', rightEyeX)
        .attr('cy', rightEyeY)
        .attr('r', eyeRadius)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', eyeStrokeWidth);
    }
  }

  private getSnakeDirection(points: Point[]): string {
    if (points.length < 2) return 'right';
    const head = points[0];
    const neck = points[1];
    
    if (head.x > neck.x) return 'right';
    if (head.x < neck.x) return 'left';
    if (head.y < neck.y) return 'up';
    if (head.y > neck.y) return 'down';
    return 'right';
  }
}
