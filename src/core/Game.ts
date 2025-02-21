import { Maze } from '../entities/Maze';
import { Pacman } from '../entities/Pacman';
import { InputManager } from '../managers/InputManager';
import { SoundManager, SoundEffect } from '../managers/SoundManager';
import { Blinky } from '../entities/ghosts/Blinky';
import { Pinky } from '../entities/ghosts/Pinky';
import { Inky } from '../entities/ghosts/Inky';
import { Clyde } from '../entities/ghosts/Clyde';
import { Ghost } from '../entities/Ghost';

export enum GameState {
    TITLE_SCREEN, // Écran titre
    STARTING,     // Animation de début
    PLAYING,      // Jeu en cours
    PAUSED,       // Jeu en pause
    DYING,        // Pac-Man meurt
    GAME_OVER,    // Partie terminée
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
    private pinky!: Pinky;
    private inky!: Inky;
    private clyde!: Clyde;
    private inputManager!: InputManager;
    private soundManager!: SoundManager;

    private lives: number = 3;
    private gameState: GameState = GameState.STARTING;
    private stateTimer: number = 0;
    private readonly START_DELAY: number = 2000; // 2 secondes d'attente au début
    private readonly DEATH_ANIMATION_DURATION: number = 1500; // 1.5 secondes pour l'animation de mort
    private ghostEatenCount: number = 0; // Compte les fantômes mangés pendant un Power Pellet
    private readonly GHOST_SCORE_MULTIPLIER: number = 2; // Le score est doublé pour chaque fantôme consécutif
    private highScore: number = 0;
    private currentLevel: number = 1;

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

        // Ajouter les contrôles de son et de jeu
        this.setupControls();
    }

    private setupControls(): void {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyM':
                    this.soundManager.toggleMusic();
                    break;
                case 'KeyS':
                    this.soundManager.toggleSound();
                    break;
                case 'Space':
                    if (this.gameState === GameState.TITLE_SCREEN) {
                        this.startNewGame();
                    } else if (this.gameState === GameState.PLAYING) {
                        this.gameState = GameState.PAUSED;
                        this.soundManager.stopSiren();
                    } else if (this.gameState === GameState.PAUSED) {
                        this.gameState = GameState.PLAYING;
                        this.soundManager.startSiren();
                    }
                    break;
                case 'Enter':
                    if (this.gameState === GameState.GAME_OVER) {
                        this.gameState = GameState.TITLE_SCREEN;
                    }
                    break;
            }
        });
    }

    public init(): void {
        this.inputManager = InputManager.getInstance();
        this.soundManager = SoundManager.getInstance();
        this.maze = new Maze();
        this.gameState = GameState.TITLE_SCREEN;
        this.loadHighScore();
        this.gameLoop(0);
    }

    private startNewGame(): void {
        this.lives = 3;
        this.currentLevel = 1;
        this.resetLevel();
    }

    private loadHighScore(): void {
        const savedScore = localStorage.getItem('pacman-highscore');
        if (savedScore) {
            this.highScore = parseInt(savedScore);
        }
    }

    private saveHighScore(): void {
        if (this.pacman && this.pacman.getScore() > this.highScore) {
            this.highScore = this.pacman.getScore();
            localStorage.setItem('pacman-highscore', this.highScore.toString());
        }
    }

    private resetLevel(): void {
        // Réinitialiser les positions
        this.pacman = new Pacman(
            14 * this.maze.getTileSize(),
            23 * this.maze.getTileSize(),
            this.maze,
            this
        );
        this.blinky = new Blinky(
            14 * this.maze.getTileSize(),
            11 * this.maze.getTileSize(),
            this.maze,
            this.pacman
        );
        this.pinky = new Pinky(
            14 * this.maze.getTileSize(),
            14 * this.maze.getTileSize(),
            this.maze,
            this.pacman
        );
        this.inky = new Inky(
            14 * this.maze.getTileSize(),
            17 * this.maze.getTileSize(),
            this.maze,
            this.pacman,
            this.blinky
        );
        this.clyde = new Clyde(
            14 * this.maze.getTileSize(),
            20 * this.maze.getTileSize(),
            this.maze,
            this.pacman
        );
        
        this.ghostEatenCount = 0;
        this.gameState = GameState.STARTING;
        this.stateTimer = this.START_DELAY;
        
        // Jouer le son de début de partie
        this.soundManager.playSound(SoundEffect.GAME_START);
    }

    private update(deltaTime: number): void {
        if (this.gameState === GameState.PAUSED) {
            return; // Ne rien mettre à jour en pause
        }

        this.stateTimer -= deltaTime;

        switch (this.gameState) {
            case GameState.TITLE_SCREEN:
                // Animation de l'écran titre si nécessaire
                break;

            case GameState.STARTING:
                if (this.stateTimer <= 0) {
                    this.gameState = GameState.PLAYING;
                    // Démarrer la sirène quand le jeu commence
                    this.soundManager.startSiren();
                }
                break;

            case GameState.PLAYING:
                this.pacman.update(deltaTime);
                this.blinky.update(deltaTime);
                this.pinky.update(deltaTime);
                this.inky.update(deltaTime);
                this.clyde.update(deltaTime);

                // Vérifier les collisions avec les fantômes
                const pacmanBounds = this.pacman.getBounds();
                const ghostCollision = this.checkGhostCollisions(pacmanBounds);
                
                if (ghostCollision === true) {
                    this.lives--;
                    // Arrêter la sirène et jouer le son de mort
                    this.soundManager.stopSiren();
                    this.soundManager.playSound(SoundEffect.DEATH);
                    
                    if (this.lives <= 0) {
                        this.gameState = GameState.GAME_OVER;
                    } else {
                        this.gameState = GameState.DYING;
                        this.stateTimer = this.DEATH_ANIMATION_DURATION;
                    }
                }

                if (this.maze.getRemainingDots() === 0) {
                    this.gameState = GameState.LEVEL_COMPLETE;
                    this.stateTimer = this.START_DELAY;
                    // Arrêter la sirène à la fin du niveau
                    this.soundManager.stopSiren();
                }
                break;

            case GameState.DYING:
                if (this.stateTimer <= 0) {
                    this.resetLevel();
                }
                break;

            case GameState.LEVEL_COMPLETE:
                if (this.stateTimer <= 0) {
                    this.maze = new Maze();
                    this.resetLevel();
                }
                break;

            case GameState.GAME_OVER:
                this.saveHighScore();
                break;
        }
    }

    private checkGhostCollisions(pacmanBounds: any): boolean | void {
        const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
        
        for (const ghost of ghosts) {
            const ghostBounds = ghost.getBounds();
            if (this.checkCollision(pacmanBounds, ghostBounds)) {
                if (ghost.isVulnerable()) {
                    this.handleGhostEaten(ghost);
                    return false;
                }
                return true;
            }
        }
        
        return false;
    }

    private handleGhostEaten(ghost: Ghost): void {
        ghost.reset();
        // Calculer le score basé sur le nombre de fantômes mangés
        const score = 200 * Math.pow(this.GHOST_SCORE_MULTIPLIER, this.ghostEatenCount);
        this.pacman.addScore(score);
        this.ghostEatenCount++;
        this.soundManager.playSound(SoundEffect.GHOST_EAT);
    }

    public activatePowerMode(): void {
        this.ghostEatenCount = 0; // Réinitialiser le compteur
        const ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
        ghosts.forEach(ghost => ghost.setFrightened());
    }

    private render(): void {
        // Effacement du canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.gameState) {
            case GameState.TITLE_SCREEN:
                this.renderTitleScreen();
                break;

            case GameState.PAUSED:
                // Rendre le jeu en arrière-plan
                this.maze.render(this.ctx);
                this.pacman.render(this.ctx);
                this.blinky.render(this.ctx);
                this.pinky.render(this.ctx);
                this.inky.render(this.ctx);
                this.clyde.render(this.ctx);
                this.renderUI();
                // Ajouter l'overlay de pause
                this.renderPauseOverlay();
                break;

            default:
                // Rendu normal du jeu
                this.maze.render(this.ctx);
                if (this.gameState !== GameState.DYING || Math.floor(this.stateTimer / 250) % 2 === 0) {
                    this.pacman.render(this.ctx);
                }
                if (this.gameState === GameState.PLAYING || this.gameState === GameState.DYING) {
                    this.blinky.render(this.ctx);
                    this.pinky.render(this.ctx);
                    this.inky.render(this.ctx);
                    this.clyde.render(this.ctx);
                }
                this.renderUI();
                break;
        }
    }

    private renderTitleScreen(): void {
        // Logo PAC-MAN
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAC-MAN', this.canvas.width / 2, 150);

        // High Score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.canvas.width / 2, 250);

        // Instructions
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Appuyez sur ESPACE pour commencer', this.canvas.width / 2, 350);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Utilisez les flèches pour vous déplacer', this.canvas.width / 2, 380);
        this.ctx.fillText('ESPACE pour mettre en pause', this.canvas.width / 2, 400);

        // Animation clignotante
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('PRESS SPACE', this.canvas.width / 2, 300);
        }
    }

    private renderPauseOverlay(): void {
        // Fond semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Texte PAUSE
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSE', this.canvas.width / 2, this.canvas.height / 2);

        // Instructions
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Appuyez sur ESPACE pour continuer', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private renderUI(): void {
        // Score et High Score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.pacman.getScore()}`, 10, 30);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 10, 30);

        // Niveau actuel
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Niveau ${this.currentLevel}`, this.canvas.width / 2, 30);

        // Vies
        this.ctx.textAlign = 'left';
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
        this.ctx.textAlign = 'center';
        if (this.gameState === GameState.STARTING) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('READY!', this.canvas.width / 2, 20 * this.maze.getTileSize());
        } else if (this.gameState === GameState.GAME_OVER) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '48px Arial';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Appuyez sur ENTRÉE pour continuer', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }

        // Indicateurs de son
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = this.soundManager.isMusicEnabled() ? 'white' : 'red';
        this.ctx.fillText('M: Musique', this.canvas.width - 10, this.canvas.height - 40);
        this.ctx.fillStyle = this.soundManager.isSoundEnabled() ? 'white' : 'red';
        this.ctx.fillText('S: Sons', this.canvas.width - 10, this.canvas.height - 20);
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