import { Maze } from '../entities/Maze';
import { Pacman } from '../entities/Pacman';
import { InputManager } from '../managers/InputManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly FIXED_TIMESTEP: number = 1000 / 60; // 60 FPS

    private maze!: Maze;
    private pacman!: Pacman;
    private inputManager!: InputManager;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 448;  // Taille standard du labyrinthe Pacman
        this.canvas.height = 496;
        this.ctx = this.canvas.getContext('2d')!;
        document.body.appendChild(this.canvas);

        // Centrer le canvas dans la page
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        document.body.style.backgroundColor = 'black';
    }

    public init(): void {
        this.inputManager = InputManager.getInstance();
        this.maze = new Maze();
        this.pacman = new Pacman(
            14 * this.maze.getTileSize(), // Position de départ X
            23 * this.maze.getTileSize(), // Position de départ Y
            this.maze
        );
        
        this.gameLoop(0);
    }

    private update(deltaTime: number): void {
        this.pacman.update(deltaTime);
    }

    private render(): void {
        // Effacement du canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rendu du labyrinthe
        this.maze.render(this.ctx);
        
        // Rendu de Pac-Man
        this.pacman.render(this.ctx);

        // Affichage du score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.pacman.getScore()}`, 10, 30);
    }

    private gameLoop(currentTime: number): void {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.FIXED_TIMESTEP) {
            this.update(this.FIXED_TIMESTEP);
            this.accumulator -= this.FIXED_TIMESTEP;
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
} 