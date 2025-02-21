export abstract class Entity {
    protected x: number;
    protected y: number;
    protected width: number;
    protected height: number;
    protected speed: number;
    protected direction: Direction;

    constructor(x: number, y: number, width: number, height: number, speed: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = Direction.NONE;
    }

    public abstract update(deltaTime: number): void;
    public abstract render(ctx: CanvasRenderingContext2D): void;

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    public getBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

export enum Direction {
    NONE = 'NONE',
    UP = 'UP',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT'
} 