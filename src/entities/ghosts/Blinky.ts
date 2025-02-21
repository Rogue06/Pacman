import { Direction } from '../Entity';
import { Ghost, GhostType, GhostState } from '../Ghost';
import { Maze } from '../Maze';
import { Pacman } from '../Pacman';

export class Blinky extends Ghost {
    constructor(x: number, y: number, maze: Maze, pacman: Pacman) {
        super(
            GhostType.BLINKY,
            x,
            y,
            maze,
            pacman,
            '#FF0000', // Rouge
            { x: maze.getTileSize() * 25, y: 0 } // Coin supérieur droit pour le mode scatter
        );
    }

    protected decideNextDirection(): Direction {
        const availableDirections = this.getAvailableDirections();
        
        // En mode effrayé, choisir une direction aléatoire
        if (this.state === GhostState.FRIGHTENED) {
            return availableDirections[Math.floor(Math.random() * availableDirections.length)];
        }

        // En mode scatter, viser le coin supérieur droit
        const target = this.state === GhostState.SCATTER ? 
            this.scatterTarget : 
            this.pacman.getPosition();

        let bestDirection = Direction.NONE;
        let shortestDistance = Infinity;

        // Trouver la direction qui rapproche le plus de la cible
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