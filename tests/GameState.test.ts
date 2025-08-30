import { GameState } from '../src/domain/GameState';
import { Board } from '../src/domain/Board';

describe('GameState', () => {
  let gameState: GameState;
  let board: Board;

  beforeEach(() => {
    board = new Board(20, 15);
    gameState = new GameState(board, { x: 10, y: 7 }, 'right', 140);
  });

  test('should start with score 0', () => {
    expect(gameState.getScore()).toBe(0);
  });

  test('should start alive', () => {
    expect(gameState.isAlive()).toBe(true);
  });

  test('should have snake with 3 segments', () => {
    expect(gameState.getSnakeBody()).toHaveLength(3);
  });

  test('should move snake when stepping', () => {
    const initialHead = gameState.getSnakeBody()[0];
    gameState.step(Date.now());
    const newHead = gameState.getSnakeBody()[0];
    
    expect(newHead.x).toBe(initialHead.x + 1);
  });

  test('should reset game correctly', () => {
    gameState.reset({ x: 5, y: 5 }, 'up');
    
    expect(gameState.getScore()).toBe(0);
    expect(gameState.isAlive()).toBe(true);
    expect(gameState.getSnakeBody()[0]).toEqual({ x: 5, y: 5 });
  });
});


