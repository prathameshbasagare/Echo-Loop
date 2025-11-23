import { LevelData, LEVELS } from '../game/LevelData';

export class LevelService {
    private static STORAGE_KEY = 'echo_loop_levels';
    private levels: LevelData[];

    constructor() {
        this.levels = this.loadLevels();
    }

    private loadLevels(): LevelData[] {
        const stored = localStorage.getItem(LevelService.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [...LEVELS]; // Return a copy of the default levels
    }

    private saveToStorage() {
        localStorage.setItem(LevelService.STORAGE_KEY, JSON.stringify(this.levels));
    }

    getLevels(): LevelData[] {
        return this.levels;
    }

    getLevel(id: number): LevelData | undefined {
        return this.levels.find(l => l.id === id);
    }

    saveLevel(level: LevelData): void {
        const index = this.levels.findIndex(l => l.id === level.id);
        if (index >= 0) {
            this.levels[index] = level;
        } else {
            // Generate new ID if not present (simple max + 1)
            if (!level.id) {
                const maxId = this.levels.reduce((max, l) => Math.max(max, l.id), 0);
                level.id = maxId + 1;
            }
            this.levels.push(level);
        }
        this.saveToStorage();
    }

    deleteLevel(id: number): void {
        this.levels = this.levels.filter(l => l.id !== id);
        this.saveToStorage();
    }

    // Helper to create a blank level
    createEmptyLevel(): LevelData {
        return {
            id: 0, // Will be assigned on save
            name: 'New Level',
            maxLoops: 1,
            spawnPoint: { x: 50, y: 50 },
            walls: [],
            buttons: [],
            doors: [],
            goal: { x: 700, y: 500, width: 50, height: 50 }
        };
    }
}

export const levelService = new LevelService();
