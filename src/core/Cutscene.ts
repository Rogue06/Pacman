import { Direction } from '../entities/Entity';

export enum CutsceneType {
    BLINKY_CHASE = 1,    // Blinky poursuit Pac-Man et déchire sa cape
    NAIL_GHOST = 2,      // Pac-Man cloue un fantôme avec un clou géant
    GIANT_PACMAN = 3,    // Pac-Man géant poursuit Blinky
    COOKIE_BREAK = 4,    // Pac-Man et Blinky partagent un cookie
    GHOST_TRAP = 5       // Pac-Man piège les fantômes dans un filet
}

export class Cutscene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private type: CutsceneType;
    private timer: number = 0;
    private readonly DURATION: number = 5000; // 5 secondes par cutscene
    private readonly TILE_SIZE: number = 16;
    private readonly ANIMATION_SPEED: number = 0.15;

    // Positions et états des acteurs
    private pacmanX: number = 0;
    private pacmanY: number = 200;
    private blinkyX: number = 448;
    private blinkyY: number = 200;
    private mouthOpen: number = 0;
    private mouthSpeed: number = 0.15;
    private ghostScale: number = 1;
    private cookieRotation: number = 0;
    private netY: number = -50;
    private ghostsTrapped: boolean[] = [false, false, false, false];

    constructor(canvas: HTMLCanvasElement, type: CutsceneType) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.type = type;
        this.initializeCutscene();
    }

    private initializeCutscene(): void {
        switch (this.type) {
            case CutsceneType.COOKIE_BREAK:
                this.pacmanX = this.canvas.width / 3;
                this.blinkyX = 2 * this.canvas.width / 3;
                break;
            case CutsceneType.GHOST_TRAP:
                this.pacmanX = this.canvas.width / 2;
                this.pacmanY = this.canvas.height - 100;
                break;
            default:
                this.resetDefaultPositions();
        }
    }

    private resetDefaultPositions(): void {
        this.pacmanX = 0;
        this.pacmanY = 200;
        this.blinkyX = 448;
        this.blinkyY = 200;
    }

    public update(deltaTime: number): boolean {
        this.timer += deltaTime;
        this.updateAnimation(deltaTime);

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
            case CutsceneType.COOKIE_BREAK:
                this.updateCookieBreak(deltaTime);
                break;
            case CutsceneType.GHOST_TRAP:
                this.updateGhostTrap(deltaTime);
                break;
        }

        return this.timer >= this.DURATION;
    }

    private updateAnimation(deltaTime: number): void {
        // Animation de la bouche de Pac-Man
        this.mouthOpen += this.mouthSpeed * deltaTime;
        if (this.mouthOpen >= 1 || this.mouthOpen <= 0) {
            this.mouthSpeed = -this.mouthSpeed;
        }

        // Animation du cookie
        this.cookieRotation += 0.01 * deltaTime;
    }

    private updateCookieBreak(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        
        if (progress < 0.3) {
            // Les personnages s'approchent
            this.pacmanX += deltaTime * 0.05;
            this.blinkyX -= deltaTime * 0.05;
        } else if (progress < 0.7) {
            // Animation du partage du cookie
            this.cookieRotation += deltaTime * 0.002;
        } else {
            // Les personnages repartent satisfaits
            this.pacmanX -= deltaTime * 0.05;
            this.blinkyX += deltaTime * 0.05;
        }
    }

    private updateGhostTrap(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        
        if (progress < 0.3) {
            // Le filet descend
            this.netY = Math.min(100, this.netY + deltaTime * 0.2);
        } else if (progress < 0.6) {
            // Les fantômes sont piégés un par un
            const ghostIndex = Math.floor((progress - 0.3) * 10) % 4;
            this.ghostsTrapped[ghostIndex] = true;
        } else {
            // Pac-Man célèbre
            this.pacmanY = this.canvas.height - 100 + Math.sin(this.timer * 0.01) * 20;
        }
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
            case CutsceneType.COOKIE_BREAK:
                this.renderCookieBreak();
                break;
            case CutsceneType.GHOST_TRAP:
                this.renderGhostTrap();
                break;
        }

        // Afficher le temps restant
        this.renderTimer();
    }

    private renderCookieBreak(): void {
        // Dessiner Pac-Man
        this.renderPacman(this.pacmanX, this.pacmanY, 1);

        // Dessiner Blinky
        this.renderGhost(this.blinkyX, this.blinkyY, '#FF0000');

        // Dessiner le cookie au milieu
        const cookieX = (this.pacmanX + this.blinkyX) / 2;
        const cookieY = this.pacmanY;
        
        this.ctx.save();
        this.ctx.translate(cookieX, cookieY);
        this.ctx.rotate(this.cookieRotation);
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Points de chocolat
        this.ctx.fillStyle = '#4A2511';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * 5;
            const y = Math.sin(angle) * 5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    private renderGhostTrap(): void {
        // Dessiner le filet
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(100, this.netY);
        this.ctx.lineTo(this.canvas.width - 100, this.netY);
        
        // Dessiner les mailles du filet
        for (let x = 100; x < this.canvas.width - 100; x += 20) {
            this.ctx.moveTo(x, this.netY);
            this.ctx.lineTo(x, this.netY + 50);
        }
        this.ctx.stroke();

        // Dessiner les fantômes (piégés ou non)
        const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB851'];
        for (let i = 0; i < 4; i++) {
            const ghostX = 150 + i * 80;
            const ghostY = this.ghostsTrapped[i] ? this.netY + 25 : 150;
            this.renderGhost(ghostX, ghostY, ghostColors[i]);
        }

        // Dessiner Pac-Man qui célèbre
        this.renderPacman(this.pacmanX, this.pacmanY, 1);
    }

    private renderTimer(): void {
        const timeLeft = Math.ceil((this.DURATION - this.timer) / 1000);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${timeLeft}`, this.canvas.width / 2, 30);
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

    private renderPacman(x: number, y: number, scale: number): void {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.TILE_SIZE, 
            this.mouthOpen * 0.2 * Math.PI, 
            (2 - this.mouthOpen * 0.2) * Math.PI);
        this.ctx.lineTo(0, 0);
        this.ctx.fill();
        this.ctx.restore();
    }
} 