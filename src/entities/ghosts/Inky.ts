import { Direction } from '../Entity';
import { Ghost, GhostType, GhostState } from '../Ghost';
import { Maze } from '../Maze';
import { Pacman } from '../Pacman';
import { Blinky } from './Blinky';

export class Inky extends Ghost {
    private readonly TILES_AHEAD: number = 2; // Nombre de cases à viser devant Pac-Man
    private blinky: Blinky;

    constructor(x: number, y: number, maze: Maze, pacman: Pacman, blinky: Blinky) {
        super(
            GhostType.INKY,
            x,
            y,
            maze,
            pacman,
            '#00FFFF', // Bleu cyan
            { x: maze.getTileSize() * 27, y: maze.getTileSize() * 30 } // Coin inférieur droit pour le mode scatter
        );
        this.blinky = blinky;
    }

    protected decideNextDirection(): Direction {
        const availableDirections = this.getAvailableDirections();
        
        // En mode effrayé, choisir une direction aléatoire
        if (this.state === GhostState.FRIGHTENED) {
            return availableDirections[Math.floor(Math.random() * availableDirections.length)];
        }

        // Calculer le point pivot (2 cases devant Pac-Man)
        const pacmanPos = this.pacman.getPosition();
        const pacmanDir = this.pacman.getDirection();
        let pivotX = pacmanPos.x;
        let pivotY = pacmanPos.y;

        // Ajuster le point pivot selon la direction de Pac-Man
        const tileSize = this.maze.getTileSize();
        switch (pacmanDir) {
            case Direction.UP:
                pivotY -= this.TILES_AHEAD * tileSize;
                pivotX -= 2 * tileSize; // Bug original : décalage vers la gauche en montant
                break;
            case Direction.DOWN:
                pivotY += this.TILES_AHEAD * tileSize;
                break;
            case Direction.LEFT:
                pivotX -= this.TILES_AHEAD * tileSize;
                break;
            case Direction.RIGHT:
                pivotX += this.TILES_AHEAD * tileSize;
                break;
        }

        // En mode scatter, viser le coin inférieur droit
        if (this.state === GhostState.SCATTER) {
            return this.moveTowardsTarget(this.scatterTarget, availableDirections);
        }

        // Position de Blinky
        const blinkyPos = this.blinky.getPosition();

        // Calculer le vecteur entre le point pivot et Blinky
        const vectorX = pivotX - blinkyPos.x;
        const vectorY = pivotY - blinkyPos.y;

        // Doubler ce vecteur pour obtenir la position cible
        const target = {
            x: pivotX + vectorX,
            y: pivotY + vectorY
        };

        return this.moveTowardsTarget(target, availableDirections);
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