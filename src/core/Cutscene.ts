import { Direction } from '../entities/Entity';

export enum CutsceneType {
    BLINKY_CHASE = 1,    // Blinky poursuit Pac-Man et déchire sa cape
    NAIL_GHOST = 2,      // Pac-Man cloue un fantôme avec un clou géant
    GIANT_PACMAN = 3     // Pac-Man géant poursuit Blinky
}

export class Cutscene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private type: CutsceneType;
    private timer: number = 0;
    private readonly DURATION: number = 5000; // 5 secondes par cutscene
    private readonly TILE_SIZE: number = 16;

    // Positions des acteurs
    private pacmanX: number = 0;
    private pacmanY: number = 200;
    private blinkyX: number = 448;
    private blinkyY: number = 200;
    private mouthOpen: number = 0;
    private mouthSpeed: number = 0.15;

    constructor(canvas: HTMLCanvasElement, type: CutsceneType) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.type = type;
    }

    public update(deltaTime: number): boolean {
        this.timer += deltaTime;

        // Animation de la bouche de Pac-Man
        this.mouthOpen += this.mouthSpeed * deltaTime;
        if (this.mouthOpen >= 1 || this.mouthOpen <= 0) {
            this.mouthSpeed = -this.mouthSpeed;
        }

        switch (this.type) {
            case CutsceneType.BLINKY_CHASE:
                this.updateBlinkyChase(deltaTime);
                break;
            case CutsceneType.NAIL_GHOST:
                this.updateNailGhost(deltaTime);
                break;
            case CutsceneType.GIANT_PACMAN:
                this.updateGiantPacman(deltaTime);
                break;
        }

        return this.timer >= this.DURATION;
    }

    public render(): void {
        // Fond noir
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.type) {
            case CutsceneType.BLINKY_CHASE:
                this.renderBlinkyChase();
                break;
            case CutsceneType.NAIL_GHOST:
                this.renderNailGhost();
                break;
            case CutsceneType.GIANT_PACMAN:
                this.renderGiantPacman();
                break;
        }
    }

    private updateBlinkyChase(deltaTime: number): void {
        // Pac-Man se déplace vers la droite
        this.pacmanX += 2;
        // Blinky suit avec sa cape qui se déchire progressivement
        this.blinkyX = Math.max(0, this.blinkyX - 2);
    }

    private updateNailGhost(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        if (progress < 0.5) {
            // Pac-Man approche du fantôme
            this.pacmanX = this.canvas.width * 0.3 + progress * 100;
        } else {
            // Le clou tombe
            this.pacmanY = 200 + Math.pow(progress - 0.5, 2) * 1000;
        }
    }

    private updateGiantPacman(deltaTime: number): void {
        // Pac-Man géant poursuit Blinky qui fuit
        this.pacmanX += 1.5;
        this.blinkyX -= 3;
    }

    private renderBlinkyChase(): void {
        // Dessiner Pac-Man
        this.ctx.save();
        this.ctx.translate(this.pacmanX, this.pacmanY);
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.TILE_SIZE, 
            this.mouthOpen * 0.2 * Math.PI, 
            (2 - this.mouthOpen * 0.2) * Math.PI);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        this.ctx.restore();

        // Dessiner Blinky avec sa cape déchirée
        this.renderGhost(this.blinkyX, this.blinkyY, '#FF0000');
        this.renderTornCape(this.blinkyX, this.blinkyY);
    }

    private renderNailGhost(): void {
        // Dessiner le fantôme
        this.renderGhost(this.canvas.width * 0.7, 200, '#FFB8FF');
        
        // Dessiner Pac-Man
        this.ctx.save();
        this.ctx.translate(this.pacmanX, this.pacmanY);
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.TILE_SIZE * 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Dessiner le clou géant
        if (this.timer / this.DURATION > 0.5) {
            this.ctx.fillStyle = '#808080';
            this.ctx.fillRect(
                this.canvas.width * 0.7 - 5,
                0,
                10,
                this.pacmanY
            );
        }
    }

    private renderGiantPacman(): void {
        // Dessiner Blinky qui fuit
        this.renderGhost(this.blinkyX, this.blinkyY, '#FF0000');

        // Dessiner Pac-Man géant
        this.ctx.save();
        this.ctx.translate(this.pacmanX, this.pacmanY);
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.TILE_SIZE * 3,
            this.mouthOpen * 0.2 * Math.PI,
            (2 - this.mouthOpen * 0.2) * Math.PI);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        this.ctx.restore();
    }

    private renderGhost(x: number, y: number, color: string): void {
        this.ctx.save();
        this.ctx.fillStyle = color;
        
        // Corps du fantôme
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.TILE_SIZE,
            y + this.TILE_SIZE,
            this.TILE_SIZE,
            Math.PI,
            0,
            false
        );
        
        // Partie inférieure ondulée
        this.ctx.lineTo(x + this.TILE_SIZE * 2, y + this.TILE_SIZE * 2);
        for (let i = 0; i < 3; i++) {
            const curve = this.TILE_SIZE * 0.7;
            this.ctx.quadraticCurveTo(
                x + this.TILE_SIZE * 2 - curve * (2 - i),
                y + this.TILE_SIZE * 2 + (i % 2 === 0 ? 4 : -4),
                x + this.TILE_SIZE * 2 - curve * (3 - i),
                y + this.TILE_SIZE * 2
            );
        }
        
        this.ctx.fill();
        
        // Yeux
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + this.TILE_SIZE * 0.7, y + this.TILE_SIZE * 0.7, 4, 0, Math.PI * 2);
        this.ctx.arc(x + this.TILE_SIZE * 1.3, y + this.TILE_SIZE * 0.7, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    private renderTornCape(x: number, y: number): void {
        const progress = this.timer / this.DURATION;
        const tears = Math.floor(progress * 10);
        
        this.ctx.save();
        this.ctx.fillStyle = '#FFB8FF';
        
        // Dessiner la cape déchirée
        this.ctx.beginPath();
        this.ctx.moveTo(x + this.TILE_SIZE * 2, y + this.TILE_SIZE);
        
        for (let i = 0; i < tears; i++) {
            const xPos = x + this.TILE_SIZE * 2 + i * 10;
            const yOffset = Math.sin(i + progress * 5) * 10;
            this.ctx.lineTo(xPos, y + this.TILE_SIZE + yOffset);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
} 