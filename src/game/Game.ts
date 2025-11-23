import { GameLoop } from '../engine/GameLoop';
import { Input } from '../engine/Input';
import { TimeManager } from './TimeManager';
import { Player } from './Player';
import { Level } from './Level';
import { levelService } from '../services/LevelService';

enum GameState {
    MENU,
    LEVEL_SELECT,
    PLAYING,
    PAUSED,
    LEVEL_COMPLETE,
    LEVEL_FAILED,
    GAME_COMPLETE
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
    private selectedLevelIndex: number = -1; // -1 means no level selected
    private completedLevels: Set<number> = new Set(); // Track completed level IDs
    private scrollOffset: number = 0;
    private maxScroll: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.input = new Input();
        this.timeManager = new TimeManager();

        // Load progress from localStorage
        this.loadProgress();

        // Don't load level yet - wait for user to start from menu

        // Add click listener for Start button
        canvas.addEventListener('click', this.handleCanvasClick);
        canvas.addEventListener('wheel', this.handleWheel);

        this.loop = new GameLoop(this.update, this.render);
    }

    private handleWheel = (event: WheelEvent) => {
        if (this.state === GameState.LEVEL_SELECT) {
            this.scrollOffset += event.deltaY;
            // Clamp scroll
            this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
            event.preventDefault();
        }
    };

    private loadProgress() {
        const saved = localStorage.getItem('echoLoopProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.completedLevels = new Set(data.completedLevels || []);
            } catch (e) {
                console.error('Failed to load progress:', e);
            }
        }
    }

    private saveProgress() {
        const data = {
            completedLevels: Array.from(this.completedLevels)
        };
        localStorage.setItem('echoLoopProgress', JSON.stringify(data));
    }

    private markLevelComplete(levelIndex: number) {
        const levels = levelService.getLevels();
        const levelId = levels[levelIndex].id;
        this.completedLevels.add(levelId);
        this.saveProgress();
    }

    private isLevelUnlocked(levelIndex: number): boolean {
        // Level 1 is always unlocked
        if (levelIndex === 0) return true;

        // Check if previous level is completed
        const levels = levelService.getLevels();
        const previousLevelId = levels[levelIndex - 1].id;
        return this.completedLevels.has(previousLevelId);
    }

    private isLevelCompleted(levelIndex: number): boolean {
        const levels = levelService.getLevels();
        const levelId = levels[levelIndex].id;
        return this.completedLevels.has(levelId);
    }

    private getSpawnPoint(loopIndex: number): { x: number, y: number } {
        if (this.level.spawnPoints && this.level.spawnPoints.length >= loopIndex) {
            return this.level.spawnPoints[loopIndex - 1];
        }
        return this.level.spawnPoint;
    }

    private loadLevel(index: number) {
        const levels = levelService.getLevels();
        if (index >= levels.length) {
            alert("You beat all levels! Game Over.");
            this.currentLevelIndex = 0;
            index = 0;
            this.state = GameState.MENU; // Return to menu on completion
        }

        this.currentLevelIndex = index;
        const data = levels[index];
        this.level = new Level(data);

        // Set initial spawn point for Loop 1
        const spawn = this.getSpawnPoint(1);
        this.startX = spawn.x;
        this.startY = spawn.y;

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
                this.state = GameState.LEVEL_SELECT;
                this.menuKeyWasDown = true;
            } else if (!this.input.isKeyDown('Enter') && !this.input.isKeyDown('Space')) {
                this.menuKeyWasDown = false;
            }
            return;
        }

        if (this.state === GameState.LEVEL_SELECT) {
            // Level selection is handled by mouse clicks
            return;
        }

        if (this.state === GameState.LEVEL_COMPLETE) {
            // Level complete screen is handled by mouse clicks
            return;
        }

        if (this.state === GameState.LEVEL_FAILED) {
            // Level failed screen is handled by mouse clicks
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
            // Check if we hit the loop limit for this level
            if (this.timeManager.getLoop() > this.level.maxLoops) {
                console.log(`Loop limit reached (${this.level.maxLoops} loops)! Level failed.`);
                this.state = GameState.LEVEL_FAILED;
                return;
            }

            // Normal loop reset - create ghost
            const finishedLoop = this.timeManager.getLoop() - 1;

            // Get spawn point for the finished loop to place the ghost correctly
            const ghostSpawn = this.getSpawnPoint(finishedLoop);
            this.ghosts.set(finishedLoop, new Player(ghostSpawn.x, ghostSpawn.y, `rgba(255, 255, 255, 0.5)`));

            // Reset ALL ghosts to their specific start positions
            this.ghosts.forEach((ghost, loopIndex) => {
                const spawn = this.getSpawnPoint(loopIndex);
                ghost.x = spawn.x;
                ghost.y = spawn.y;
            });

            // Set player to spawn point for the NEW loop
            const currentLoop = this.timeManager.getLoop();
            const playerSpawn = this.getSpawnPoint(currentLoop);
            this.player.x = playerSpawn.x;
            this.player.y = playerSpawn.y;

            // Update startX/startY for reference (though less critical now with dynamic spawns)
            this.startX = playerSpawn.x;
            this.startY = playerSpawn.y;
        }

        // 2. Get Current Input Direction
        let dx = this.input.getAxis('ArrowLeft', 'ArrowRight') + this.input.getAxis('KeyA', 'KeyD');
        let dy = this.input.getAxis('ArrowUp', 'ArrowDown') + this.input.getAxis('KeyW', 'KeyS');

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        // Calculate BASE velocity (WITHOUT speedMultiplier)
        // speedMultiplier will be applied via adjustedDt
        const baseVelocity = {
            vx: dx * this.player.speed,
            vy: dy * this.player.speed
        };

        // 3. Record Base Velocity
        this.timeManager.recordInput(baseVelocity);

        // 4. Update Current Player with Collision
        const oldX = this.player.x;
        const oldY = this.player.y;

        this.player.update(adjustedDt, baseVelocity);

        if (this.level.checkCollision(this.player.getBounds())) {
            this.player.x = oldX;
            this.player.y = oldY;
        }

        // 5. Update Ghosts (apply current speedMultiplier via adjustedDt)
        const currentFrame = Math.floor(this.timeManager.getFrame());
        this.timeManager.getPastLoops().forEach(loopIndex => {
            const ghost = this.ghosts.get(loopIndex);
            const recordedVelocity = this.timeManager.getGhostInput(loopIndex, currentFrame);

            if (ghost && recordedVelocity) {
                const gOldX = ghost.x;
                const gOldY = ghost.y;

                // Use recorded velocity with current adjustedDt
                // No need to scale - adjustedDt already has speedMultiplier
                ghost.update(adjustedDt, recordedVelocity);

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

        // Check Win Condition
        const playerBounds = this.player.getBounds();
        const goalBounds = this.level.getGoal();
        if (this.checkCollisionRect(playerBounds, goalBounds)) {
            console.log("WIN!");

            // Mark level as complete
            this.markLevelComplete(this.currentLevelIndex);

            // Check if this was the last level
            const levels = levelService.getLevels();
            if (this.currentLevelIndex >= levels.length - 1) {
                // All levels completed!
                this.state = GameState.GAME_COMPLETE;
            } else {
                // Show level complete screen
                this.state = GameState.LEVEL_COMPLETE;
            }
            return;
        }

        // Update UI (only during gameplay)
        const timerEl = document.getElementById('timer');
        const statusEl = document.getElementById('status');

        if (this.state === GameState.GAME_COMPLETE) {
            // Hide timer and status when game is complete
            if (timerEl) timerEl.innerText = '';
            if (statusEl) statusEl.innerText = '';
        } else if (this.state === GameState.PLAYING) {
            // Show normal UI during gameplay
            if (timerEl) timerEl.innerText = this.timeManager.getTimeRemaining().toFixed(1);
            const ffIndicator = this.input.isKeyDown('KeyF') ? ' [FF>>]' : '';
            if (statusEl) statusEl.innerText = `Level: ${this.currentLevelIndex + 1} | Loop: ${this.timeManager.getLoop()}/${this.level.maxLoops}${ffIndicator}`;
        }
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
            this.ctx.fillText('Each level has a loop limit', 400, 515);
            return;
        }

        if (this.state === GameState.LEVEL_SELECT) {
            // Draw Header Background
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 0, 800, 100);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '32px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SELECT LEVEL', 400, 60);

            // Calculate Grid Dimensions
            const gridStartX = 90; // Centered: (800 - (3*180 + 2*40)) / 2 = 90
            const gridStartY = 120;
            const cardWidth = 180;
            const cardHeight = 140;
            const cardSpacing = 40;

            const levels = levelService.getLevels();
            const rows = Math.ceil(levels.length / 3);
            const totalGridHeight = rows * (cardHeight + cardSpacing);
            const visibleHeight = 400; // 600 - 100 (header) - 100 (footer)
            this.maxScroll = Math.max(0, totalGridHeight - visibleHeight + 40); // +40 for padding

            // Save context for clipping
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(0, 100, 800, 400); // Clip area between header and footer
            this.ctx.clip();

            levels.forEach((level, index) => {
                const col = index % 3;
                const row = Math.floor(index / 3);
                const x = gridStartX + col * (cardWidth + cardSpacing);
                const y = gridStartY + row * (cardHeight + cardSpacing) - this.scrollOffset;

                // Optimization: Don't draw if out of view
                if (y + cardHeight < 100 || y > 500) return;

                const isUnlocked = this.isLevelUnlocked(index);
                const isCompleted = this.isLevelCompleted(index);
                const isSelected = this.selectedLevelIndex === index;

                // Card background
                if (!isUnlocked) {
                    this.ctx.fillStyle = '#333'; // Locked - darker
                } else if (isSelected) {
                    this.ctx.fillStyle = '#4af'; // Selected - blue
                } else if (isCompleted) {
                    this.ctx.fillStyle = '#464'; // Completed - dark green
                } else {
                    this.ctx.fillStyle = '#555'; // Available - gray
                }
                this.ctx.fillRect(x, y, cardWidth, cardHeight);

                // Card border
                if (isSelected) {
                    this.ctx.strokeStyle = '#fff';
                } else if (isCompleted) {
                    this.ctx.strokeStyle = '#4f4';
                } else if (isUnlocked) {
                    this.ctx.strokeStyle = '#777';
                } else {
                    this.ctx.strokeStyle = '#444';
                }
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x, y, cardWidth, cardHeight);

                // Level number
                this.ctx.fillStyle = isUnlocked ? '#fff' : '#666';
                this.ctx.font = 'bold 48px monospace';
                this.ctx.fillText(`${level.id}`, x + cardWidth / 2, y + 60);

                // Level name
                this.ctx.font = '14px monospace';
                this.ctx.fillStyle = isUnlocked ? '#ddd' : '#555';
                this.ctx.fillText(level.name, x + cardWidth / 2, y + 95);

                // Level info or lock icon
                this.ctx.font = '11px monospace';
                if (!isUnlocked) {
                    this.ctx.fillStyle = '#888';
                    this.ctx.font = '40px monospace';
                    this.ctx.fillText('🔒', x + cardWidth / 2, y + 125);
                } else {
                    this.ctx.fillStyle = '#aaa';
                    this.ctx.font = '11px monospace';
                    this.ctx.fillText(`${level.buttons.length} Button${level.buttons.length !== 1 ? 's' : ''}`, x + cardWidth / 2, y + 120);
                }

                // Completion checkmark
                if (isCompleted) {
                    this.ctx.fillStyle = '#4f4';
                    this.ctx.font = 'bold 24px monospace';
                    this.ctx.fillText('✓', x + cardWidth - 20, y + 25);
                }
            });

            this.ctx.restore(); // Restore clipping

            // Draw Bottom Overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(0, 500, 800, 100);

            // Instructions
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = '#aaa';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click on a level to select...', 400, 525);

            // Draw Start button if a level is selected
            if (this.selectedLevelIndex !== -1) {
                const buttonX = 300; // Centered button
                const buttonY = 540;
                const buttonWidth = 200;
                const buttonHeight = 40;

                // Only show start button if level is unlocked
                if (this.isLevelUnlocked(this.selectedLevelIndex)) {
                    this.ctx.fillStyle = '#4f4';
                    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    this.ctx.fillStyle = '#000';
                    this.ctx.font = 'bold 20px monospace';
                    this.ctx.fillText('START', buttonX + buttonWidth / 2, buttonY + 28);
                } else {
                    this.ctx.fillStyle = '#555';
                    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    this.ctx.fillStyle = '#888';
                    this.ctx.font = 'bold 20px monospace';
                    this.ctx.fillText('LOCKED', buttonX + buttonWidth / 2, buttonY + 28);
                }
            }

            return;
        }

        if (this.state === GameState.LEVEL_COMPLETE) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', 400, 150);

            this.ctx.font = '24px monospace';
            this.ctx.fillStyle = '#4f4';
            const levels = levelService.getLevels();
            this.ctx.fillText(`${levels[this.currentLevelIndex].name}`, 400, 200);

            // Draw buttons
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonSpacing = 20;
            const startY = 280;

            // Retry button
            const retryX = 300;
            const retryY = startY;
            this.ctx.fillStyle = '#f84';
            this.ctx.fillRect(retryX, retryY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '20px monospace';
            this.ctx.fillText('RETRY', retryX + buttonWidth / 2, retryY + 33);

            // Next Level button (if not last level)
            if (this.currentLevelIndex < levels.length - 1) {
                const nextX = 300;
                const nextY = startY + buttonHeight + buttonSpacing;
                this.ctx.fillStyle = '#4f4';
                this.ctx.fillRect(nextX, nextY, buttonWidth, buttonHeight);
                this.ctx.fillStyle = '#000';
                this.ctx.font = '20px monospace';
                this.ctx.fillText('NEXT LEVEL', nextX + buttonWidth / 2, nextY + 33);
            }

            // Main Menu button
            const menuX = 300;
            const menuY = this.currentLevelIndex < levels.length - 1
                ? startY + 2 * (buttonHeight + buttonSpacing)
                : startY + buttonHeight + buttonSpacing;
            this.ctx.fillStyle = '#48f';
            this.ctx.fillRect(menuX, menuY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '20px monospace';
            this.ctx.fillText('MAIN MENU', menuX + buttonWidth / 2, menuY + 33);

            return;
        }

        if (this.state === GameState.LEVEL_FAILED) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL FAILED', 400, 150);

            this.ctx.font = '20px monospace';
            this.ctx.fillStyle = '#f84';
            this.ctx.fillText('You ran out of loops!', 400, 200);

            this.ctx.font = '16px monospace';
            this.ctx.fillStyle = '#aaa';
            const levels = levelService.getLevels();
            this.ctx.fillText(`${levels[this.currentLevelIndex].name}`, 400, 230);

            // Draw buttons
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonSpacing = 20;
            const startY = 300;

            // Retry button
            const retryX = 300;
            const retryY = startY;
            this.ctx.fillStyle = '#f84';
            this.ctx.fillRect(retryX, retryY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '20px monospace';
            this.ctx.fillText('RETRY', retryX + buttonWidth / 2, retryY + 33);

            // Main Menu button
            const menuX = 300;
            const menuY = startY + buttonHeight + buttonSpacing;
            this.ctx.fillStyle = '#48f';
            this.ctx.fillRect(menuX, menuY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '20px monospace';
            this.ctx.fillText('MAIN MENU', menuX + buttonWidth / 2, menuY + 33);

            return;
        }

        if (this.state === GameState.GAME_COMPLETE) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONGRATULATIONS!', 400, 180);

            this.ctx.font = '24px monospace';
            this.ctx.fillStyle = '#4f4';
            this.ctx.fillText('All Levels Completed!', 400, 230);

            this.ctx.font = '20px monospace';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText('Thank you for playing Echo Loop', 400, 280);

            // Draw Play Again Button
            const buttonX = 300;
            const buttonY = 340;
            const buttonWidth = 200;
            const buttonHeight = 50;

            this.ctx.fillStyle = '#4af';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '24px monospace';
            this.ctx.fillText('PLAY AGAIN', 400, 375);

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
        const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.state === GameState.MENU) {
            // Check if click is on Start button
            const buttonX = 300;
            const buttonY = 280;
            const buttonWidth = 200;
            const buttonHeight = 50;

            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.state = GameState.LEVEL_SELECT;
            }
        } else if (this.state === GameState.LEVEL_SELECT) {
            // Check if click is on a level card
            const gridStartX = 90;
            const gridStartY = 120;
            const cardWidth = 180;
            const cardHeight = 140;
            const cardSpacing = 40;

            // Check Start Button Click (Fixed position in footer)
            if (this.selectedLevelIndex !== -1) {
                const buttonX = 300;
                const buttonY = 540;
                const buttonWidth = 200;
                const buttonHeight = 40;

                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {

                    if (this.isLevelUnlocked(this.selectedLevelIndex)) {
                        this.state = GameState.PLAYING;
                        this.loadLevel(this.selectedLevelIndex);
                    }
                    return; // Handled click
                }
            }

            // Check Level Card Clicks (Scrolled position)
            // Only check if click is within the scrollable area (100-500)
            if (y >= 100 && y <= 500) {
                const levels = levelService.getLevels();
                levels.forEach((_level, index) => {
                    const col = index % 3;
                    const row = Math.floor(index / 3);
                    const cardX = gridStartX + col * (cardWidth + cardSpacing);
                    const cardY = gridStartY + row * (cardHeight + cardSpacing) - this.scrollOffset;

                    if (x >= cardX && x <= cardX + cardWidth &&
                        y >= cardY && y <= cardY + cardHeight) {
                        // Only allow selecting unlocked levels
                        if (this.isLevelUnlocked(index)) {
                            this.selectedLevelIndex = index;
                        }
                    }
                });
            }
        } else if (this.state === GameState.LEVEL_COMPLETE) {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonSpacing = 20;
            const startY = 280;

            // Retry button
            const retryX = 300;
            const retryY = startY;
            if (x >= retryX && x <= retryX + buttonWidth &&
                y >= retryY && y <= retryY + buttonHeight) {
                this.state = GameState.PLAYING;
                this.loadLevel(this.currentLevelIndex);
                return;
            }

            // Next Level button (if not last level)
            const levels = levelService.getLevels();
            if (this.currentLevelIndex < levels.length - 1) {
                const nextX = 300;
                const nextY = startY + buttonHeight + buttonSpacing;
                if (x >= nextX && x <= nextX + buttonWidth &&
                    y >= nextY && y <= nextY + buttonHeight) {
                    this.state = GameState.PLAYING;
                    this.loadLevel(this.currentLevelIndex + 1);
                    return;
                }
            }

            // Main Menu button
            const menuX = 300;
            const menuY = this.currentLevelIndex < levels.length - 1
                ? startY + 2 * (buttonHeight + buttonSpacing)
                : startY + buttonHeight + buttonSpacing;
            if (x >= menuX && x <= menuX + buttonWidth &&
                y >= menuY && y <= menuY + buttonHeight) {
                this.state = GameState.LEVEL_SELECT;
                this.selectedLevelIndex = -1;
            }
        } else if (this.state === GameState.LEVEL_FAILED) {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonSpacing = 20;
            const startY = 300;

            // Retry button
            const retryX = 300;
            const retryY = startY;
            if (x >= retryX && x <= retryX + buttonWidth &&
                y >= retryY && y <= retryY + buttonHeight) {
                this.state = GameState.PLAYING;
                this.loadLevel(this.currentLevelIndex);
                return;
            }

            // Main Menu button
            const menuX = 300;
            const menuY = startY + buttonHeight + buttonSpacing;
            if (x >= menuX && x <= menuX + buttonWidth &&
                y >= menuY && y <= menuY + buttonHeight) {
                this.state = GameState.LEVEL_SELECT;
                this.selectedLevelIndex = -1;
            }
        } else if (this.state === GameState.GAME_COMPLETE) {
            // Check if click is on Play Again button
            const buttonX = 300;
            const buttonY = 340;
            const buttonWidth = 200;
            const buttonHeight = 50;

            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                // Go back to level select instead of reloading
                this.state = GameState.LEVEL_SELECT;
                this.selectedLevelIndex = -1;
            }
        }
    };

    private checkCollision(p1: Player, p2: Player): boolean {
        // Safe Zone Check: If either player is near THEIR spawn, no paradox
        // We need to know which loop p1 and p2 belong to.
        // p1 is always the current player (this.player)
        // p2 is a ghost. We need to find its loop index.

        let p2Loop = -1;
        for (const [loop, ghost] of this.ghosts.entries()) {
            if (ghost === p2) {
                p2Loop = loop;
                break;
            }
        }

        const currentLoop = this.timeManager.getLoop();

        if (this.isSafe(p1, currentLoop) || (p2Loop !== -1 && this.isSafe(p2, p2Loop))) return false;

        return this.checkCollisionRect(p1.getBounds(), p2.getBounds());
    }

    private isSafe(p: Player, loopIndex: number): boolean {
        const spawn = this.getSpawnPoint(loopIndex);
        const dist = Math.sqrt(Math.pow(p.x - spawn.x, 2) + Math.pow(p.y - spawn.y, 2));
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
