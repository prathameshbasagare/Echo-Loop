import './Editor.css';
import { Dashboard } from './Dashboard';
import { LevelBuilder } from './LevelBuilder';
import { LevelData } from '../game/LevelData';

export class Editor {
    private container: HTMLElement;
    private dashboard: Dashboard;
    private builder: LevelBuilder | null = null;

    constructor() {
        this.container = document.getElementById('editor-container')!;
        if (!this.container) {
            throw new Error('Editor container not found');
        }

        this.dashboard = new Dashboard(this.container, (level) => this.openLevel(level));
    }

    show() {
        this.container.classList.add('active');
        this.dashboard.render();
    }

    hide() {
        this.container.classList.remove('active');
    }

    private openLevel(level: LevelData) {
        this.builder = new LevelBuilder(this.container, level, () => {
            this.builder = null;
            this.dashboard.render();
        });
        this.builder.render();
    }
}
