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
    maxLoops: number; // Maximum number of loops allowed for this level
    spawnPoint: { x: number, y: number };
    spawnPoints?: { x: number, y: number }[]; // Optional: Specific spawn points for each loop (index 0 = Loop 1)
    walls: Rect[];
    buttons: ButtonData[];
    doors: DoorData[];
    goal: Rect;
}

export const LEVELS: LevelData[] = [
    {
        id: 1,
        name: "The Loop Begins",
        maxLoops: 2,
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
        maxLoops: 2,
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
        maxLoops: 2,
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
    },
    {
        id: 4,
        name: "Timing is Key",
        maxLoops: 3,
        spawnPoint: { x: 50, y: 300 },
        spawnPoints: [
            { x: 50, y: 300 },   // Loop 1: Left
            { x: 350, y: 300 },  // Loop 2: Middle
            { x: 650, y: 300 }   // Loop 3: Right
        ],
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Vertical corridors
            { x: 200, y: 20, width: 20, height: 200 },
            { x: 200, y: 380, width: 20, height: 200 },
            { x: 500, y: 20, width: 20, height: 200 },
            { x: 500, y: 380, width: 20, height: 200 }
        ],
        buttons: [
            { id: 1, x: 100, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 350, y: 300, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            // Door 1 blocks path to button 2
            { id: 1, x: 200, y: 220, width: 20, height: 160, color: '#f44' },
            // Door 2 blocks goal
            { id: 2, x: 500, y: 220, width: 20, height: 160, color: '#44f' }
        ],
        goal: { x: 700, y: 280, width: 50, height: 50 }
    },
    {
        id: 5,
        name: "Triple Threat",
        maxLoops: 3,
        spawnPoint: { x: 100, y: 500 },
        spawnPoints: [
            { x: 50, y: 100 },   // Loop 1: Left Top
            { x: 350, y: 100 },  // Loop 2: Middle Top
            { x: 650, y: 500 }   // Loop 3: Right Bottom
        ],
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Three chambers
            { x: 250, y: 20, width: 20, height: 300 },
            { x: 530, y: 280, width: 20, height: 300 },
            // Platforms
            { x: 100, y: 200, width: 150, height: 20 },
            { x: 550, y: 200, width: 150, height: 20 }
        ],
        buttons: [
            { id: 1, x: 50, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 350, y: 100, width: 40, height: 40, targetDoorId: 2, color: '#44f' },
            { id: 3, x: 650, y: 500, width: 40, height: 40, targetDoorId: 3, color: '#f4f' }
        ],
        doors: [
            { id: 1, x: 250, y: 320, width: 20, height: 260, color: '#f44' },
            { id: 2, x: 530, y: 20, width: 20, height: 260, color: '#44f' },
            { id: 3, x: 350, y: 450, width: 180, height: 20, color: '#f4f' }
        ],
        goal: { x: 400, y: 350, width: 50, height: 50 }
    },
    {
        id: 6,
        name: "Narrow Escape",
        maxLoops: 3,
        spawnPoint: { x: 50, y: 50 },
        spawnPoints: [
            { x: 50, y: 50 },    // Loop 1: Top Left
            { x: 400, y: 50 },   // Loop 2: Top Middle
            { x: 50, y: 500 }    // Loop 3: Bottom Left
        ],
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Narrow zigzag corridors
            { x: 150, y: 20, width: 20, height: 250 },
            { x: 300, y: 330, width: 20, height: 250 },
            { x: 450, y: 20, width: 20, height: 250 },
            { x: 600, y: 330, width: 20, height: 250 },
            // Horizontal barriers
            { x: 20, y: 270, width: 130, height: 20 },
            { x: 170, y: 310, width: 130, height: 20 },
            { x: 320, y: 270, width: 130, height: 20 },
            { x: 470, y: 310, width: 130, height: 20 }
        ],
        buttons: [
            { id: 1, x: 100, y: 500, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 400, y: 100, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            { id: 1, x: 150, y: 270, width: 20, height: 60, color: '#f44' },
            { id: 2, x: 600, y: 270, width: 20, height: 60, color: '#44f' }
        ],
        goal: { x: 700, y: 500, width: 50, height: 50 }
    },
    {
        id: 7,
        name: "Precision Timing",
        maxLoops: 3,
        spawnPoint: { x: 100, y: 100 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Cross pattern
            { x: 350, y: 20, width: 100, height: 20 },
            { x: 350, y: 560, width: 100, height: 20 },
            { x: 350, y: 40, width: 20, height: 220 },
            { x: 430, y: 340, width: 20, height: 220 },
            // Small platforms
            { x: 200, y: 300, width: 80, height: 20 },
            { x: 520, y: 300, width: 80, height: 20 }
        ],
        buttons: [
            { id: 1, x: 50, y: 500, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 220, y: 350, width: 40, height: 40, targetDoorId: 2, color: '#44f' },
            { id: 3, x: 700, y: 100, width: 40, height: 40, targetDoorId: 3, color: '#f4f' }
        ],
        doors: [
            { id: 1, x: 350, y: 260, width: 20, height: 80, color: '#f44' },
            { id: 2, x: 430, y: 260, width: 20, height: 80, color: '#44f' },
            { id: 3, x: 375, y: 280, width: 50, height: 20, color: '#f4f' }
        ],
        goal: { x: 380, y: 350, width: 40, height: 40 }
    },
    {
        id: 8,
        name: "The Labyrinth",
        maxLoops: 3,
        spawnPoint: { x: 50, y: 550 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Complex maze walls
            { x: 100, y: 100, width: 20, height: 200 },
            { x: 100, y: 400, width: 20, height: 100 },
            { x: 200, y: 200, width: 20, height: 300 },
            { x: 300, y: 100, width: 20, height: 200 },
            { x: 300, y: 400, width: 20, height: 100 },
            { x: 400, y: 200, width: 20, height: 300 },
            { x: 500, y: 100, width: 20, height: 200 },
            { x: 500, y: 400, width: 20, height: 100 },
            { x: 600, y: 200, width: 20, height: 300 },
            { x: 700, y: 100, width: 20, height: 200 },
            // Horizontal connectors
            { x: 120, y: 150, width: 80, height: 20 },
            { x: 320, y: 250, width: 80, height: 20 },
            { x: 520, y: 350, width: 80, height: 20 }
        ],
        buttons: [
            { id: 1, x: 50, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 350, y: 350, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            { id: 1, x: 400, y: 100, width: 20, height: 100, color: '#f44' },
            { id: 2, x: 600, y: 100, width: 20, height: 100, color: '#44f' }
        ],
        goal: { x: 720, y: 50, width: 50, height: 50 }
    },
    {
        id: 9,
        name: "Final Gauntlet",
        maxLoops: 4,
        spawnPoint: { x: 50, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            // Four quadrants with narrow passages
            { x: 390, y: 20, width: 20, height: 270 },
            { x: 390, y: 310, width: 20, height: 270 },
            { x: 20, y: 290, width: 370, height: 20 },
            { x: 410, y: 290, width: 370, height: 20 },
            // Additional obstacles
            { x: 150, y: 100, width: 100, height: 20 },
            { x: 550, y: 100, width: 100, height: 20 },
            { x: 150, y: 480, width: 100, height: 20 },
            { x: 550, y: 480, width: 100, height: 20 }
        ],
        buttons: [
            { id: 1, x: 100, y: 50, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 100, y: 520, width: 40, height: 40, targetDoorId: 2, color: '#44f' },
            { id: 3, x: 650, y: 50, width: 40, height: 40, targetDoorId: 3, color: '#f4f' },
            { id: 4, x: 650, y: 520, width: 40, height: 40, targetDoorId: 4, color: '#ff4' }
        ],
        doors: [
            { id: 1, x: 150, y: 120, width: 100, height: 20, color: '#f44' },
            { id: 2, x: 150, y: 460, width: 100, height: 20, color: '#44f' },
            { id: 3, x: 550, y: 120, width: 100, height: 20, color: '#f4f' },
            { id: 4, x: 550, y: 460, width: 100, height: 20, color: '#ff4' }
        ],
        goal: { x: 720, y: 280, width: 50, height: 50 }
    },
    {
        id: 10,
        name: "The Grid",
        maxLoops: 3,
        spawnPoint: { x: 50, y: 50 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 200, y: 0, width: 20, height: 600 },
            { x: 400, y: 0, width: 20, height: 600 },
            { x: 600, y: 0, width: 20, height: 600 },
            { x: 0, y: 200, width: 800, height: 20 },
            { x: 0, y: 400, width: 800, height: 20 }
        ],
        buttons: [
            { id: 1, x: 100, y: 500, width: 40, height: 40, targetDoorId: 1, color: '#4f4' }
        ],
        doors: [
            { id: 1, x: 600, y: 500, width: 20, height: 100, color: '#f44' }
        ],
        goal: { x: 700, y: 500, width: 50, height: 50 }
    },
    {
        id: 11,
        name: "Spiral",
        maxLoops: 4,
        spawnPoint: { x: 400, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 100, y: 100, width: 600, height: 20 },
            { x: 100, y: 100, width: 20, height: 400 },
            { x: 100, y: 500, width: 600, height: 20 },
            { x: 700, y: 200, width: 20, height: 320 },
            { x: 200, y: 200, width: 500, height: 20 },
            { x: 200, y: 200, width: 20, height: 200 },
            { x: 200, y: 400, width: 400, height: 20 }
        ],
        buttons: [
            { id: 1, x: 50, y: 50, width: 40, height: 40, targetDoorId: 1, color: '#4f4' }
        ],
        doors: [
            { id: 1, x: 350, y: 220, width: 100, height: 20, color: '#f44' }
        ],
        goal: { x: 380, y: 250, width: 40, height: 40 }
    },
    {
        id: 12,
        name: "Two Sides",
        maxLoops: 2,
        spawnPoint: { x: 100, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 390, y: 0, width: 20, height: 600 }
        ],
        buttons: [
            { id: 1, x: 50, y: 50, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 700, y: 500, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            { id: 1, x: 390, y: 100, width: 20, height: 100, color: '#f44' },
            { id: 2, x: 390, y: 400, width: 20, height: 100, color: '#44f' }
        ],
        goal: { x: 700, y: 300, width: 50, height: 50 }
    },
    {
        id: 13,
        name: "The Bridge",
        maxLoops: 3,
        spawnPoint: { x: 50, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 200, y: 0, width: 20, height: 250 },
            { x: 200, y: 350, width: 20, height: 250 },
            { x: 500, y: 0, width: 20, height: 250 },
            { x: 500, y: 350, width: 20, height: 250 }
        ],
        buttons: [
            { id: 1, x: 100, y: 100, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 350, y: 500, width: 40, height: 40, targetDoorId: 2, color: '#44f' }
        ],
        doors: [
            { id: 1, x: 200, y: 250, width: 20, height: 100, color: '#f44' },
            { id: 2, x: 500, y: 250, width: 20, height: 100, color: '#44f' }
        ],
        goal: { x: 700, y: 300, width: 50, height: 50 }
    },
    {
        id: 14,
        name: "Cornered",
        maxLoops: 2,
        spawnPoint: { x: 400, y: 300 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 0, y: 0, width: 200, height: 200 },
            { x: 600, y: 0, width: 200, height: 200 },
            { x: 0, y: 400, width: 200, height: 200 },
            { x: 600, y: 400, width: 200, height: 200 }
        ],
        buttons: [
            { id: 1, x: 380, y: 50, width: 40, height: 40, targetDoorId: 1, color: '#4f4' }
        ],
        doors: [
            { id: 1, x: 350, y: 500, width: 100, height: 20, color: '#f44' }
        ],
        goal: { x: 400, y: 550, width: 50, height: 30 }
    },
    {
        id: 15,
        name: "Grand Finale",
        maxLoops: 5,
        spawnPoint: { x: 50, y: 50 },
        walls: [
            { x: 0, y: 0, width: 800, height: 20 },
            { x: 0, y: 580, width: 800, height: 20 },
            { x: 0, y: 0, width: 20, height: 600 },
            { x: 780, y: 0, width: 20, height: 600 },
            { x: 100, y: 100, width: 20, height: 400 },
            { x: 200, y: 100, width: 20, height: 400 },
            { x: 300, y: 100, width: 20, height: 400 },
            { x: 400, y: 100, width: 20, height: 400 },
            { x: 500, y: 100, width: 20, height: 400 },
            { x: 600, y: 100, width: 20, height: 400 }
        ],
        buttons: [
            { id: 1, x: 50, y: 500, width: 40, height: 40, targetDoorId: 1, color: '#4f4' },
            { id: 2, x: 150, y: 50, width: 40, height: 40, targetDoorId: 2, color: '#44f' },
            { id: 3, x: 250, y: 500, width: 40, height: 40, targetDoorId: 3, color: '#f4f' },
            { id: 4, x: 350, y: 50, width: 40, height: 40, targetDoorId: 4, color: '#ff4' },
            { id: 5, x: 450, y: 500, width: 40, height: 40, targetDoorId: 5, color: '#0ff' }
        ],
        doors: [
            { id: 1, x: 100, y: 250, width: 20, height: 100, color: '#f44' },
            { id: 2, x: 200, y: 250, width: 20, height: 100, color: '#44f' },
            { id: 3, x: 300, y: 250, width: 20, height: 100, color: '#f4f' },
            { id: 4, x: 400, y: 250, width: 20, height: 100, color: '#ff4' },
            { id: 5, x: 500, y: 250, width: 20, height: 100, color: '#0ff' }
        ],
        goal: { x: 700, y: 300, width: 50, height: 50 }
    }
];
