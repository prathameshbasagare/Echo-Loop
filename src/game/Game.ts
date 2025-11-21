import { GameLoop } from '../engine/GameLoop';
import { Input } from '../engine/Input';
import { TimeManager, InputState } from './TimeManager';
import { Player } from './Player';
import { Level } from './Level';
import { LEVELS } from './LevelData';

enum GameState {
    MENU,
    PLAYING,
    PAUSED
}

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

    private state: GameState = GameState.MENU;
    private pauseKeyWasDown: boolean = false;
    private menuKeyWasDown: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.input = new Input();
        this.timeManager = new TimeManager();

        // Don't load level yet - wait for user to start from menu

        // Add click listener for Start button
        canvas.addEventListener('click', this.handleCanvasClick);

        this.loop = new GameLoop(this.update, this.render);
    }

    private loadLevel(index: number) {
        if (index >= LEVELS.length) {
            alert("You beat all levels! Game Over.");
            this.currentLevelIndex = 0;
            index = 0;
            this.state = GameState.MENU; // Return to menu on completion
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
        // Handle Global Input (Pause/Menu) - Check BEFORE updating input state
        // This way isKeyPressed works for pause toggle
        if (this.input.isKeyDown('KeyP') || this.input.isKeyDown('Escape')) {
            // Use isKeyDown + manual tracking instead of isKeyPressed
            if (!this.pauseKeyWasDown) {
                if (this.state === GameState.PLAYING) {
                    this.state = GameState.PAUSED;
                } else if (this.state === GameState.PAUSED) {
                    this.state = GameState.PLAYING;
                }
                this.pauseKeyWasDown = true;
            }
        } else {
            this.pauseKeyWasDown = false;
        }

        // Now update input state for the current frame
        this.input.update();

        if (this.state === GameState.MENU) {
            if ((this.input.isKeyDown('Enter') || this.input.isKeyDown('Space')) && !this.menuKeyWasDown) {
                this.state = GameState.PLAYING;
                this.loadLevel(0); // Start from Level 1
                this.menuKeyWasDown = true;
            } else if (!this.input.isKeyDown('Enter') && !this.input.isKeyDown('Space')) {
                this.menuKeyWasDown = false;
            }
            return;
        }

        if (this.state === GameState.PAUSED) {
            return;
        }

        // Apply Speed Multiplier (Fast Forward)
        let speedMultiplier = 1;
        if (this.input.isKeyDown('KeyF')) {
            speedMultiplier = 2;
        }
        const adjustedDt = dt * speedMultiplier;

        // 1. Handle Time Loop Reset
        const loopReset = this.timeManager.update(speedMultiplier);
        if (loopReset) {
            // Check if we hit the loop limit (3)
            if (this.timeManager.getLoop() >= 3) {
                console.log('Loop limit reached! Restarting level...');
                this.loadLevel(this.currentLevelIndex);
                return;
            }

            // Normal loop reset - create ghost
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

        this.player.update(adjustedDt, inputState);

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

                ghost.update(adjustedDt, ghostInput);

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
        const ffIndicator = this.input.isKeyDown('KeyF') ? ' [FF>>]' : '';
        if (statusEl) statusEl.innerText = `Level: ${this.currentLevelIndex + 1} | Loop: ${this.timeManager.getLoop()}${ffIndicator}`;
    };

    private render = (_alpha: number) => {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.state === GameState.MENU) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ECHO LOOP', 400, 200);

            // Draw Start Button
            const buttonX = 300;
            const buttonY = 280;
            const buttonWidth = 200;
            const buttonHeight = 50;

            this.ctx.fillStyle = '#4af';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '24px monospace';
            this.ctx.fillText('START GAME', 400, 315);

            this.ctx.font = '16px monospace';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText('Or press ENTER / SPACE', 400, 360);
            this.ctx.fillText('Instructions:', 400, 410);
            this.ctx.fillText('WASD / Arrows to Move', 400, 435);
            this.ctx.fillText('Cooperate with your past self', 400, 455);
            this.ctx.fillText('Press P to Pause', 400, 475);
            this.ctx.fillText('Hold F to Fast Forward (2x)', 400, 495);
            this.ctx.fillText('Max 3 Loops Per Level', 400, 515);
            return;
        }

        // Check if level is initialized
        if (!this.level || !this.player) {
            return;
        }

        // Render Level
        this.level.render(this.ctx);

        // Render Ghosts
        this.ghosts.forEach(ghost => ghost.render(this.ctx));

        // Render Player
        this.player.render(this.ctx);

        if (this.state === GameState.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', 400, 300);
        }
    };

    private handleCanvasClick = (event: MouseEvent) => {
        if (this.state !== GameState.MENU) return;

        const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if click is on Start button
        const buttonX = 300;
        const buttonY = 280;
        const buttonWidth = 200;
        const buttonHeight = 50;

        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.state = GameState.PLAYING;
            this.loadLevel(0);
        }
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
