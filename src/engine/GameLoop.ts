export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly timeStep: number = 1000 / 60; // 60 FPS fixed update
    private running: boolean = false;

    constructor(
        private update: (dt: number) => void,
        private render: (alpha: number) => void
    ) { }

    public start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(this.loop);
    }

    public stop() {
        this.running = false;
    }

    private loop = (currentTime: number) => {
        if (!this.running) return;

        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap deltaTime to prevent spiral of death if tab is inactive
        if (deltaTime > 1000) deltaTime = 1000;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }

        const alpha = this.accumulator / this.timeStep;
        this.render(alpha);

        requestAnimationFrame(this.loop);
    };
}
