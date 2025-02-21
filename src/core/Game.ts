import { Maze } from '../entities/Maze';
import { Pacman } from '../entities/Pacman';
import { InputManager } from '../managers/InputManager';
import { Blinky } from '../entities/ghosts/Blinky';

export enum GameState {
    STARTING,   // Animation de début
    PLAYING,    // Jeu en cours
    DYING,      // Pac-Man meurt
    GAME_OVER,  // Partie terminée
    LEVEL_COMPLETE // Niveau terminé
}

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

    private lives: number = 3;
    private gameState: GameState = GameState.STARTING;
    private stateTimer: number = 0;
    private readonly START_DELAY: number = 2000; // 2 secondes d'attente au début
    private readonly DEATH_ANIMATION_DURATION: number = 1500; // 1.5 secondes pour l'animation de mort

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 448;
        this.canvas.height = 496;
        this.ctx = this.canvas.getContext('2d')!;
        document.body.appendChild(this.canvas);

        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        document.body.style.backgroundColor = 'black';
    }

    public init(): void {
        this.inputManager = InputManager.getInstance();
        this.maze = new Maze();
        this.resetLevel();
        this.gameLoop(0);
    }

    private resetLevel(): void {
        // Réinitialiser les positions
        this.pacman = new Pacman(
            14 * this.maze.getTileSize(),
            23 * this.maze.getTileSize(),
            this.maze
        );
        this.blinky = new Blinky(
            14 * this.maze.getTileSize(),
            11 * this.maze.getTileSize(),
            this.maze,
            this.pacman
        );
        
        this.gameState = GameState.STARTING;
        this.stateTimer = this.START_DELAY;
    }

    private update(deltaTime: number): void {
        this.stateTimer -= deltaTime;

        switch (this.gameState) {
            case GameState.STARTING:
                if (this.stateTimer <= 0) {
                    this.gameState = GameState.PLAYING;
                }
                break;

            case GameState.PLAYING:
                this.pacman.update(deltaTime);
                this.blinky.update(deltaTime);

                // Vérifier la collision avec Blinky
                const pacmanBounds = this.pacman.getBounds();
                const blinkyBounds = this.blinky.getBounds();

                if (this.checkCollision(pacmanBounds, blinkyBounds)) {
                    if (this.blinky.isVulnerable()) {
                        this.blinky.reset();
                        this.pacman.addScore(200);
                    } else {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = GameState.GAME_OVER;
                        } else {
                            this.gameState = GameState.DYING;
                            this.stateTimer = this.DEATH_ANIMATION_DURATION;
                        }
                    }
                }

                // Vérifier si le niveau est terminé
                if (this.maze.getRemainingDots() === 0) {
                    this.gameState = GameState.LEVEL_COMPLETE;
                    this.stateTimer = this.START_DELAY;
                }
                break;

            case GameState.DYING:
                if (this.stateTimer <= 0) {
                    this.resetLevel();
                }
                break;

            case GameState.LEVEL_COMPLETE:
                if (this.stateTimer <= 0) {
                    this.maze = new Maze(); // Réinitialiser le labyrinthe
                    this.resetLevel();
                }
                break;
        }
    }

    private render(): void {
        // Effacement du canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rendu du labyrinthe
        this.maze.render(this.ctx);
        
        // Rendu des entités selon l'état du jeu
        if (this.gameState !== GameState.DYING || Math.floor(this.stateTimer / 250) % 2 === 0) {
            this.pacman.render(this.ctx);
        }
        
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.DYING) {
            this.blinky.render(this.ctx);
        }

        // Interface utilisateur
        this.renderUI();
    }

    private renderUI(): void {
        // Score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.pacman.getScore()}`, 10, 30);

        // Vies
        for (let i = 0; i < this.lives; i++) {
            this.ctx.beginPath();
            this.ctx.fillStyle = 'yellow';
            this.ctx.arc(
                30 + i * 25,
                this.canvas.height - 20,
                8,
                0.2 * Math.PI,
                1.8 * Math.PI
            );
            this.ctx.lineTo(30 + i * 25, this.canvas.height - 20);
            this.ctx.fill();
        }

        // Messages d'état
        if (this.gameState === GameState.STARTING) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('READY!', this.canvas.width / 2, 20 * this.maze.getTileSize());
            this.ctx.textAlign = 'left';
        } else if (this.gameState === GameState.GAME_OVER) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
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