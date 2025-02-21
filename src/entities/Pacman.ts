import { Entity, Direction } from './Entity';
import { InputManager } from '../managers/InputManager';
import { Maze } from './Maze';

export class Pacman extends Entity {
    private maze: Maze;
    private inputManager: InputManager;
    private angle: number = 0;
    private mouthOpen: number = 0;
    private mouthSpeed: number = 0.15;
    private score: number = 0;

    constructor(x: number, y: number, maze: Maze) {
        super(x, y, 16, 16, 2); // Taille 16x16 pixels, vitesse 2
        this.maze = maze;
        this.inputManager = InputManager.getInstance();
    }

    public update(deltaTime: number): void {
        // Animation de la bouche
        this.mouthOpen += this.mouthSpeed * deltaTime;
        if (this.mouthOpen >= 1 || this.mouthOpen <= 0) {
            this.mouthSpeed = -this.mouthSpeed;
        }

        // Mise à jour de la direction basée sur l'input
        const nextDirection = this.inputManager.getNextDirection();
        if (nextDirection !== Direction.NONE) {
            // Vérifier si la nouvelle direction est possible
            const nextPos = this.getNextPosition(nextDirection);
            if (!this.maze.isWall(nextPos.x, nextPos.y)) {
                this.direction = nextDirection;
                this.inputManager.clearNextDirection();
            }
        }

        // Déplacement
        const nextPos = this.getNextPosition(this.direction);
        if (!this.maze.isWall(nextPos.x, nextPos.y)) {
            this.x = nextPos.x;
            this.y = nextPos.y;
        }

        // Vérification des collisions avec les pac-gommes
        if (this.maze.consumeDot(this.x, this.y)) {
            this.score += 10;
        }
        if (this.maze.consumePowerPellet(this.x, this.y)) {
            this.score += 50;
            // TODO: Activer le mode vulnérable des fantômes
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
} 