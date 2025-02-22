import { Direction } from '../entities/Entity';
import { SoundManager, SoundEffect } from '../managers/SoundManager';

export enum CutsceneType {
    BLINKY_CHASE = 1,    // Blinky poursuit Pac-Man et déchire sa cape
    NAIL_GHOST = 2,      // Pac-Man cloue un fantôme avec un clou géant
    GIANT_PACMAN = 3,    // Pac-Man géant poursuit Blinky
    COOKIE_BREAK = 4,    // Pac-Man et Blinky partagent un cookie
    GHOST_TRAP = 5       // Pac-Man piège les fantômes dans un filet
}

interface TextEffect {
    text: string;
    x: number;
    y: number;
    alpha: number;
    scale: number;
}

export class Cutscene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private type: CutsceneType;
    private timer: number = 0;
    private readonly DURATION: number = 5000; // 5 secondes par cutscene
    private readonly TILE_SIZE: number = 16;
    private readonly ANIMATION_SPEED: number = 0.15;
    private soundManager: SoundManager;
    private fadeAlpha: number = 1;
    private textEffects: TextEffect[] = [];
    private particles: Array<{x: number; y: number; vx: number; vy: number; life: number; color: string}> = [];

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
    private shakeIntensity: number = 0;
    private flashIntensity: number = 0;

    constructor(canvas: HTMLCanvasElement, type: CutsceneType) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.type = type;
        this.soundManager = SoundManager.getInstance();
        this.initializeCutscene();
    }

    private initializeCutscene(): void {
        this.fadeAlpha = 1;
        this.particles = [];
        this.textEffects = [];
        
        // Ajouter le texte narratif selon le type de cutscene
        const texts = {
            [CutsceneType.BLINKY_CHASE]: "La poursuite !",
            [CutsceneType.NAIL_GHOST]: "Le clou du spectacle",
            [CutsceneType.GIANT_PACMAN]: "La revanche",
            [CutsceneType.COOKIE_BREAK]: "Une pause sucrée",
            [CutsceneType.GHOST_TRAP]: "Le piège parfait"
        };

        this.addTextEffect(texts[this.type], this.canvas.width / 2, 50);
        this.soundManager.playSound(SoundEffect.CUTSCENE);

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

        // Mise à jour des effets de texte
        this.textEffects = this.textEffects.filter(effect => {
            effect.alpha = Math.max(0, effect.alpha - 0.001 * deltaTime);
            effect.scale += 0.0005 * deltaTime;
            return effect.alpha > 0;
        });

        // Mise à jour des particules
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });

        // Effet de flash
        if (this.flashIntensity > 0) {
            this.flashIntensity = Math.max(0, this.flashIntensity - 0.1 * deltaTime);
        }

        // Effet de tremblement
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.1 * deltaTime);
        }

        // Effet de fondu
        if (this.timer < 500) {
            this.fadeAlpha = Math.max(0, 1 - this.timer / 500);
        } else if (this.timer > this.DURATION - 500) {
            this.fadeAlpha = Math.min(1, (this.timer - (this.DURATION - 500)) / 500);
        }
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
            
            // Particules de miettes
            if (Math.random() > 0.8) {
                const cookieX = (this.pacmanX + this.blinkyX) / 2;
                const cookieY = this.pacmanY;
                this.addParticles(cookieX, cookieY, 2, '#8B4513');
            }
            
            // Animation de satisfaction
            this.pacmanY = 200 + Math.sin(this.timer * 0.01) * 5;
            this.blinkyY = 200 + Math.sin(this.timer * 0.01 + Math.PI) * 5;
        } else {
            // Les personnages repartent satisfaits
            this.pacmanX -= deltaTime * 0.05;
            this.blinkyX += deltaTime * 0.05;
            
            // Petits cœurs occasionnels
            if (Math.random() > 0.95) {
                this.addTextEffect('♥', 
                    (this.pacmanX + this.blinkyX) / 2,
                    this.pacmanY - 30);
            }
        }
    }

    private updateGhostTrap(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        
        if (progress < 0.3) {
            // Le filet descend
            this.netY = Math.min(100, this.netY + deltaTime * 0.2);
            
            // Effet d'anticipation
            if (this.netY >= 95) {
                this.shakeIntensity = 3;
            }
        } else if (progress < 0.6) {
            // Les fantômes sont piégés un par un
            const ghostIndex = Math.floor((progress - 0.3) * 10) % 4;
            if (!this.ghostsTrapped[ghostIndex]) {
                this.ghostsTrapped[ghostIndex] = true;
                this.flashIntensity = 0.3;
                this.shakeIntensity = 5;
                this.soundManager.playSound(SoundEffect.GHOST_EAT);
                
                // Particules lors de la capture
                const ghostX = 150 + ghostIndex * 80;
                this.addParticles(ghostX, this.netY + 25, 15, '#FFFFFF');
            }
        } else {
            // Pac-Man célèbre
            this.pacmanY = this.canvas.height - 100 + Math.sin(this.timer * 0.01) * 20;
            
            // Particules de célébration
            if (Math.random() > 0.9) {
                this.addParticles(
                    this.pacmanX + Math.random() * 40 - 20,
                    this.pacmanY - 20,
                    3,
                    '#FFFF00'
                );
            }
        }
    }

    public render(): void {
        this.ctx.save();
        
        // Appliquer le tremblement d'écran
        this.applyScreenShake();

        // Fond noir
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rendu de la scène principale
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

        // Rendu des particules
        this.particles.forEach(particle => {
            const alpha = particle.life / 2000;
            this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Rendu des effets de texte
        this.textEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(effect.scale, effect.scale);
            this.ctx.fillStyle = `rgba(255, 255, 0, ${effect.alpha})`;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, 0, 0);
            this.ctx.restore();
        });

        // Effet de flash
        if (this.flashIntensity > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashIntensity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Effet de fondu
        if (this.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Afficher le temps restant
        this.renderTimer();

        this.ctx.restore();
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
        const progress = this.timer / this.DURATION;
        
        // Pac-Man se déplace vers la droite
        this.pacmanX += deltaTime * 0.2;
        
        // Blinky suit avec sa cape qui se déchire progressivement
        this.blinkyX = Math.max(0, this.blinkyX - deltaTime * 0.15);
        
        // Effets de particules pour la cape déchirée
        if (progress > 0.3 && Math.random() > 0.9) {
            this.addParticles(this.blinkyX + 20, this.blinkyY, 3, '#FFB8FF');
        }

        // Effet de tremblement quand ils sont proches
        if (Math.abs(this.pacmanX - this.blinkyX) < 100) {
            this.shakeIntensity = 5;
        }
    }

    private updateNailGhost(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        
        if (progress < 0.5) {
            // Pac-Man approche du fantôme
            this.pacmanX = this.canvas.width * 0.3 + progress * 100;
            // Effet d'anticipation
            if (progress > 0.45) {
                this.shakeIntensity = 3;
            }
        } else {
            // Le clou tombe
            this.pacmanY = 200 + Math.pow(progress - 0.5, 2) * 1000;
            if (progress < 0.55) {
                // Flash et particules à l'impact
                this.flashIntensity = 0.5;
                this.shakeIntensity = 10;
                this.addParticles(this.pacmanX, this.pacmanY, 20, '#FFFFFF');
                this.soundManager.playSound(SoundEffect.GHOST_EAT);
            }
        }
    }

    private updateGiantPacman(deltaTime: number): void {
        const progress = this.timer / this.DURATION;
        
        // Pac-Man géant poursuit Blinky qui fuit
        this.pacmanX += deltaTime * 0.15;
        this.blinkyX -= deltaTime * 0.3;
        
        // Effet de tremblement pour les pas de Pac-Man géant
        if (Math.sin(this.timer * 0.005) > 0.9) {
            this.shakeIntensity = 8;
            this.addParticles(this.pacmanX, this.pacmanY + 30, 5, '#FFFF00');
        }
        
        // Blinky laisse des particules de peur
        if (Math.random() > 0.9) {
            this.addParticles(this.blinkyX + 10, this.blinkyY - 10, 2, '#FF0000');
        }
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

    private addTextEffect(text: string, x: number, y: number): void {
        this.textEffects.push({
            text: text,
            x: x,
            y: y,
            alpha: 1,
            scale: 1
        });
    }

    private addParticles(x: number, y: number, count: number, color: string): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1000 + Math.random() * 1000,
                color: color
            });
        }
    }

    private applyScreenShake(): void {
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }
    }
} 