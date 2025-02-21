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
    }

    public update(deltaTime: number): void {
        // Mise à jour du timer en mode effrayé
        if (this.state === GhostState.FRIGHTENED || this.state === GhostState.BLINKING) {
            this.frightenedTimer -= deltaTime;
            
            // Transition vers le mode clignotant
            if (this.state === GhostState.FRIGHTENED && 
                this.frightenedTimer <= this.BLINKING_DURATION) {
                this.state = GhostState.BLINKING;
                this.blinkingStart = Date.now();
            }
            
            // Fin du mode vulnérable
            if (this.frightenedTimer <= 0) {
                this.state = GhostState.CHASE;
                this.speed = this.normalSpeed;
            }
        }

        const nextDirection = this.decideNextDirection();
        if (nextDirection !== Direction.NONE) {
            this.direction = nextDirection;
        }

        const nextPos = this.getNextPosition(this.direction);
        if (!this.maze.isWall(nextPos.x, nextPos.y)) {
            this.x = nextPos.x;
            this.y = nextPos.y;
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

        return { x: nextX, y: nextY };
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
        
        for (const dir of possibleDirections) {
            const nextPos = this.getNextPosition(dir);
            if (!this.maze.isWall(nextPos.x, nextPos.y)) {
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
} 