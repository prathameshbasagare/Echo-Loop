import { InputState } from './TimeManager';

export class Player {
    public x: number;
    public y: number;
    public width: number = 40;
    public height: number = 40;
    public color: string;
    public speed: number = 0.3;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    public update(dt: number, input: InputState) {
        // Input now contains actual velocity (vx, vy) not direction
        this.x += input.vx * dt;
        this.y += input.vy * dt;
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw eye to show direction/front
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - 5, this.y - 10, 10, 10);
    }

    public getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
