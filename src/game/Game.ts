import { GameLoop } from '../engine/GameLoop';
import { Input } from '../engine/Input';
import { TimeManager, InputState } from './TimeManager';
import { Player } from './Player';
import { Level } from './Level';
import { LEVELS } from './LevelData';

export class Game {
    private loop: GameLoop;
    private input: Input;
    private timeManager: TimeManager;
    private ctx: CanvasRenderingContext2D;
    private level!: Level;

    private player!: Player;
    private ghosts: Map<number, Player> = new Map();

    private currentLevelIndex: number = 0;
    private startX: number = 0;
    private startY: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.input = new Input();
        this.timeManager = new TimeManager();

        this.loadLevel(0);

        this.loop = new GameLoop(this.update, this.render);
    }

    private loadLevel(index: number) {
        if (index >= LEVELS.length) {
            alert("You beat all levels! Game Over.");
            this.currentLevelIndex = 0;
            index = 0;
        }

        this.currentLevelIndex = index;
        const data = LEVELS[index];
        this.level = new Level(data);

        this.startX = data.spawnPoint.x;
        this.startY = data.spawnPoint.y;

        this.player = new Player(this.startX, this.startY, '#4af');
        this.ghosts.clear();
        this.timeManager.resetLoop();

        // Force loop 1 reset
        (this.timeManager as any).currentLoop = 1;
        (this.timeManager as any).recordings.clear();
        (this.timeManager as any).recordings.set(1, []);
        (this.timeManager as any).currentFrame = 0;

        console.log(`Loaded Level ${data.id}: ${data.name}`);
    }

    public start() {
        this.loop.start();
    }

    private update = (dt: number) => {
        this.input.update();

        // 1. Handle Time Loop Reset
        if (this.timeManager.update()) {
            // Loop reset!
            const finishedLoop = this.timeManager.getLoop() - 1;
            this.ghosts.set(finishedLoop, new Player(this.startX, this.startY, `rgba(255, 255, 255, 0.5)`));

            this.player.x = this.startX;
            this.player.y = this.startY;
        }

        // 2. Get Current Input
        const inputState: InputState = {
            dx: this.input.getAxis('ArrowLeft', 'ArrowRight') + this.input.getAxis('KeyA', 'KeyD'),
            dy: this.input.getAxis('ArrowUp', 'ArrowDown') + this.input.getAxis('KeyW', 'KeyS')
        };

        // 3. Record Input
        this.timeManager.recordInput(inputState);

        // 4. Update Current Player with Collision
        const oldX = this.player.x;
        const oldY = this.player.y;

        this.player.update(dt, inputState);

        if (this.level.checkCollision(this.player.getBounds())) {
            this.player.x = oldX;
            this.player.y = oldY;
        }

        // 5. Update Ghosts
        const currentFrame = this.timeManager.getFrame();
        this.timeManager.getPastLoops().forEach(loopIndex => {
            const ghost = this.ghosts.get(loopIndex);
            const ghostInput = this.timeManager.getGhostInput(loopIndex, currentFrame);

            if (ghost && ghostInput) {
                const gOldX = ghost.x;
                const gOldY = ghost.y;

                ghost.update(dt, ghostInput);

                // Ghost Collision with Walls
                if (this.level.checkCollision(ghost.getBounds())) {
                    ghost.x = gOldX;
                    ghost.y = gOldY;
                }

                // Paradox Check
                if (this.checkCollision(this.player, ghost)) {
                    console.log("PARADOX!");
                    this.resetGame();
                }
            }
        });

        // 6. Update Level State (Buttons, Doors)
        const allEntities = [this.player.getBounds()];
        this.ghosts.forEach(g => allEntities.push(g.getBounds()));
        this.level.update(allEntities);

        // 7. Check Win Condition
        if (this.checkCollisionRect(this.player.getBounds(), this.level.getGoal())) {
            console.log("WIN!");
            this.loadLevel(this.currentLevelIndex + 1);
            return;
        }

        // Update UI
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.innerText = this.timeManager.getTimeRemaining().toFixed(1);

        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerText = `Level: ${this.currentLevelIndex + 1} | Loop: ${this.timeManager.getLoop()}`;
    };

    private render = (_alpha: number) => {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Render Level
        this.level.render(this.ctx);

        // Render Ghosts
        this.ghosts.forEach(ghost => ghost.render(this.ctx));

        // Render Player
        this.player.render(this.ctx);
    };

    private checkCollision(p1: Player, p2: Player): boolean {
        // Safe Zone Check: If either player is near spawn, no paradox
        if (this.isSafe(p1) || this.isSafe(p2)) return false;

        return this.checkCollisionRect(p1.getBounds(), p2.getBounds());
    }

    private isSafe(p: Player): boolean {
        const dist = Math.sqrt(Math.pow(p.x - this.startX, 2) + Math.pow(p.y - this.startY, 2));
        return dist < 60; // 60px radius safe zone
    }

    private checkCollisionRect(r1: { x: number, y: number, width: number, height: number }, r2: { x: number, y: number, width: number, height: number }): boolean {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    }

    private resetGame() {
        alert("PARADOX! Timeline collapsed.");
        // Reloading the page is a bit harsh, let's just restart the level
        this.loadLevel(this.currentLevelIndex);
    }
}
