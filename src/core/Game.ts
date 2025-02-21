import { Maze } from '../entities/Maze';
import { Pacman } from '../entities/Pacman';
import { InputManager } from '../managers/InputManager';
import { Blinky } from '../entities/ghosts/Blinky';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly FIXED_TIMESTEP: number = 1000 / 60; // 60 FPS

    private maze!: Maze;
    private pacman!: Pacman;
    private blinky!: Blinky;
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
        this.blinky = new Blinky(
            14 * this.maze.getTileSize(), // Position de départ X
            11 * this.maze.getTileSize(), // Position de départ Y
            this.maze,
            this.pacman
        );
        
        this.gameLoop(0);
    }

    private update(deltaTime: number): void {
        this.pacman.update(deltaTime);
        this.blinky.update(deltaTime);

        // Vérifier la collision avec Blinky
        const pacmanBounds = this.pacman.getBounds();
        const blinkyBounds = this.blinky.getBounds();

        if (this.checkCollision(pacmanBounds, blinkyBounds)) {
            // TODO: Gérer la collision (perte de vie ou manger le fantôme)
            console.log('Collision avec Blinky !');
        }
    }

    private render(): void {
        // Effacement du canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rendu du labyrinthe
        this.maze.render(this.ctx);
        
        // Rendu de Pac-Man
        this.pacman.render(this.ctx);

        // Rendu de Blinky
        this.blinky.render(this.ctx);

        // Affichage du score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.pacman.getScore()}`, 10, 30);
    }

    private checkCollision(bounds1: any, bounds2: any): boolean {
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
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