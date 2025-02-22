import { Blinky } from '../src/entities/ghosts/Blinky';
import { Pinky } from '../src/entities/ghosts/Pinky';
import { Inky } from '../src/entities/ghosts/Inky';
import { Clyde } from '../src/entities/ghosts/Clyde';
import { Maze } from '../src/entities/Maze';
import { Pacman } from '../src/entities/Pacman';
import { Game } from '../src/core/Game';
import { GhostState } from '../src/entities/Ghost';

describe('Ghosts', () => {
    let maze: Maze;
    let game: Game;
    let pacman: Pacman;
    let blinky: Blinky;
    let pinky: Pinky;
    let inky: Inky;
    let clyde: Clyde;

    beforeEach(() => {
        maze = new Maze();
        game = new Game();
        pacman = new Pacman(14 * maze.getTileSize(), 23 * maze.getTileSize(), maze, game);
        blinky = new Blinky(14 * maze.getTileSize(), 11 * maze.getTileSize(), maze, pacman);
        pinky = new Pinky(14 * maze.getTileSize(), 14 * maze.getTileSize(), maze, pacman);
        inky = new Inky(12 * maze.getTileSize(), 14 * maze.getTileSize(), maze, pacman, blinky);
        clyde = new Clyde(16 * maze.getTileSize(), 14 * maze.getTileSize(), maze, pacman);
    });

    describe('Blinky', () => {
        test('Mode Cruise Elroy', () => {
            // Simuler peu de pac-gommes restantes
            for (let i = 0; i < 240; i++) {
                maze.consumeDot(i % 28 * maze.getTileSize(), Math.floor(i / 28) * maze.getTileSize());
            }
            
            const initialSpeed = blinky.getSpeed();
            blinky.update(16.67);
            expect(blinky.getSpeed()).toBeGreaterThan(initialSpeed);
        });
    });

    describe('Pinky', () => {
        test('Embuscade devant Pac-Man', () => {
            pacman.setDirection(Direction.UP);
            pinky.update(16.67);
            const pinkyPos = pinky.getPosition();
            const pacmanPos = pacman.getPosition();
            
            // Vérifier que Pinky vise 4 cases devant Pac-Man
            expect(pinkyPos.y).toBeLessThan(pacmanPos.y);
        });
    });

    describe('Inky', () => {
        test('Position relative à Blinky', () => {
            const blinkyPos = blinky.getPosition();
            const inkyPos = inky.getPosition();
            const pacmanPos = pacman.getPosition();
            
            inky.update(16.67);
            
            // Vérifier que Inky utilise la position de Blinky pour son mouvement
            const newInkyPos = inky.getPosition();
            expect(newInkyPos).not.toEqual(inkyPos);
        });
    });

    describe('Clyde', () => {
        test('Comportement de dispersion', () => {
            // Placer Clyde près de Pac-Man
            clyde = new Clyde(
                pacman.getX() + maze.getTileSize(),
                pacman.getY(),
                maze,
                pacman
            );
            
            const initialDistance = Math.sqrt(
                Math.pow(clyde.getX() - pacman.getX(), 2) +
                Math.pow(clyde.getY() - pacman.getY(), 2)
            );
            
            clyde.update(16.67);
            
            const newDistance = Math.sqrt(
                Math.pow(clyde.getX() - pacman.getX(), 2) +
                Math.pow(clyde.getY() - pacman.getY(), 2)
            );
            
            // Vérifier que Clyde s'éloigne quand il est trop proche
            expect(newDistance).toBeGreaterThan(initialDistance);
        });
    });

    describe('Comportements communs', () => {
        test('Mode vulnérable', () => {
            blinky.setFrightened();
            expect(blinky.isVulnerable()).toBeTruthy();
            
            // Vérifier que la vitesse est réduite
            const normalSpeed = blinky.getSpeed();
            blinky.setFrightened();
            expect(blinky.getSpeed()).toBeLessThan(normalSpeed);
        });

        test('Retour à la maison après avoir été mangé', () => {
            blinky.setFrightened();
            blinky.reset();
            
            const homePos = {
                x: 14 * maze.getTileSize(),
                y: 11 * maze.getTileSize()
            };
            
            expect(blinky.getPosition()).toEqual(homePos);
        });

        test('Vitesse dans les tunnels', () => {
            // Placer le fantôme dans le tunnel
            blinky = new Blinky(
                2 * maze.getTileSize(),
                14 * maze.getTileSize(),
                maze,
                pacman
            );
            
            const normalSpeed = blinky.getSpeed();
            blinky.update(16.67);
            
            // Vérifier que la vitesse est réduite dans le tunnel
            expect(blinky.getSpeed()).toBeLessThan(normalSpeed);
        });
    });
}); 