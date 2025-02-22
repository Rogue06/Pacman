import { Entity, Direction } from './Entity';
import { Maze } from './Maze';
import { Pacman } from './Pacman';

export enum GhostState {
    SCATTER = 'SCATTER',    // Le fantôme retourne à son coin
    CHASE = 'CHASE',       // Le fantôme poursuit Pac-Man
    FRIGHTENED = 'FRIGHTENED', // Le fantôme fuit Pac-Man (mode bleu)
    EATEN = 'EATEN',       // Le fantôme retourne à la maison
    BLINKING = 'BLINKING'  // État clignotant avant la fin du mode vulnérable
}

export enum GhostType {
    BLINKY = 'BLINKY',   // Rouge - poursuit directement
    PINKY = 'PINKY',     // Rose - tente d'embusquer
    INKY = 'INKY',       // Bleu - comportement imprévisible
    CLYDE = 'CLYDE'      // Orange - alterne entre poursuite et dispersion
}

export abstract class Ghost extends Entity {
    protected maze: Maze;
    protected pacman: Pacman;
    protected state: GhostState = GhostState.SCATTER;
    protected ghostType: GhostType;
    protected color: string;
    protected scatterTarget: { x: number; y: number };
    protected homePosition: { x: number; y: number };
    protected frightenedTimer: number = 0;
    protected readonly FRIGHTENED_DURATION: number = 6000; // 6 secondes en mode effrayé
    protected readonly BLINKING_DURATION: number = 2000; // 2 secondes de clignotement
    protected readonly FRIGHTENED_SPEED: number = 1; // Vitesse réduite en mode effrayé
    protected normalSpeed: number;
    protected blinkingStart: number = 0;
    protected exitTimer: number = 0;
    protected modeTimer: number = 0;
    protected readonly SCATTER_DURATION: number = 7000;  // 7 secondes en mode scatter
    protected readonly CHASE_DURATION: number = 20000;   // 20 secondes en mode chase
    protected readonly EXIT_DELAYS: { [key in GhostType]: number } = {
        [GhostType.BLINKY]: 0,      // Sort immédiatement
        [GhostType.PINKY]: 3000,    // Sort après 3 secondes
        [GhostType.INKY]: 6000,     // Sort après 6 secondes
        [GhostType.CLYDE]: 9000     // Sort après 9 secondes
    };
    protected readonly BASE_SPEED: number = 2;
    protected readonly TUNNEL_SPEED_MULTIPLIER: number = 0.5;
    protected readonly EATEN_SPEED: number = 3;
    protected speedMultiplier: number = 1;

    constructor(
        ghostType: GhostType,
        x: number,
        y: number,
        maze: Maze,
        pacman: Pacman,
        color: string,
        scatterTarget: { x: number; y: number }
    ) {
        super(x, y, 16, 16, 2);
        this.maze = maze;
        this.pacman = pacman;
        this.ghostType = ghostType;
        this.color = color;
        this.scatterTarget = scatterTarget;
        this.homePosition = { x, y };
        this.normalSpeed = this.speed;
        this.exitTimer = this.EXIT_DELAYS[ghostType];
        this.state = GhostState.SCATTER;
        this.modeTimer = this.SCATTER_DURATION;
        this.direction = Direction.UP;
    }

    public update(deltaTime: number): void {
        // Mise à jour de la vitesse
        this.updateSpeed();

        // Mise à jour des timers
        if (this.exitTimer > 0) {
            this.exitTimer -= deltaTime;
            return; // Attendre avant de sortir
        }

        // Mise à jour du mode (Scatter/Chase)
        if (this.state !== GhostState.FRIGHTENED && this.state !== GhostState.EATEN) {
            this.modeTimer -= deltaTime;
            if (this.modeTimer <= 0) {
                if (this.state === GhostState.SCATTER) {
                    this.state = GhostState.CHASE;
                    this.modeTimer = this.CHASE_DURATION;
                } else {
                    this.state = GhostState.SCATTER;
                    this.modeTimer = this.SCATTER_DURATION;
                }
                // Demi-tour lors du changement de mode
                this.direction = this.getReverseDirection(this.direction);
            }
        }

        // Mise à jour du timer en mode effrayé
        if (this.state === GhostState.FRIGHTENED || this.state === GhostState.BLINKING) {
            this.frightenedTimer -= deltaTime;
            
            if (this.state === GhostState.FRIGHTENED && 
                this.frightenedTimer <= this.BLINKING_DURATION) {
                this.state = GhostState.BLINKING;
                this.blinkingStart = Date.now();
            }
            
            if (this.frightenedTimer <= 0) {
                this.state = GhostState.CHASE;
                this.speed = this.normalSpeed;
            }
        }

        // Gestion du mouvement
        const tileSize = this.maze.getTileSize();
        const currentTileX = Math.floor(this.x / tileSize);
        const currentTileY = Math.floor(this.y / tileSize);

        // Si on est dans la maison des fantômes, monter jusqu'à la sortie
        if (this.maze.isGhostHouse(currentTileX, currentTileY)) {
            this.y -= this.speed;
            return;
        }

        // Alignement sur la grille et changement de direction
        const alignedX = currentTileX * tileSize;
        const alignedY = currentTileY * tileSize;

        if (Math.abs(this.x - alignedX) < this.speed && Math.abs(this.y - alignedY) < this.speed) {
            this.x = alignedX;
            this.y = alignedY;

            const newDirection = this.decideNextDirection();
            if (newDirection !== Direction.NONE) {
                this.direction = newDirection;
            }
        }

        // Déplacement
        if (this.direction !== Direction.NONE) {
            const nextPos = this.getNextPosition(this.direction);
            if (!this.maze.isWall(nextPos.x + this.width / 2, nextPos.y + this.height / 2, true)) {
                this.x = nextPos.x;
                this.y = nextPos.y;
            }
        }

        // Gestion du tunnel
        if (this.x < -this.width) {
            this.x = this.maze.getTileSize() * 27;
        } else if (this.x > this.maze.getTileSize() * 27) {
            this.x = -this.width;
        }
    }

    public render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        // Déterminer la couleur en fonction de l'état
        let currentColor = this.color;
        if (this.state === GhostState.FRIGHTENED) {
            currentColor = '#0000FF'; // Bleu
        } else if (this.state === GhostState.BLINKING) {
            // Clignotement entre bleu et blanc
            currentColor = Math.floor((Date.now() - this.blinkingStart) / 200) % 2 === 0 
                ? '#0000FF' 
                : '#FFFFFF';
        } else if (this.state === GhostState.EATEN) {
            currentColor = '#FFFFFF'; // Yeux seulement
        }
        
        // Corps du fantôme
        if (this.state !== GhostState.EATEN) {
            ctx.fillStyle = currentColor;
            ctx.beginPath();
            
            // Partie supérieure (arrondie)
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2,
                Math.PI,
                0,
                false
            );
            
            // Partie inférieure (ondulée)
            ctx.lineTo(this.x + this.width, this.y + this.height);
            for (let i = 0; i < 3; i++) {
                const curve = this.width / 3;
                ctx.quadraticCurveTo(
                    this.x + this.width - curve * (2 - i),
                    this.y + this.height + (i % 2 === 0 ? 4 : -4),
                    this.x + this.width - curve * (3 - i),
                    this.y + this.height
                );
            }
            
            ctx.fill();
        }
        
        // Yeux (toujours visibles)
        const eyeRadius = 3;
        const eyeOffset = 4;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset, this.y + eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - eyeOffset, this.y + eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupilles
        ctx.fillStyle = 'blue';
        const pupilOffset = this.getPupilOffset();
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset + pupilOffset.x, this.y + eyeOffset + pupilOffset.y, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - eyeOffset + pupilOffset.x, this.y + eyeOffset + pupilOffset.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    public setFrightened(): void {
        if (this.state !== GhostState.EATEN) {
            this.state = GhostState.FRIGHTENED;
            this.frightenedTimer = this.FRIGHTENED_DURATION;
            this.speed = this.FRIGHTENED_SPEED;
            this.direction = this.getReverseDirection(this.direction);
        }
    }

    public isVulnerable(): boolean {
        return this.state === GhostState.FRIGHTENED || this.state === GhostState.BLINKING;
    }

    public reset(): void {
        this.x = this.homePosition.x;
        this.y = this.homePosition.y;
        this.state = GhostState.SCATTER;
        this.direction = Direction.NONE;
        this.speed = this.normalSpeed;
    }

    protected abstract decideNextDirection(): Direction;

    private canMove(direction: Direction): boolean {
        const tileSize = this.maze.getTileSize();
        const nextX = this.x + (direction === Direction.LEFT ? -this.speed : direction === Direction.RIGHT ? this.speed : 0);
        const nextY = this.y + (direction === Direction.UP ? -this.speed : direction === Direction.DOWN ? this.speed : 0);
        
        // Vérifier le centre de la prochaine position
        return !this.maze.isWall(nextX + this.width / 2, nextY + this.height / 2, true);
    }

    private getReverseDirection(dir: Direction): Direction {
        switch (dir) {
            case Direction.UP: return Direction.DOWN;
            case Direction.DOWN: return Direction.UP;
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
            default: return Direction.NONE;
        }
    }

    protected getAvailableDirections(): Direction[] {
        const directions: Direction[] = [];
        const possibleDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        
        // Ne pas permettre de faire demi-tour sauf en mode effrayé
        const oppositeDirection = this.getReverseDirection(this.direction);
        
        for (const dir of possibleDirections) {
            if (dir === oppositeDirection && this.state !== GhostState.FRIGHTENED) {
                continue;
            }
            
            if (this.canMove(dir)) {
                directions.push(dir);
            }
        }
        
        return directions;
    }

    protected calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }

    private getPupilOffset(): { x: number; y: number } {
        switch (this.direction) {
            case Direction.UP: return { x: 0, y: -1 };
            case Direction.DOWN: return { x: 0, y: 1 };
            case Direction.LEFT: return { x: -1, y: 0 };
            case Direction.RIGHT: return { x: 1, y: 0 };
            default: return { x: 0, y: 0 };
        }
    }

    protected getNextPosition(dir: Direction): { x: number; y: number } {
        let nextX = this.x;
        let nextY = this.y;

        switch (dir) {
            case Direction.UP:
                nextY -= this.speed;
                break;
            case Direction.DOWN:
                nextY += this.speed;
                break;
            case Direction.LEFT:
                nextX -= this.speed;
                break;
            case Direction.RIGHT:
                nextX += this.speed;
                break;
        }

        // Gestion du tunnel
        if (nextX < -this.width) {
            nextX = this.maze.getTileSize() * 27;
        } else if (nextX > this.maze.getTileSize() * 27) {
            nextX = -this.width;
        }

        return { x: nextX, y: nextY };
    }

    protected updateSpeed(): void {
        if (this.state === GhostState.FRIGHTENED) {
            this.speed = this.FRIGHTENED_SPEED;
        } else if (this.state === GhostState.EATEN) {
            this.speed = this.EATEN_SPEED;
        } else {
            this.speed = this.normalSpeed;
            
            // Réduction de la vitesse dans les tunnels
            const tileX = Math.floor(this.x / this.maze.getTileSize());
            const tileY = Math.floor(this.y / this.maze.getTileSize());
            if (this.maze.isTunnel(tileX, tileY)) {
                this.speed *= this.TUNNEL_SPEED_MULTIPLIER;
            }
        }
    }

    public setSpeedMultiplier(multiplier: number): void {
        this.speedMultiplier = multiplier;
        this.normalSpeed = this.BASE_SPEED * multiplier;
        this.speed = this.normalSpeed;
    }
} 