import { select } from 'd3-selection';
import type { Selection } from 'd3-selection';
import 'd3-transition';
import type { Point, Food } from '../domain/types';
import { emoji } from '../domain/FoodManager';

export class SvgRenderer {
  private host: HTMLElement;
  private cols: number;
  private rows: number;
  private cell: number;

  private svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private grid: Selection<SVGGElement, unknown, null, undefined>;
  private foods: Selection<SVGGElement, unknown, null, undefined>;
  private snake: Selection<SVGGElement, unknown, null, undefined>;

  constructor(host: HTMLElement, cols: number, rows: number, cell = 20) {
    this.host = host;
    this.cols = cols;
    this.rows = rows;
    this.cell = cell;

    const w = this.cols * this.cell;
    const h = this.rows * this.cell;

    this.svg = select(this.host)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('border', 'none')
      .style('background', 'transparent')
      .style('width', '100%')
      .style('height', '100%')
      .style('max-width', 'min(90vw, 90vh)')
      .style('max-height', 'min(90vw, 90vh)')
      .style('display', 'block')
      .style('border-radius', '8px')
      .style('box-shadow', 'none');

    this.grid  = this.svg.append('g').attr('data-layer', 'grid');
    this.foods = this.svg.append('g').attr('data-layer', 'foods');
    this.snake = this.svg.append('g').attr('data-layer', 'snake');

    this.renderGrid();
    this.addSnakeGradients();
  }

  private addSnakeGradients() {
    const defs = this.svg.append('defs');
    
    // Snake head gradient
    defs.append('linearGradient')
      .attr('id', 'snakeHead')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#66BB6A' },
        { offset: '100%', color: '#4CAF50' }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    // Snake body gradient
    defs.append('linearGradient')
      .attr('id', 'snakeBody')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#81C784' },
        { offset: '100%', color: '#66BB6A' }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);
  }

  renderGrid() {
    const w = this.cols * this.cell, h = this.rows * this.cell;
    
    // Add white border around playable area
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
      .attr('rx', 4)
      .attr('ry', 4);
    
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
    const sel = this.foods.selectAll<SVGTextElement, Food>('text.food').data(data, d => `${d.pos.x},${d.pos.y}`);
    sel.exit().remove();
    sel.enter().append('text')
      .attr('class', 'food')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', this.cell * 0.9)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
      .merge(sel as any)
      .text(d => emoji(d.kind))
      .attr('x', d => d.pos.x * this.cell + this.cell/2)
      .attr('y', d => d.pos.y * this.cell + this.cell/2);
  }

  renderSnake(points: Point[]) {
    this.snake.selectAll('*').remove();

    if (points.length === 0) return;

    points.forEach((point, index) => {
      const isHead = index === 0;
      const x = point.x * this.cell;
      const y = point.y * this.cell;
      
      const segmentSize = this.cell + 4;
      const offset = 2;
      
      this.snake.append('rect')
        .attr('class', isHead ? 'snakeHead' : 'snakeBody')
        .attr('x', x - offset)
        .attr('y', y - offset)
        .attr('width', segmentSize)
        .attr('height', segmentSize)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', isHead ? 'url(#snakeHead)' : 'url(#snakeBody)')
        .attr('stroke', 'rgba(0,0,0,0.2)')
        .attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
    });

    if (points.length > 0) {
      const head = points[0];
      const headX = head.x * this.cell + this.cell / 2;
      const headY = head.y * this.cell + this.cell / 2;
      
      const direction = this.getSnakeDirection(points);
      let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
      
      switch (direction) {
        case 'right':
          leftEyeX = headX + 8; leftEyeY = headY - 8;
          rightEyeX = headX + 8; rightEyeY = headY + 8;
          break;
        case 'left':
          leftEyeX = headX - 8; leftEyeY = headY - 8;
          rightEyeX = headX - 8; rightEyeY = headY + 8;
          break;
        case 'up':
          leftEyeX = headX - 8; leftEyeY = headY - 8;
          rightEyeX = headX + 8; rightEyeY = headY - 8;
          break;
        case 'down':
          leftEyeX = headX - 8; leftEyeY = headY + 8;
          rightEyeX = headX + 8; rightEyeY = headY + 8;
          break;
        default:
          leftEyeX = headX + 8; leftEyeY = headY - 8;
          rightEyeX = headX + 8; rightEyeY = headY + 8;
      }
      
      // Add left eye
      this.snake.append('circle')
        .attr('class', 'eye')
        .attr('cx', leftEyeX)
        .attr('cy', leftEyeY)
        .attr('r', 8)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
      
      // Add right eye
      this.snake.append('circle')
        .attr('class', 'eye')
        .attr('cx', rightEyeX)
        .attr('cy', rightEyeY)
        .attr('r', 8)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
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
