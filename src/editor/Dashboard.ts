import { levelService } from '../services/LevelService';
import { LevelData } from '../game/LevelData';

export class Dashboard {
    private container: HTMLElement;
    private onEditLevel: (level: LevelData) => void;

    constructor(container: HTMLElement, onEditLevel: (level: LevelData) => void) {
        this.container = container;
        this.onEditLevel = onEditLevel;
    }

    render() {
        this.container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'dashboard-header';
        header.innerHTML = `
            <h2>Level Dashboard</h2>
            <button id="add-level-btn" class="btn btn-primary">Add New Level</button>
        `;
        this.container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'level-grid';
        this.container.appendChild(grid);

        const levels = levelService.getLevels();
        levels.forEach(level => {
            const card = this.createLevelCard(level);
            grid.appendChild(card);
        });

        document.getElementById('add-level-btn')?.addEventListener('click', () => {
            const newLevel = levelService.createEmptyLevel();
            levelService.saveLevel(newLevel);
            this.render(); // Refresh
        });
    }

    private createLevelCard(level: LevelData): HTMLElement {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <h3>${level.name}</h3>
            <p>ID: ${level.id}</p>
            <p>Loops: ${level.maxLoops}</p>
            <div class="level-actions">
                <button class="btn btn-primary edit-btn">Update</button>
                <button class="btn btn-danger delete-btn">Delete</button>
            </div>
        `;

        card.querySelector('.edit-btn')?.addEventListener('click', () => {
            this.onEditLevel(level);
        });

        card.querySelector('.delete-btn')?.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${level.name}"?`)) {
                levelService.deleteLevel(level.id);
                this.render();
            }
        });

        return card;
    }
}
