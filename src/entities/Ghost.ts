import { Entity, Direction } from './Entity';
import { Maze } from './Maze';
import { Pacman } from './Pacman';

export enum GhostState {
    SCATTER = 'SCATTER',    // Le fantôme retourne à son coin
    CHASE = 'CHASE',       // Le fantôme poursuit Pac-Man
    FRIGHTENED = 'FRIGHTENED', // Le fantôme fuit Pac-Man (mode bleu)
    EATEN = 'EATEN',       // Le fantôme retourne à la maison
    BLINKING = 'BLINKING',  // État clignotant avant la fin du mode vulnérable
    RETURNING = 'RETURNING' // État de retour à la maison
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
        // Mettre à jour le mode effrayé si nécessaire
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

        // Si le fantôme est au centre d'une tuile, il peut changer de direction
        if (this.isAtGridCenter()) {
            const possibleDirections = this.getPossibleDirections();
            if (possibleDirections.length > 0) {
                if (this.state === GhostState.FRIGHTENED) {
                    // En mode effrayé, choisir une direction aléatoire
                    const randomIndex = Math.floor(Math.random() * possibleDirections.length);
                    this.direction = possibleDirections[randomIndex];
                } else {
                    // En mode normal, utiliser l'algorithme de poursuite
                    this.direction = this.getNextDirection(possibleDirections);
                }
            }
        }

        // Calculer la prochaine position
        const nextPos = this.getNextPosition(this.direction);

        // Vérifier si le mouvement est possible
        if (this.canMoveToPosition(nextPos.x, nextPos.y)) {
            this.x = nextPos.x;
            this.y = nextPos.y;
        } else {
            // Si le mouvement n'est pas possible, essayer de trouver une nouvelle direction
            const possibleDirections = this.getPossibleDirections();
            if (possibleDirections.length > 0) {
                this.direction = possibleDirections[0];
            }
        }

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

        // Mise à jour de la vitesse
        this.updateSpeed();

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

    private canMoveToPosition(x: number, y: number): boolean {
        const tileSize = this.maze.getTileSize();
        const offset = 4; // Utiliser un offset plus petit pour une meilleure maniabilité

        const points = [
            { x: x + this.width / 2, y: y + this.height / 2 }, // Centre
            { x: x + offset, y: y + offset }, // Coin supérieur gauche
            { x: x + this.width - offset, y: y + offset }, // Coin supérieur droit
            { x: x + offset, y: y + this.height - offset }, // Coin inférieur gauche
            { x: x + this.width - offset, y: y + this.height - offset } // Coin inférieur droit
        ];

        return !points.some(point => this.maze.isWall(point.x, point.y, true));
    }

    protected getNextPosition(dir: Direction): { x: number; y: number } {
        let nextX = this.x;
        let nextY = this.y;
        const tileSize = this.maze.getTileSize();

        // Calculer la prochaine position
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

        // Alignement sur la grille uniquement si on est proche du centre d'une tuile
        const gridX = Math.round(nextX / tileSize) * tileSize;
        const gridY = Math.round(nextY / tileSize) * tileSize;
        
        if (Math.abs(nextX - gridX) < this.speed) nextX = gridX;
        if (Math.abs(nextY - gridY) < this.speed) nextY = gridY;

        return { x: nextX, y: nextY };
    }

    private isAtGridCenter(): boolean {
        const tileSize = this.maze.getTileSize();
        const centerX = Math.round(this.x / tileSize) * tileSize;
        const centerY = Math.round(this.y / tileSize) * tileSize;
        return Math.abs(this.x - centerX) < 1 && Math.abs(this.y - centerY) < 1;
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

    private getPossibleDirections(): Direction[] {
        const possibleDirections: Direction[] = [];
        const tileSize = this.maze.getTileSize();

        // Vérifier chaque direction
        const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        for (const dir of directions) {
            const nextPos = this.getNextPosition(dir);
            if (this.canMoveToPosition(nextPos.x, nextPos.y)) {
                possibleDirections.push(dir);
            }
        }

        // Retirer la direction opposée sauf si c'est la seule option
        if (possibleDirections.length > 1) {
            const oppositeIndex = possibleDirections.findIndex(dir => 
                (dir === Direction.UP && this.direction === Direction.DOWN) ||
                (dir === Direction.DOWN && this.direction === Direction.UP) ||
                (dir === Direction.LEFT && this.direction === Direction.RIGHT) ||
                (dir === Direction.RIGHT && this.direction === Direction.LEFT)
            );
            if (oppositeIndex !== -1) {
                possibleDirections.splice(oppositeIndex, 1);
            }
        }

        return possibleDirections;
    }

    private getNextDirection(possibleDirections: Direction[]): Direction {
        // Si nous sommes dans la maison des fantômes, toujours monter
        const currentTileX = Math.floor(this.x / this.maze.getTileSize());
        const currentTileY = Math.floor(this.y / this.maze.getTileSize());
        if (this.maze.isGhostHouse(currentTileX, currentTileY)) {
            return Direction.UP;
        }

        // Calculer la direction qui nous rapproche le plus de la cible
        let bestDirection = this.direction;
        let shortestDistance = Infinity;

        const targetPos = this.getTargetPosition();

        for (const dir of possibleDirections) {
            const nextPos = this.getNextPosition(dir);
            const distance = Math.sqrt(
                Math.pow(nextPos.x - targetPos.x, 2) + 
                Math.pow(nextPos.y - targetPos.y, 2)
            );

            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestDirection = dir;
            }
        }

        return bestDirection;
    }

    private getTargetPosition(): { x: number; y: number } {
        // Si le fantôme est effrayé, il n'a pas de cible spécifique
        if (this.state === GhostState.FRIGHTENED || this.state === GhostState.BLINKING) {
            return { 
                x: Math.random() * this.maze.getTileSize() * 28,
                y: Math.random() * this.maze.getTileSize() * 31
            };
        }

        // Si le fantôme est en mode retour à la maison
        if (this.state === GhostState.RETURNING) {
            return {
                x: this.maze.getTileSize() * 14,
                y: this.maze.getTileSize() * 14
            };
        }

        // En mode normal, la cible dépend du type de fantôme
        switch (this.ghostType) {
            case GhostType.BLINKY:
                // Blinky cible directement Pac-Man
                return { 
                    x: this.pacman.getPosition().x, 
                    y: this.pacman.getPosition().y 
                };
            
            case GhostType.PINKY:
                // Pinky cible 4 cases devant Pac-Man
                const offset = this.maze.getTileSize() * 4;
                const pacmanPos = this.pacman.getPosition();
                let targetX = pacmanPos.x;
                let targetY = pacmanPos.y;
                
                switch (this.pacman.getDirection()) {
                    case Direction.UP:
                        targetY -= offset;
                        break;
                    case Direction.DOWN:
                        targetY += offset;
                        break;
                    case Direction.LEFT:
                        targetX -= offset;
                        break;
                    case Direction.RIGHT:
                        targetX += offset;
                        break;
                }
                return { x: targetX, y: targetY };
            
            case GhostType.INKY:
                // Inky cible une position basée sur la position de Blinky et Pac-Man
                const blinkyPos = this.getBlinkyPosition();
                const pacmanPosition = this.pacman.getPosition();
                return {
                    x: pacmanPosition.x + (pacmanPosition.x - blinkyPos.x),
                    y: pacmanPosition.y + (pacmanPosition.y - blinkyPos.y)
                };
            
            case GhostType.CLYDE:
                // Clyde alterne entre cibler Pac-Man et un coin du labyrinthe
                const pacmanCurrentPos = this.pacman.getPosition();
                const distanceToPacman = Math.sqrt(
                    Math.pow(this.getPosition().x - pacmanCurrentPos.x, 2) + 
                    Math.pow(this.getPosition().y - pacmanCurrentPos.y, 2)
                );
                
                if (distanceToPacman > this.maze.getTileSize() * 8) {
                    return { 
                        x: pacmanCurrentPos.x, 
                        y: pacmanCurrentPos.y 
                    };
                } else {
                    return {
                        x: 0,
                        y: this.maze.getTileSize() * 31
                    };
                }
            
            default:
                const defaultTarget = this.pacman.getPosition();
                return { 
                    x: defaultTarget.x, 
                    y: defaultTarget.y 
                };
        }
    }

    private getBlinkyPosition(): { x: number; y: number } {
        // Cette méthode devrait être implémentée pour obtenir la position de Blinky
        // Pour l'instant, on retourne une position par défaut
        return { x: 0, y: 0 };
    }
} 