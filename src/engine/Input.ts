export class Input {
    private keys: Set<string> = new Set();
    private previousKeys: Set<string> = new Set();

    constructor() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    public update() {
        this.previousKeys = new Set(this.keys);
    }

    public isKeyDown(code: string): boolean {
        return this.keys.has(code);
    }

    public isKeyPressed(code: string): boolean {
        return this.keys.has(code) && !this.previousKeys.has(code);
    }

    public getAxis(negative: string, positive: string): number {
        let value = 0;
        if (this.keys.has(positive)) value += 1;
        if (this.keys.has(negative)) value -= 1;
        return value;
    }
}
