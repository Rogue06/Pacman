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
    private baseSpeed: number = 1.5;

    constructor(x: number, y: number, maze: Maze, game: Game) {
        super(x, y, 16, 16, 1.5); // Vitesse réduite à 1.5 pour un meilleur contrôle
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
        if (inputDirection !== Direction.NONE) {
            this.nextDirection = inputDirection;
        }

        // Alignement sur la grille pour les changements de direction
        const currentTileX = Math.floor(this.x / this.TILE_SIZE);
        const currentTileY = Math.floor(this.y / this.TILE_SIZE);
        const alignedX = currentTileX * this.TILE_SIZE;
        const alignedY = currentTileY * this.TILE_SIZE;
        const isAlignedX = Math.abs(this.x - alignedX) < this.speed;
        const isAlignedY = Math.abs(this.y - alignedY) < this.speed;

        // Essayer d'appliquer la nouvelle direction si on est aligné avec la grille
        if (this.nextDirection !== Direction.NONE) {
            if (this.canMove(this.nextDirection, currentTileX, currentTileY)) {
                if ((this.nextDirection === Direction.UP || this.nextDirection === Direction.DOWN) && isAlignedX) {
                    this.x = alignedX;
                    this.direction = this.nextDirection;
                    this.nextDirection = Direction.NONE;
                    this.inputManager.clearNextDirection();
                } else if ((this.nextDirection === Direction.LEFT || this.nextDirection === Direction.RIGHT) && isAlignedY) {
                    this.y = alignedY;
                    this.direction = this.nextDirection;
                    this.nextDirection = Direction.NONE;
                    this.inputManager.clearNextDirection();
                }
            }
        }

        // Déplacement dans la direction actuelle
        if (this.direction !== Direction.NONE) {
            const nextPos = this.getNextPosition(this.direction);
            if (this.canMoveToPosition(nextPos.x, nextPos.y)) {
                this.x = nextPos.x;
                this.y = nextPos.y;
            } else {
                // Alignement avec la grille si on ne peut pas avancer
                if (this.direction === Direction.UP || this.direction === Direction.DOWN) {
                    this.x = alignedX;
                } else {
                    this.y = alignedY;
                }
                this.direction = Direction.NONE;
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

    private canMove(direction: Direction, tileX: number, tileY: number): boolean {
        switch (direction) {
            case Direction.UP:
                return !this.maze.isWall(tileX * this.TILE_SIZE, (tileY - 1) * this.TILE_SIZE);
            case Direction.DOWN:
                return !this.maze.isWall(tileX * this.TILE_SIZE, (tileY + 1) * this.TILE_SIZE);
            case Direction.LEFT:
                return !this.maze.isWall((tileX - 1) * this.TILE_SIZE, tileY * this.TILE_SIZE);
            case Direction.RIGHT:
                return !this.maze.isWall((tileX + 1) * this.TILE_SIZE, tileY * this.TILE_SIZE);
            default:
                return false;
        }
    }

    private canMoveToPosition(x: number, y: number): boolean {
        const offset = 4; // Utiliser un offset plus petit pour une meilleure maniabilité

        const points = [
            { x: x + this.width / 2, y: y + this.height / 2 }, // Centre
            { x: x + offset, y: y + offset }, // Coin supérieur gauche
            { x: x + this.width - offset, y: y + offset }, // Coin supérieur droit
            { x: x + offset, y: y + this.height - offset }, // Coin inférieur gauche
            { x: x + this.width - offset, y: y + this.height - offset } // Coin inférieur droit
        ];

        return !points.some(point => this.maze.isWall(point.x, point.y));
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
        const tileSize = this.maze.getTileSize();

        // Calculer la prochaine position
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

        // Gestion du tunnel
        if (nextX < -this.width) {
            nextX = this.maze.getTileSize() * 27;
        } else if (nextX > this.maze.getTileSize() * 27) {
            nextX = -this.width;
        }

        // Alignement sur la grille uniquement si on est proche du centre d'une tuile
        const gridX = Math.round(nextX / tileSize) * tileSize;
        const gridY = Math.round(nextY / tileSize) * tileSize;
        
        if (Math.abs(nextX - gridX) < this.speed) nextX = gridX;
        if (Math.abs(nextY - gridY) < this.speed) nextY = gridY;

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
} 