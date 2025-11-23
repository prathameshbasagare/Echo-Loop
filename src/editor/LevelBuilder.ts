import { LevelData } from '../game/LevelData';
import { Rect } from '../game/Level';
import { levelService } from '../services/LevelService';

export class LevelBuilder {
    private container: HTMLElement;
    private level: LevelData;
    private onBack: () => void;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private draggedItem: string | null = null;
    private isDraggingOnCanvas: boolean = false;
    private selectedComponent: any = null; // Could be Wall, Button, Door
    private selectedType: string | null = null;
    private dragOffset: { x: number, y: number } = { x: 0, y: 0 };

    constructor(container: HTMLElement, level: LevelData, onBack: () => void) {
        this.container = container;
        this.level = JSON.parse(JSON.stringify(level)); // Deep copy to avoid direct mutation
        this.onBack = onBack;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    render() {
        this.container.innerHTML = `
            <div class="editor-layout">
                <div class="sidebar">
                    <div class="sidebar-content">
                        <div class="tool-section">
                            <h4>Level Properties</h4>
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" id="level-name" value="${this.level.name}">
                            </div>
                            <div class="form-group">
                                <label>Max Loops</label>
                                <input type="number" id="level-loops" value="${this.level.maxLoops}">
                            </div>
                            <button id="add-loop-spawn-btn" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">Add Loop Spawn</button>
                        </div>
                        
                        <div class="tool-section">
                            <h4>Components</h4>
                            <div class="component-list">
                                <div class="draggable-item" draggable="true" data-type="wall">Wall</div>
                                <div class="draggable-item" draggable="true" data-type="button">Button & Door</div>
                                <!-- Door is now added automatically with Button -->
                                <div class="draggable-item" draggable="true" data-type="goal">Goal</div>
                                <!-- Initial Spawn removed, use Add Loop Spawn -->
                            </div>
                        </div>

                        <div class="tool-section properties-panel" id="properties-panel">
                            <h4>Selected Item</h4>
                            <p>Select an item to edit properties</p>
                        </div>
                    </div>

                    <div class="sidebar-footer">
                        <button id="save-level-btn" class="btn btn-primary" style="flex: 1;">Save</button>
                        <button id="back-btn" class="btn btn-danger" style="flex: 1;">Back</button>
                    </div>
                </div>
                <div class="canvas-area" id="drop-zone">
                    <!-- Canvas injected here -->
                </div>
            </div>
        `;

        const canvasArea = this.container.querySelector('.canvas-area')!;
        this.canvas.id = 'editor-canvas';
        this.canvas.width = 800;
        this.canvas.height = 600;
        canvasArea.appendChild(this.canvas);

        this.attachEventListeners();
        this.draw();
    }

    private attachEventListeners() {
        // Form inputs
        const nameInput = this.container.querySelector('#level-name') as HTMLInputElement;
        nameInput.addEventListener('change', (e) => this.level.name = (e.target as HTMLInputElement).value);

        const loopsInput = this.container.querySelector('#level-loops') as HTMLInputElement;
        loopsInput.addEventListener('change', (e) => this.level.maxLoops = parseInt((e.target as HTMLInputElement).value));

        this.container.querySelector('#add-loop-spawn-btn')?.addEventListener('click', () => {
            if (!this.level.spawnPoints) this.level.spawnPoints = [];

            if (this.level.spawnPoints.length >= this.level.maxLoops) {
                alert(`Cannot add more spawn points than Max Loops (${this.level.maxLoops})`);
                return;
            }

            // If this is the first one, maybe sync it with main spawnPoint?
            // For now just add to array.
            this.level.spawnPoints.push({ x: 100, y: 100 });

            // Ensure main spawnPoint is set to the first loop spawn if it exists, for legacy compatibility
            if (this.level.spawnPoints.length === 1) {
                this.level.spawnPoint = this.level.spawnPoints[0];
            }

            this.draw();
        });

        // Buttons
        this.container.querySelector('#save-level-btn')?.addEventListener('click', () => {
            levelService.saveLevel(this.level);
            alert('Level saved!');
        });

        this.container.querySelector('#back-btn')?.addEventListener('click', () => {
            this.onBack();
        });

        // Drag from sidebar
        const draggables = this.container.querySelectorAll('.draggable-item');
        draggables.forEach(el => {
            el.addEventListener('dragstart', (e: any) => {
                this.draggedItem = e.target.dataset.type;
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        const dropZone = this.container.querySelector('#drop-zone') as HTMLElement;
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.addComponent(this.draggedItem, x, y);
                this.draggedItem = null;
                this.draw();
            }
        });

        // Canvas interactions (Select, Move)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    }

    private addComponent(type: string, x: number, y: number) {
        // Snap to grid (optional, let's say 10px)
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;

        switch (type) {
            case 'wall':
                this.level.walls.push({ x, y, width: 100, height: 20 });
                break;
            case 'button':
                // Create linked Button and Door
                const linkId = (this.level.doors.length > 0 ? Math.max(...this.level.doors.map(d => d.id)) : 0) + 1;
                const btnId = (this.level.buttons.length > 0 ? Math.max(...this.level.buttons.map(b => b.id)) : 0) + 1;

                // Random color for the pair
                const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

                this.level.buttons.push({
                    id: btnId,
                    x,
                    y,
                    width: 40,
                    height: 40,
                    targetDoorId: linkId,
                    color: color
                });

                this.level.doors.push({
                    id: linkId,
                    x: x + 60, // Place door slightly to the right
                    y,
                    width: 20,
                    height: 100,
                    color: color
                });
                break;
            case 'door':
                // Deprecated in UI, but keeping logic just in case or for legacy support
                const doorId = (this.level.doors.length > 0 ? Math.max(...this.level.doors.map(d => d.id)) : 0) + 1;
                this.level.doors.push({ id: doorId, x, y, width: 20, height: 100, color: '#f44' });
                break;
            case 'goal':
                this.level.goal = { x, y, width: 50, height: 50 };
                break;
            case 'goal':
                this.level.goal = { x, y, width: 50, height: 50 };
                break;
            // Spawn case removed
        }
    }

    private handleMouseDown(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check for selection (reverse order to pick top-most)
        // Check Goal
        if (this.isPointInRect(mouseX, mouseY, this.level.goal)) {
            this.startDragging(this.level.goal, mouseX, mouseY, 'Goal');
            return;
        }
        // Check Spawn (visualize as 20x20 rect)
        // Treat the main spawnPoint as Loop 1 if no spawnPoints array exists, or just legacy support.
        // But user wants "Add loop spawn" to be the way.
        // Let's make the first loop spawn update the main spawnPoint for compatibility if needed.
        if (this.isPointInRect(mouseX, mouseY, { ...this.level.spawnPoint, width: 20, height: 20 })) {
            this.startDragging(this.level.spawnPoint, mouseX, mouseY, 'Main Spawn');
            return;
        }
        // Check Loop Spawns
        if (this.level.spawnPoints) {
            for (let i = 0; i < this.level.spawnPoints.length; i++) {
                const sp = this.level.spawnPoints[i];
                if (this.isPointInRect(mouseX, mouseY, { ...sp, width: 20, height: 20 })) {
                    this.startDragging(sp, mouseX, mouseY, `Loop ${i + 1} Spawn`);
                    return;
                }
            }
        }
        // Check Buttons
        for (const btn of this.level.buttons) {
            if (this.isPointInRect(mouseX, mouseY, btn)) {
                this.startDragging(btn, mouseX, mouseY, 'Button');
                return;
            }
        }
        // Check Doors
        for (const door of this.level.doors) {
            if (this.isPointInRect(mouseX, mouseY, door)) {
                this.startDragging(door, mouseX, mouseY, 'Door');
                return;
            }
        }
        // Check Walls
        for (const wall of this.level.walls) {
            if (this.isPointInRect(mouseX, mouseY, wall)) {
                this.startDragging(wall, mouseX, mouseY, 'Wall');
                return;
            }
        }

        this.selectedComponent = null;
        this.updatePropertiesPanel();
        this.draw();
    }

    private startDragging(component: any, mouseX: number, mouseY: number, type: string) {
        this.selectedComponent = component;
        this.selectedType = type;
        this.isDraggingOnCanvas = true;
        this.dragOffset = { x: mouseX - component.x, y: mouseY - component.y };
        this.updatePropertiesPanel();
        this.draw();
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.isDraggingOnCanvas && this.selectedComponent) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let newX = mouseX - this.dragOffset.x;
            let newY = mouseY - this.dragOffset.y;

            // Snap
            newX = Math.round(newX / 10) * 10;
            newY = Math.round(newY / 10) * 10;

            this.selectedComponent.x = newX;
            this.selectedComponent.y = newY;
            this.draw();
        }
    }

    private handleMouseUp() {
        this.isDraggingOnCanvas = false;
    }

    private isPointInRect(x: number, y: number, rect: Rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height;
    }

    private updatePropertiesPanel() {
        const panel = this.container.querySelector('#properties-panel')!;
        if (!this.selectedComponent) {
            panel.innerHTML = '<h4>Selected Item</h4><p>Select an item to edit properties</p>';
            return;
        }

        let html = `<h4>Selected Item: <span style="color: #646cff">${this.selectedType}</span></h4>`;

        // Common props
        html += `
            <div class="form-group">
                <label>X</label>
                <input type="number" class="prop-input" data-prop="x" value="${this.selectedComponent.x}">
            </div>
            <div class="form-group">
                <label>Y</label>
                <input type="number" class="prop-input" data-prop="y" value="${this.selectedComponent.y}">
            </div>
        `;

        if ('width' in this.selectedComponent) {
            html += `
                <div class="form-group">
                    <label>Width</label>
                    <input type="number" class="prop-input" data-prop="width" value="${this.selectedComponent.width}">
                </div>
                <div class="form-group">
                    <label>Height</label>
                    <input type="number" class="prop-input" data-prop="height" value="${this.selectedComponent.height}">
                </div>
            `;
        }

        if ('color' in this.selectedComponent) {
            html += `
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" class="prop-input" data-prop="color" value="${this.selectedComponent.color}">
                </div>
            `;
        }

        // Rotation for Walls and Doors
        if (this.selectedType === 'Wall' || this.selectedType === 'Door') {
            html += `<button class="btn btn-primary" id="rotate-btn" style="width: 100%; margin-bottom: 1rem;">Rotate 90°</button>`;
        }

        // Specifics
        if ('targetDoorId' in this.selectedComponent) {
            html += `
                <div class="form-group">
                    <label>Target Door ID: ${this.selectedComponent.targetDoorId}</label>
                    <!-- Read-only for now as they are auto-linked -->
                </div>
            `;
        }

        // Delete button
        html += `<button class="btn btn-danger" id="delete-comp-btn">Delete Component</button>`;

        panel.innerHTML = html;

        // Bind events
        panel.querySelectorAll('.prop-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const prop = (e.target as HTMLElement).dataset.prop!;
                const val = (e.target as HTMLInputElement).value;
                if (prop === 'color') {
                    this.selectedComponent[prop] = val;
                    // Sync color between Button and Door
                    if (this.selectedType === 'Button') {
                        const door = this.level.doors.find(d => d.id === this.selectedComponent.targetDoorId);
                        if (door) door.color = val;
                    } else if (this.selectedType === 'Door') {
                        const btn = this.level.buttons.find(b => b.targetDoorId === this.selectedComponent.id);
                        if (btn) btn.color = val;
                    }
                } else {
                    this.selectedComponent[prop] = parseInt(val);
                }
                this.draw();
            });
        });

        panel.querySelector('#rotate-btn')?.addEventListener('click', () => {
            const temp = this.selectedComponent.width;
            this.selectedComponent.width = this.selectedComponent.height;
            this.selectedComponent.height = temp;
            this.updatePropertiesPanel(); // Refresh width/height inputs
            this.draw();
        });

        panel.querySelector('#delete-comp-btn')?.addEventListener('click', () => {
            this.deleteSelectedComponent();
        });
    }

    private deleteSelectedComponent() {
        if (!this.selectedComponent) return;

        // Remove from arrays
        this.level.walls = this.level.walls.filter(w => w !== this.selectedComponent);

        // If deleting a button, delete its door too
        if (this.selectedType === 'Button') {
            this.level.buttons = this.level.buttons.filter(b => b !== this.selectedComponent);
            this.level.doors = this.level.doors.filter(d => d.id !== this.selectedComponent.targetDoorId);
        } else if (this.selectedType === 'Door') {
            // If deleting a door, delete its button too? Or just the door? 
            // User said "Do not give option to give door separately", implying strict pairing.
            // Let's delete the pair to be safe and clean.
            this.level.doors = this.level.doors.filter(d => d !== this.selectedComponent);
            this.level.buttons = this.level.buttons.filter(b => b.targetDoorId !== this.selectedComponent.id);
        } else {
            // Fallback for safety if type check fails or other types
            this.level.buttons = this.level.buttons.filter(b => b !== this.selectedComponent);
            this.level.doors = this.level.doors.filter(d => d !== this.selectedComponent);
        }

        if (this.level.spawnPoints) {
            this.level.spawnPoints = this.level.spawnPoints.filter(s => s !== this.selectedComponent);
        }

        // Cannot delete goal or spawn, just reset maybe?
        // For now, assume they persist but can be moved.

        this.selectedComponent = null;
        this.updatePropertiesPanel();
        this.draw();
    }

    private draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Walls
        this.ctx.fillStyle = '#888';
        this.level.walls.forEach(w => {
            this.ctx.fillRect(w.x, w.y, w.width, w.height);
            if (w === this.selectedComponent) this.drawSelection(w);
        });

        // Draw Doors
        this.level.doors.forEach(d => {
            this.ctx.fillStyle = d.color;
            this.ctx.fillRect(d.x, d.y, d.width, d.height);
            if (d === this.selectedComponent) this.drawSelection(d);
        });

        // Draw Buttons
        this.level.buttons.forEach(b => {
            this.ctx.fillStyle = b.color;
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
            if (b === this.selectedComponent) this.drawSelection(b);
        });

        // Draw Goal
        this.ctx.fillStyle = '#ff0';
        const g = this.level.goal;
        this.ctx.fillRect(g.x, g.y, g.width, g.height);
        if (g === this.selectedComponent) this.drawSelection(g);

        // Draw Spawn
        this.ctx.fillStyle = '#0f0';
        const s = this.level.spawnPoint;
        this.ctx.fillRect(s.x, s.y, 20, 20);
        if (s === this.selectedComponent) this.drawSelection({ ...s, width: 20, height: 20 });

        // Draw Loop Spawns
        if (this.level.spawnPoints) {
            this.ctx.fillStyle = '#0ff';
            this.level.spawnPoints.forEach((sp, index) => {
                this.ctx.fillRect(sp.x, sp.y, 20, 20);
                this.ctx.fillStyle = '#000';
                this.ctx.fillText((index + 1).toString(), sp.x + 6, sp.y + 14);
                this.ctx.fillStyle = '#0ff'; // Reset for next
                if (sp === this.selectedComponent) this.drawSelection({ ...sp, width: 20, height: 20 });
            });
        }
        // Draw connection line if Button or Door is selected
        if (this.selectedComponent && (this.selectedType === 'Button' || this.selectedType === 'Door')) {
            let btn: any, door: any;
            if (this.selectedType === 'Button') {
                btn = this.selectedComponent;
                door = this.level.doors.find(d => d.id === btn.targetDoorId);
            } else {
                door = this.selectedComponent;
                btn = this.level.buttons.find(b => b.targetDoorId === door.id);
            }

            if (btn && door) {
                this.ctx.beginPath();
                this.ctx.moveTo(btn.x + btn.width / 2, btn.y + btn.height / 2);
                this.ctx.lineTo(door.x + door.width / 2, door.y + door.height / 2);
                this.ctx.strokeStyle = btn.color;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }

    private drawSelection(rect: Rect) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4);
    }
}
