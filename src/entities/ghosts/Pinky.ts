import { Direction } from '../Entity';
import { Ghost, GhostType, GhostState } from '../Ghost';
import { Maze } from '../Maze';
import { Pacman } from '../Pacman';

export class Pinky extends Ghost {
    private readonly TILES_AHEAD: number = 4; // Nombre de cases à viser devant Pac-Man

    constructor(x: number, y: number, maze: Maze, pacman: Pacman) {
        super(
            GhostType.PINKY,
            x,
            y,
            maze,
            pacman,
            '#FFB8FF', // Rose
            { x: 0, y: 0 } // Coin supérieur gauche pour le mode scatter
        );
    }

    protected decideNextDirection(): Direction {
        const availableDirections = this.getAvailableDirections();
        
        // En mode effrayé, choisir une direction aléatoire
        if (this.state === GhostState.FRIGHTENED) {
            return availableDirections[Math.floor(Math.random() * availableDirections.length)];
        }

        // Calculer la position cible
        const pacmanPos = this.pacman.getPosition();
        const pacmanDir = this.pacman.getDirection();
        let targetX = pacmanPos.x;
        let targetY = pacmanPos.y;

        // Ajuster la cible selon la direction de Pac-Man
        const tileSize = this.maze.getTileSize();
        switch (pacmanDir) {
            case Direction.UP:
                targetY -= this.TILES_AHEAD * tileSize;
                targetX -= 4 * tileSize; // Bug original du jeu : décalage vers la gauche en montant
                break;
            case Direction.DOWN:
                targetY += this.TILES_AHEAD * tileSize;
                break;
            case Direction.LEFT:
                targetX -= this.TILES_AHEAD * tileSize;
                break;
            case Direction.RIGHT:
                targetX += this.TILES_AHEAD * tileSize;
                break;
        }

        // En mode scatter, viser le coin supérieur gauche
        const target = this.state === GhostState.SCATTER ? 
            this.scatterTarget : 
            { x: targetX, y: targetY };

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