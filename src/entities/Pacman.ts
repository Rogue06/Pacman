import { Entity, Direction } from './Entity';
import { InputManager } from '../managers/InputManager';
import { SoundManager, SoundEffect } from '../managers/SoundManager';
import { Maze } from './Maze';
import { Game } from '../core/Game';

export class Pacman extends Entity {
    private maze: Maze;
    private game: Game;
    private inputManager: InputManager;
    private soundManager: SoundManager;
    private angle: number = 0;
    private mouthOpen: number = 0;
    private mouthSpeed: number = 0.15;
    private score: number = 0;
    private lastDotTime: number = 0;
    private readonly DOT_SOUND_DELAY: number = 150; // Délai minimum entre deux sons de pac-gomme
    private nextDirection: Direction = Direction.NONE;
    private readonly TILE_SIZE: number = 16;
    private speedMultiplier: number = 1;
    private baseSpeed: number = 2.0;

    constructor(x: number, y: number, maze: Maze, game: Game) {
        super(x, y, 16, 16, 2.0);
        this.maze = maze;
        this.game = game;
        this.inputManager = InputManager.getInstance();
        this.soundManager = SoundManager.getInstance();
        this.speed = this.baseSpeed;
    }

    public setSpeedMultiplier(multiplier: number): void {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * multiplier;
    }

    public update(deltaTime: number): void {
        // Animation de la bouche
        this.mouthOpen += this.mouthSpeed * deltaTime;
        if (this.mouthOpen >= 1 || this.mouthOpen <= 0) {
            this.mouthSpeed = -this.mouthSpeed;
        }

        // Mise à jour de la direction basée sur l'input
        const inputDirection = this.inputManager.getNextDirection();
        
        // Si une nouvelle direction est demandée, vérifier si le changement est possible
        if (inputDirection !== Direction.NONE && inputDirection !== this.direction) {
            if (this.canChangeDirection(inputDirection)) {
                this.direction = inputDirection;
            }
        }

        // Déplacement dans la direction actuelle
        if (this.direction !== Direction.NONE) {
            const nextPos = this.getNextPosition(this.direction);
            if (this.canMoveToPosition(nextPos.x, nextPos.y)) {
                this.x = nextPos.x;
                this.y = nextPos.y;
            }
        }

        // Gestion du tunnel
        this.handleTunnel();

        // Collecte des points
        const currentTime = Date.now();
        if (this.maze.consumeDot(this.x + this.width / 2, this.y + this.height / 2)) {
            this.score += 10;
            if (currentTime - this.lastDotTime > this.DOT_SOUND_DELAY) {
                this.soundManager.playSound(SoundEffect.WAKAWAKA);
                this.lastDotTime = currentTime;
            }
        }
        if (this.maze.consumePowerPellet(this.x + this.width / 2, this.y + this.height / 2)) {
            this.score += 50;
            this.soundManager.playSound(SoundEffect.POWER_PELLET);
            this.game.activatePowerMode();
        }
    }

    private canChangeDirection(newDirection: Direction): boolean {
        const tileX = Math.floor(this.x / this.TILE_SIZE);
        const tileY = Math.floor(this.y / this.TILE_SIZE);
        
        // Vérifier si on est suffisamment aligné avec la grille
        const alignedX = tileX * this.TILE_SIZE;
        const alignedY = tileY * this.TILE_SIZE;
        const isAlignedX = Math.abs(this.x - alignedX) < 2;
        const isAlignedY = Math.abs(this.y - alignedY) < 2;

        // Pour les changements horizontaux vers verticaux
        if ((this.direction === Direction.LEFT || this.direction === Direction.RIGHT) &&
            (newDirection === Direction.UP || newDirection === Direction.DOWN)) {
            // Doit être aligné horizontalement et avoir un chemin vertical
            return isAlignedX && !this.maze.isWall(tileX * this.TILE_SIZE, (tileY + (newDirection === Direction.DOWN ? 1 : -1)) * this.TILE_SIZE);
        }
        
        // Pour les changements verticaux vers horizontaux
        if ((this.direction === Direction.UP || this.direction === Direction.DOWN) &&
            (newDirection === Direction.LEFT || newDirection === Direction.RIGHT)) {
            // Doit être aligné verticalement et avoir un chemin horizontal
            return isAlignedY && !this.maze.isWall((tileX + (newDirection === Direction.RIGHT ? 1 : -1)) * this.TILE_SIZE, tileY * this.TILE_SIZE);
        }

        // Pour les inversions de direction
        return true;
    }

    private canMoveToPosition(x: number, y: number): boolean {
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        const tileX = Math.floor(centerX / this.TILE_SIZE);
        const tileY = Math.floor(centerY / this.TILE_SIZE);

        // Vérifier le point central
        return !this.maze.isWall(tileX * this.TILE_SIZE, tileY * this.TILE_SIZE);
    }

    private handleTunnel(): void {
        // Gestion du passage par le tunnel
        if (this.x < -this.width) {
            this.x = this.maze.getTileSize() * 27;
        } else if (this.x > this.maze.getTileSize() * 27) {
            this.x = -this.width;
        }
    }

    private getNextPosition(dir: Direction): { x: number; y: number } {
        let nextX = this.x;
        let nextY = this.y;

        switch (dir) {
            case Direction.UP:
                nextY -= this.speed;
                this.angle = 1.5 * Math.PI;
                break;
            case Direction.DOWN:
                nextY += this.speed;
                this.angle = 0.5 * Math.PI;
                break;
            case Direction.LEFT:
                nextX -= this.speed;
                this.angle = Math.PI;
                break;
            case Direction.RIGHT:
                nextX += this.speed;
                this.angle = 0;
                break;
        }

        return { x: nextX, y: nextY };
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // Dessin de Pac-Man
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        ctx.arc(0, 0, this.width / 2, 
            this.mouthOpen * 0.2 * Math.PI, 
            (2 - this.mouthOpen * 0.2) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.restore();
    }

    public getScore(): number {
        return this.score;
    }

    public addScore(points: number): void {
        this.score += points;
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    private isAlignedWithGrid(): boolean {
        const alignmentTolerance = 2;
        
        const currentTileX = Math.floor(this.x / this.TILE_SIZE);
        const currentTileY = Math.floor(this.y / this.TILE_SIZE);
        const alignedX = currentTileX * this.TILE_SIZE;
        const alignedY = currentTileY * this.TILE_SIZE;
        
        return Math.abs(this.x - alignedX) < alignmentTolerance && 
               Math.abs(this.y - alignedY) < alignmentTolerance;
    }
} 