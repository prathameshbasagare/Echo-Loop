export interface InputState {
    dx: number;
    dy: number;
}

export class TimeManager {
    public recordings: Map<number, InputState[]> = new Map();
    public currentFrame: number = 0;
    private loopDurationFrames: number = 60 * 15; // 15 seconds at 60 FPS
    public currentLoop: number = 1;

    constructor() {
        this.recordings.set(this.currentLoop, []);
    }

    public update(speedMultiplier: number = 1): boolean {
        this.currentFrame += speedMultiplier;

        if (this.currentFrame >= this.loopDurationFrames) {
            // Check if we've hit the loop limit
            if (this.currentLoop >= 3) {
                return true; // Signal to restart level
            }
            this.resetLoop();
            return true; // Loop reset occurred
        }
        return false;
    }

    public recordInput(input: InputState) {
        const currentRecording = this.recordings.get(this.currentLoop);
        if (currentRecording) {
            currentRecording[this.currentFrame] = input;
        }
    }

    public getGhostInput(loopIndex: number, frameIndex: number): InputState | null {
        const recording = this.recordings.get(loopIndex);
        if (recording && recording[frameIndex]) {
            return recording[frameIndex];
        }
        return null;
    }

    public resetLoop() {
        this.currentLoop++;
        this.recordings.set(this.currentLoop, []);
        this.currentFrame = 0;
    }

    public getFrame(): number {
        return this.currentFrame;
    }

    public getLoop(): number {
        return this.currentLoop;
    }

    public getTimeRemaining(): number {
        return (this.loopDurationFrames - this.currentFrame) / 60;
    }

    public getPastLoops(): number[] {
        return Array.from(this.recordings.keys()).filter(l => l < this.currentLoop);
    }
}
