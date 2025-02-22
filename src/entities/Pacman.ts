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

        // Obtenir la position actuelle en termes de tuiles
        const currentTileX = Math.floor(this.x / this.TILE_SIZE);
        const currentTileY = Math.floor(this.y / this.TILE_SIZE);

        // Vérifier les chemins valides (où il y a/avait des pac-gommes) dans chaque direction
        const hasPathUp = this.maze.isPath(currentTileX, currentTileY - 1);
        const hasPathDown = this.maze.isPath(currentTileX, currentTileY + 1);
        const hasPathLeft = this.maze.isPath(currentTileX - 1, currentTileY);
        const hasPathRight = this.maze.isPath(currentTileX + 1, currentTileY);

        // Déterminer l'axe actuel basé sur les chemins valides
        const isOnVerticalPath = hasPathUp || hasPathDown;
        const isOnHorizontalPath = hasPathLeft || hasPathRight;

        // Mise à jour de la direction basée sur l'input
        const inputDirection = this.inputManager.getNextDirection();
        
        if (inputDirection !== Direction.NONE && inputDirection !== this.direction) {
            const isVerticalMove = inputDirection === Direction.UP || inputDirection === Direction.DOWN;
            const isHorizontalMove = inputDirection === Direction.LEFT || inputDirection === Direction.RIGHT;

            // N'autoriser que les mouvements sur les chemins valides
            if (isVerticalMove && isOnVerticalPath) {
                if ((inputDirection === Direction.UP && hasPathUp) ||
                    (inputDirection === Direction.DOWN && hasPathDown)) {
                    this.direction = inputDirection;
                }
            } else if (isHorizontalMove && isOnHorizontalPath) {
                if ((inputDirection === Direction.LEFT && hasPathLeft) ||
                    (inputDirection === Direction.RIGHT && hasPathRight)) {
                    this.direction = inputDirection;
                }
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

        // Ajout d'un alignement progressif sur la grille
        const currentTileX = Math.floor(this.x / this.TILE_SIZE) * this.TILE_SIZE;
        const currentTileY = Math.floor(this.y / this.TILE_SIZE) * this.TILE_SIZE;

        if (dir === Direction.LEFT || dir === Direction.RIGHT) {
            // Alignement vertical progressif
            if (Math.abs(this.y - currentTileY) < this.speed) {
                nextY = currentTileY;
            } else if (this.y > currentTileY) {
                nextY -= Math.min(this.speed * 0.5, this.y - currentTileY);
            } else if (this.y < currentTileY) {
                nextY += Math.min(this.speed * 0.5, currentTileY - this.y);
            }
        } else if (dir === Direction.UP || dir === Direction.DOWN) {
            // Alignement horizontal progressif
            if (Math.abs(this.x - currentTileX) < this.speed) {
                nextX = currentTileX;
            } else if (this.x > currentTileX) {
                nextX -= Math.min(this.speed * 0.5, this.x - currentTileX);
            } else if (this.x < currentTileX) {
                nextX += Math.min(this.speed * 0.5, currentTileX - this.x);
            }
        }

        return { x: nextX, y: nextY };
    }

    private canMoveToPosition(x: number, y: number): boolean {
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        const tileX = Math.floor(centerX / this.TILE_SIZE);
        const tileY = Math.floor(centerY / this.TILE_SIZE);

        // Vérifier si la position centrale est un chemin valide
        if (!this.maze.isPath(tileX, tileY)) {
            return false;
        }

        // Vérifier les points supplémentaires pour une meilleure détection des chemins
        const offset = 4; // Réduire l'offset pour une meilleure maniabilité
        const points = [
            { x: x + offset, y: y + offset },                    // Coin supérieur gauche
            { x: x + this.width - offset, y: y + offset },       // Coin supérieur droit
            { x: x + offset, y: y + this.height - offset },      // Coin inférieur gauche
            { x: x + this.width - offset, y: y + this.height - offset }  // Coin inférieur droit
        ];

        // Si au moins un des points est sur un chemin valide, autoriser le mouvement
        return points.some(point => {
            const pointTileX = Math.floor(point.x / this.TILE_SIZE);
            const pointTileY = Math.floor(point.y / this.TILE_SIZE);
            return this.maze.isPath(pointTileX, pointTileY);
        });
    }

    private handleTunnel(): void {
        // Gestion du passage par le tunnel
        if (this.x < -this.width) {
            this.x = this.maze.getTileSize() * 27;
        } else if (this.x > this.maze.getTileSize() * 27) {
            this.x = -this.width;
        }
    }
} 