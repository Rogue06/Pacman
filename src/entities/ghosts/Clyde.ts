import { Direction } from '../Entity';
import { Ghost, GhostType, GhostState } from '../Ghost';
import { Maze } from '../Maze';
import { Pacman } from '../Pacman';

export class Clyde extends Ghost {
    private readonly CHASE_DISTANCE: number = 8 * 16; // Distance en pixels (8 tuiles)

    constructor(x: number, y: number, maze: Maze, pacman: Pacman) {
        super(
            GhostType.CLYDE,
            x,
            y,
            maze,
            pacman,
            '#FFB851', // Orange
            { x: 0, y: maze.getTileSize() * 30 } // Coin inférieur gauche pour le mode scatter
        );
    }

    protected decideNextDirection(): Direction {
        const availableDirections = this.getAvailableDirections();
        
        // En mode effrayé, choisir une direction aléatoire
        if (this.state === GhostState.FRIGHTENED) {
            return availableDirections[Math.floor(Math.random() * availableDirections.length)];
        }

        const pacmanPos = this.pacman.getPosition();
        const currentPos = this.getPosition();
        const distanceToPacman = this.calculateDistance(currentPos, pacmanPos);

        // Si en mode scatter ou si trop proche de Pac-Man, aller vers le coin
        if (this.state === GhostState.SCATTER || distanceToPacman < this.CHASE_DISTANCE) {
            return this.moveTowardsTarget(this.scatterTarget, availableDirections);
        }

        // Sinon, poursuivre Pac-Man
        return this.moveTowardsTarget(pacmanPos, availableDirections);
    }

    private moveTowardsTarget(target: { x: number; y: number }, availableDirections: Direction[]): Direction {
        let bestDirection = Direction.NONE;
        let shortestDistance = Infinity;

        for (const direction of availableDirections) {
            // Éviter de faire demi-tour sauf si c'est la seule option
            if (this.isOppositeDirection(direction, this.direction) && availableDirections.length > 1) {
                continue;
            }

            const nextPos = this.getNextPosition(direction);
            const distance = this.calculateDistance(nextPos, target);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
        return (
            (dir1 === Direction.UP && dir2 === Direction.DOWN) ||
            (dir1 === Direction.DOWN && dir2 === Direction.UP) ||
            (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) ||
            (dir1 === Direction.RIGHT && dir2 === Direction.LEFT)
        );
    }
} 