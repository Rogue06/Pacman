import { Direction } from '../Entity';
import { Ghost, GhostType, GhostState } from '../Ghost';
import { Maze } from '../Maze';
import { Pacman } from '../Pacman';

export class Blinky extends Ghost {
    private readonly ELROY_SPEED_1: number = 2.5;  // Première vitesse Cruise Elroy
    private readonly ELROY_SPEED_2: number = 3;    // Deuxième vitesse Cruise Elroy
    private readonly ELROY_DOTS_1: number = 20;    // Seuil 1 : 20 pac-gommes restantes
    private readonly ELROY_DOTS_2: number = 10;    // Seuil 2 : 10 pac-gommes restantes

    constructor(x: number, y: number, maze: Maze, pacman: Pacman) {
        super(
            GhostType.BLINKY,
            x,
            y,
            maze,
            pacman,
            '#FF0000', // Rouge
            { x: 25 * maze.getTileSize(), y: 0 } // Coin supérieur droit
        );
    }

    public update(deltaTime: number): void {
        // Mise à jour de la vitesse selon le mode Cruise Elroy
        if (this.state === GhostState.CHASE || this.state === GhostState.SCATTER) {
            const remainingDots = this.maze.getRemainingDots();
            if (remainingDots <= this.ELROY_DOTS_2) {
                this.speed = this.ELROY_SPEED_2;
            } else if (remainingDots <= this.ELROY_DOTS_1) {
                this.speed = this.ELROY_SPEED_1;
            } else {
                this.speed = this.normalSpeed;
            }
        }

        super.update(deltaTime);
    }

    protected decideNextDirection(): Direction {
        // En mode poursuite, Blinky vise directement la position de Pac-Man
        const target = this.state === GhostState.CHASE
            ? { x: this.pacman.getX(), y: this.pacman.getY() }
            : this.scatterTarget;

        return this.findBestDirection(target);
    }

    private findBestDirection(target: { x: number; y: number }): Direction {
        const availableDirections = this.getAvailableDirections();
        let bestDirection = Direction.NONE;
        let shortestDistance = Infinity;

        for (const direction of availableDirections) {
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