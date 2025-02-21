export enum TileType {
    WALL = 'WALL',
    PATH = 'PATH',
    DOT = 'DOT',
    POWER_PELLET = 'POWER_PELLET',
    GHOST_HOUSE = 'GHOST_HOUSE'
}

export class Maze {
    private grid: TileType[][];
    private readonly TILE_SIZE: number = 16; // Taille standard d'une tuile en pixels
    private dots: number = 0;

    constructor() {
        // Définition du labyrinthe basée sur l'image de référence
        this.grid = [
            // 28x31 grille (448x496 pixels)
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            // ... (nous compléterons la grille complète plus tard)
        ].map(row => row.map(cell => {
            switch(cell) {
                case 1: return TileType.WALL;
                case 2: return TileType.DOT;
                case 3: return TileType.POWER_PELLET;
                case 4: return TileType.GHOST_HOUSE;
                default: return TileType.PATH;
            }
        }));
    }

    public render(ctx: CanvasRenderingContext2D): void {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                const pixelX = x * this.TILE_SIZE;
                const pixelY = y * this.TILE_SIZE;

                switch (tile) {
                    case TileType.WALL:
                        // Dessin des murs en bleu néon
                        ctx.strokeStyle = '#0000FF';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                        break;
                    case TileType.DOT:
                        // Dessin des pac-gommes
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(
                            pixelX + this.TILE_SIZE / 2,
                            pixelY + this.TILE_SIZE / 2,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                        break;
                    case TileType.POWER_PELLET:
                        // Dessin des super pac-gommes
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(
                            pixelX + this.TILE_SIZE / 2,
                            pixelY + this.TILE_SIZE / 2,
                            6,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                        break;
                }
            }
        }
    }

    public isWall(x: number, y: number): boolean {
        const gridX = Math.floor(x / this.TILE_SIZE);
        const gridY = Math.floor(y / this.TILE_SIZE);
        return this.grid[gridY][gridX] === TileType.WALL;
    }

    public consumeDot(x: number, y: number): boolean {
        const gridX = Math.floor(x / this.TILE_SIZE);
        const gridY = Math.floor(y / this.TILE_SIZE);
        
        if (this.grid[gridY][gridX] === TileType.DOT) {
            this.grid[gridY][gridX] = TileType.PATH;
            this.dots--;
            return true;
        }
        return false;
    }

    public consumePowerPellet(x: number, y: number): boolean {
        const gridX = Math.floor(x / this.TILE_SIZE);
        const gridY = Math.floor(y / this.TILE_SIZE);
        
        if (this.grid[gridY][gridX] === TileType.POWER_PELLET) {
            this.grid[gridY][gridX] = TileType.PATH;
            return true;
        }
        return false;
    }

    public getTileSize(): number {
        return this.TILE_SIZE;
    }

    public getRemainingDots(): number {
        return this.dots;
    }
} 