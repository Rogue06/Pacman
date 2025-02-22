export enum TileType {
    WALL = 'WALL',
    PATH = 'PATH',
    DOT = 'DOT',
    POWER_PELLET = 'POWER_PELLET',
    GHOST_HOUSE = 'GHOST_HOUSE',
    DOOR = 'DOOR'
}

export class Maze {
    private grid: TileType[][];
    private readonly TILE_SIZE: number = 16; // Taille standard d'une tuile en pixels
    private dots: number = 0;
    private totalDots: number = 0;

    constructor() {
        // 1 = mur, 2 = pac-gomme, 3 = super pac-gomme, 4 = maison des fantômes, 0 = chemin vide, 5 = porte des fantômes
        const layout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        // Conversion de la grille numérique en TileType
        this.grid = layout.map(row => row.map(cell => {
            switch(cell) {
                case 1: return TileType.WALL;
                case 2: 
                    this.dots++;
                    this.totalDots++;
                    return TileType.DOT;
                case 3: return TileType.POWER_PELLET;
                case 4: return TileType.GHOST_HOUSE;
                case 5: return TileType.DOOR;
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
                        ctx.fillStyle = '#000033';
                        ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                        ctx.strokeStyle = '#0000FF';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(pixelX + 1, pixelY + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);
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
                    case TileType.GHOST_HOUSE:
                    case TileType.DOOR:
                        // Dessin de la maison des fantômes et de la porte
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(pixelX, pixelY, this.TILE_SIZE, this.TILE_SIZE);
                        if (tile === TileType.DOOR) {
                            ctx.strokeStyle = '#FFB8FF';  // Rose clair pour la porte
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(pixelX, pixelY + this.TILE_SIZE / 2);
                            ctx.lineTo(pixelX + this.TILE_SIZE, pixelY + this.TILE_SIZE / 2);
                            ctx.stroke();
                        }
                        break;
                }
            }
        }
    }

    public isWall(x: number, y: number, isGhost: boolean = false): boolean {
        // Convertir les coordonnées en indices de grille
        const gridX = Math.floor(x / this.TILE_SIZE);
        const gridY = Math.floor(y / this.TILE_SIZE);

        // Vérifier les limites de la grille
        if (gridX < 0 || gridX >= this.grid[0].length || gridY < 0 || gridY >= this.grid.length) {
            return true;
        }

        const tile = this.grid[gridY][gridX];

        // Pour les fantômes
        if (isGhost) {
            // Les fantômes peuvent traverser la porte et rester dans leur maison
            if (tile === TileType.DOOR || tile === TileType.GHOST_HOUSE) {
                return false;
            }
        }

        // Pour tous les personnages
        return tile === TileType.WALL;
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

    public isGhostHouse(x: number, y: number): boolean {
        // Vérifier les limites de la grille
        if (x < 0 || x >= this.grid[0].length || y < 0 || y >= this.grid.length) {
            return false;
        }

        return this.grid[y][x] === TileType.GHOST_HOUSE;
    }

    public getTileSize(): number {
        return this.TILE_SIZE;
    }

    public getRemainingDots(): number {
        return this.dots;
    }

    public isTunnel(x: number, y: number): boolean {
        // Les tunnels sont situés aux coordonnées y=14 (milieu du labyrinthe)
        // et x < 5 ou x > 22 (extrémités gauche et droite)
        return y === 14 && (x < 5 || x > 22);
    }

    public getTotalDots(): number {
        return this.totalDots;
    }

    public getHeight(): number {
        return this.grid.length;
    }

    public setTile(x: number, y: number, value: number): void {
        if (x < 0 || x >= this.grid[0].length || y < 0 || y >= this.grid.length) {
            return;
        }

        // Convertir la valeur numérique en TileType
        let newTile: TileType;
        switch (value) {
            case 1: newTile = TileType.WALL; break;
            case 2: 
                newTile = TileType.DOT;
                this.dots++;
                break;
            case 3: newTile = TileType.POWER_PELLET; break;
            case 4: newTile = TileType.GHOST_HOUSE; break;
            case 5: newTile = TileType.DOOR; break;
            default: newTile = TileType.PATH;
        }

        // Si on remplace une pac-gomme, décrémenter le compteur
        if (this.grid[y][x] === TileType.DOT) {
            this.dots--;
        }

        this.grid[y][x] = newTile;
    }

    public isPath(x: number, y: number): boolean {
        // Vérifier les limites de la grille
        if (x < 0 || x >= this.grid[0].length || y < 0 || y >= this.grid.length) {
            return false;
        }

        // Un chemin valide est soit un chemin vide (où il y avait une pac-gomme),
        // soit une tuile avec une pac-gomme ou une super pac-gomme
        const tile = this.grid[y][x];
        return tile === TileType.PATH || tile === TileType.DOT || tile === TileType.POWER_PELLET;
    }
} 