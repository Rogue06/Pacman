import { Entity } from './Entity';
import { Maze } from './Maze';

export enum FruitType {
    CHERRY = 0,      // Niveau 1 : 100 points
    STRAWBERRY = 1,  // Niveau 2 : 300 points
    ORANGE = 2,      // Niveaux 3-4 : 500 points
    APPLE = 3,       // Niveaux 5-6 : 700 points
    MELON = 4,       // Niveaux 7-8 : 1000 points
    GALAXIAN = 5,    // Niveaux 9-10 : 2000 points
    BELL = 6,        // Niveaux 11-12 : 3000 points
    KEY = 7          // Niveaux 13+ : 5000 points
}

export class Fruit extends Entity {
    private type: FruitType;
    private isVisible: boolean = false;
    private readonly DISPLAY_DURATION: number = 10000; // 10 secondes d'affichage
    private timer: number = 0;
    private readonly POINTS: { [key in FruitType]: number } = {
        [FruitType.CHERRY]: 100,
        [FruitType.STRAWBERRY]: 300,
        [FruitType.ORANGE]: 500,
        [FruitType.APPLE]: 700,
        [FruitType.MELON]: 1000,
        [FruitType.GALAXIAN]: 2000,
        [FruitType.BELL]: 3000,
        [FruitType.KEY]: 5000
    };

    constructor(maze: Maze, level: number) {
        const tileSize = maze.getTileSize();
        // Position au centre du labyrinthe
        super(14 * tileSize, 17.5 * tileSize, tileSize, tileSize, 0);
        this.type = this.getFruitTypeForLevel(level);
    }

    private getFruitTypeForLevel(level: number): FruitType {
        if (level === 1) return FruitType.CHERRY;
        if (level === 2) return FruitType.STRAWBERRY;
        if (level <= 4) return FruitType.ORANGE;
        if (level <= 6) return FruitType.APPLE;
        if (level <= 8) return FruitType.MELON;
        if (level <= 10) return FruitType.GALAXIAN;
        if (level <= 12) return FruitType.BELL;
        return FruitType.KEY;
    }

    public show(): void {
        this.isVisible = true;
        this.timer = this.DISPLAY_DURATION;
    }

    public hide(): void {
        this.isVisible = false;
    }

    public update(deltaTime: number): void {
        if (this.isVisible) {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.hide();
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if (!this.isVisible) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Dessiner le fruit selon son type
        switch (this.type) {
            case FruitType.CHERRY:
                this.renderCherry(ctx);
                break;
            case FruitType.STRAWBERRY:
                this.renderStrawberry(ctx);
                break;
            // ... autres fruits ...
            default:
                // Fallback simple pour les autres fruits
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }

    private renderCherry(ctx: CanvasRenderingContext2D): void {
        // Dessiner les cerises
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.width * 0.3, this.height * 0.6, this.width * 0.3, 0, Math.PI * 2);
        ctx.arc(this.width * 0.7, this.height * 0.7, this.width * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Tiges
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, this.height * 0.3);
        ctx.quadraticCurveTo(
            this.width * 0.5, this.height * 0.1,
            this.width * 0.7, this.height * 0.4
        );
        ctx.stroke();
    }

    private renderStrawberry(ctx: CanvasRenderingContext2D): void {
        // Corps de la fraise
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.quadraticCurveTo(
            this.width, this.height / 2,
            this.width / 2, this.height
        );
        ctx.quadraticCurveTo(
            0, this.height / 2,
            this.width / 2, 0
        );
        ctx.fill();

        // Points blancs
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 8; i++) {
            const x = this.width * (0.3 + Math.random() * 0.4);
            const y = this.height * (0.3 + Math.random() * 0.4);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Feuille
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width * 0.3, -this.height * 0.2);
        ctx.lineTo(this.width / 2, -this.height * 0.1);
        ctx.lineTo(this.width * 0.7, -this.height * 0.2);
        ctx.lineTo(this.width / 2, 0);
        ctx.fill();
    }

    public isActive(): boolean {
        return this.isVisible;
    }

    public getPoints(): number {
        return this.POINTS[this.type];
    }

    public getBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
} 