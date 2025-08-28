import { select } from 'd3-selection';
import type { Selection } from 'd3-selection';
import 'd3-transition';
import type { Point } from '../domain/types';
import type { Food } from '../domain/FoodManager';
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
      .style('border', '1px solid #ccc')
      .style('background', '#fafafa')
      .style('width', '100%')
      .style('height', 'auto')
      .style('aspect-ratio', `${w} / ${h}`)
      .style('display', 'block');

    this.grid  = this.svg.append('g').attr('data-layer', 'grid');
    this.foods = this.svg.append('g').attr('data-layer', 'foods');
    this.snake = this.svg.append('g').attr('data-layer', 'snake');

    this.renderGrid();
  }

  renderGrid() {
    const w = this.cols * this.cell, h = this.rows * this.cell;
    for (let x = 0; x <= this.cols; x++) {
      this.grid.append('line').attr('x1', x*this.cell).attr('y1', 0).attr('x2', x*this.cell).attr('y2', h)
        .attr('stroke', '#eee').attr('stroke-width', 1);
    }
    for (let y = 0; y <= this.rows; y++) {
      this.grid.append('line').attr('x1', 0).attr('y1', y*this.cell).attr('x2', w).attr('y2', y*this.cell)
        .attr('stroke', '#eee').attr('stroke-width', 1);
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
      .merge(sel as any)
      .text(d => emoji(d.kind))
      .attr('x', d => d.pos.x * this.cell + this.cell/2)
      .attr('y', d => d.pos.y * this.cell + this.cell/2);
  }

  renderSnake(points: Point[]) {
    const sel = this.snake.selectAll<SVGRectElement, Point>('rect.seg')
      .data(points, d => `${d.x},${d.y}`);
    sel.exit().remove();

    sel.enter().append('rect')
      .attr('class', 'seg')
      .attr('rx', 4).attr('ry', 4)
      .attr('width', this.cell).attr('height', this.cell)
      .attr('fill', '#4CAF50').attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('x', d => d.x * this.cell)
      .attr('y', d => d.y * this.cell);

    // Only animate existing segments moving to new positions
    sel.transition().duration(80)
      .attr('x', d => d.x * this.cell)
      .attr('y', d => d.y * this.cell);
  }
}
