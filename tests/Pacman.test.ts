import { Pacman } from '../src/entities/Pacman';
import { Maze } from '../src/entities/Maze';
import { Game } from '../src/core/Game';
import { Direction } from '../src/entities/Entity';

describe('Pacman', () => {
    let pacman: Pacman;
    let maze: Maze;
    let game: Game;

    beforeEach(() => {
        maze = new Maze();
        game = new Game();
        pacman = new Pacman(14 * maze.getTileSize(), 23 * maze.getTileSize(), maze, game);
    });

    test('Initialisation correcte', () => {
        expect(pacman.getPosition()).toEqual({
            x: 14 * maze.getTileSize(),
            y: 23 * maze.getTileSize()
        });
        expect(pacman.getDirection()).toBe(Direction.NONE);
    });

    test('Collision avec les murs', () => {
        // Position initiale sur un chemin valide
        expect(maze.isWall(pacman.getX(), pacman.getY())).toBeFalsy();
        
        // Déplacement vers un mur
        const wallX = 0;
        const wallY = 0;
        pacman = new Pacman(wallX, wallY, maze, game);
        expect(maze.isWall(wallX, wallY)).toBeTruthy();
    });

    test('Collecte des points', () => {
        const initialScore = pacman.getScore();
        
        // Simuler la collecte d'une pac-gomme
        maze.consumeDot(pacman.getX(), pacman.getY());
        expect(pacman.getScore()).toBe(initialScore + 10);

        // Simuler la collecte d'une super pac-gomme
        maze.consumePowerPellet(pacman.getX(), pacman.getY());
        expect(pacman.getScore()).toBe(initialScore + 60); // 10 + 50
    });

    test('Déplacement fluide', () => {
        const initialX = pacman.getX();
        const initialY = pacman.getY();
        
        // Simuler un déplacement vers la droite
        pacman.update(16.67); // ~60 FPS
        expect(pacman.getX()).toBeGreaterThan(initialX);
        expect(pacman.getY()).toBe(initialY);
    });

    test('Gestion du tunnel', () => {
        // Placer Pac-Man à l'entrée du tunnel gauche
        pacman = new Pacman(-16, 14 * maze.getTileSize(), maze, game);
        pacman.update(16.67);
        expect(pacman.getX()).toBe(maze.getTileSize() * 27);

        // Placer Pac-Man à l'entrée du tunnel droit
        pacman = new Pacman(maze.getTileSize() * 28, 14 * maze.getTileSize(), maze, game);
        pacman.update(16.67);
        expect(pacman.getX()).toBe(-16);
    });
}); 