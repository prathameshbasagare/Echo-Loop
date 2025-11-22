import { LevelData } from './LevelData';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Button extends Rect {
    id: number;
    isPressed: boolean;
    targetDoorId: number;
    color: string;
}

interface Door extends Rect {
    id: number;
    isOpen: boolean;
    color: string;
}

export class Level {
    private walls: Rect[] = [];
    private buttons: Button[] = [];
    private doors: Door[] = [];
    private goal: Rect;
    public spawnPoint: { x: number, y: number };
    public spawnPoints?: { x: number, y: number }[]; // Optional: Specific spawn points for each loop
    public maxLoops: number; // Maximum loops allowed for this level

    constructor(data: LevelData) {
        this.walls = [...data.walls];
        this.goal = { ...data.goal };
        this.spawnPoint = { ...data.spawnPoint };
        if (data.spawnPoints) {
            this.spawnPoints = [...data.spawnPoints];
        }
        this.maxLoops = data.maxLoops;

        this.buttons = data.buttons.map(b => ({
            ...b,
            isPressed: false
        }));

        this.doors = data.doors.map(d => ({
            ...d,
            isOpen: false
        }));
    }

    public getGoal(): Rect {
        return this.goal;
    }

    public update(entities: Rect[]) {
        // Reset buttons
        for (const btn of this.buttons) {
            btn.isPressed = false;
        }

        // Check if any entity is on a button
        for (const entity of entities) {
            for (const btn of this.buttons) {
                if (this.intersects(entity, btn)) {
                    btn.isPressed = true;
                }
            }
        }

        // Update doors based on buttons
        for (const door of this.doors) {
            const triggerBtn = this.buttons.find(b => b.targetDoorId === door.id);
            if (triggerBtn) {
                door.isOpen = triggerBtn.isPressed;
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D) {
        // Draw Goal
        ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        ctx.strokeStyle = '#afa';
        ctx.strokeRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);

        // Draw Walls
        ctx.fillStyle = '#666';
        for (const wall of this.walls) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }

        // Draw Buttons
        for (const btn of this.buttons) {
            ctx.fillStyle = btn.isPressed ? '#2a2' : btn.color;
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        }

        // Draw Doors
        for (const door of this.doors) {
            if (!door.isOpen) {
                ctx.fillStyle = door.color;
                ctx.fillRect(door.x, door.y, door.width, door.height);
            } else {
                // Draw open door outline
                ctx.strokeStyle = door.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(door.x, door.y, door.width, door.height);
            }
        }
    }

    public checkCollision(rect: Rect): boolean {
        // Check walls
        for (const wall of this.walls) {
            if (this.intersects(rect, wall)) return true;
        }

        // Check closed doors
        for (const door of this.doors) {
            if (!door.isOpen && this.intersects(rect, door)) return true;
        }

        return false;
    }

    private intersects(r1: Rect, r2: Rect): boolean {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    }
}
