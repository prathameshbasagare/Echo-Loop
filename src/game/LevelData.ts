import { Rect } from './Level';

export interface ButtonData extends Rect {
    id: number;
    targetDoorId: number;
    color: string;
}

export interface DoorData extends Rect {
    id: number;
    color: string;
}

export interface LevelData {
    id: number;
    name: string;
    spawnPoint: { x: number, y: number };
    walls: Rect[];
    buttons: ButtonData[];
    doors: DoorData[];
    goal: Rect;
}

export const LEVELS: LevelData[] = [
    {
        id: 1,
        name: "The Loop Begins",
        spawnPoint: { x: 100, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 300, y: 200, width: 200, height: 20 },
            { x: 300, y: 380, width: 200, height: 20 }
        ],
        buttons: [
            { id: 1, x: 100, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#4f4' }
        ],
        doors: [
            { id: 1, x: 500, y: 220, width: 20, height: 160, color: '#f44' }
        ],
        goal: { x: 700, y: 250, width: 50, height: 100 }
    },
    {
        id: 2,
        name: "Double Trouble",
        spawnPoint: { x: 50, y: 50 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Central divider
            { x: 390, y: 20, width: 20, height: 400 },
            // Goal guard
            { x: 600, y: 400, width: 200, height: 20 }
        ],
        buttons: [
            { id: 1, x: 50, y: 500, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 300, y: 50, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            // Door 1 blocks access to Button 2 area
            { id: 1, x: 390, y: 420, width: 20, height: 160, color: '#f44' },
            // Door 2 blocks goal
            { id: 2, x: 600, y: 420, width: 20, height: 160, color: '#44f' }
        ],
        goal: { x: 700, y: 500, width: 50, height: 50 }
    },
    {
        id: 3,
        name: "The Maze",
        spawnPoint: { x: 100, y: 500 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Simple maze - three paths
            { x: 200, y: 100, width: 20, height: 300 },
            { x: 400, y: 200, width: 20, height: 380 },
            { x: 600, y: 20, width: 20, height: 300 }
        ],
        buttons: [
            { id: 1, x: 50, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#f4f' }
        ],
        doors: [
            { id: 1, x: 600, y: 320, width: 20, height: 260, color: '#f4f' }
        ],
        goal: { x: 700, y: 450, width: 50, height: 50 }
    }
];

