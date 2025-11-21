import './style.css'
import { Game } from './game/Game';

console.log('Echo Loop starting...');

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (canvas) {
    canvas.width = 800;
    canvas.height = 600;

    const game = new Game(canvas);
    game.start();
}
