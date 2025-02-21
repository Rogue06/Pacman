import { Direction } from '../entities/Entity';

export class InputManager {
    private static instance: InputManager;
    private keyState: { [key: string]: boolean } = {};
    private currentDirection: Direction = Direction.NONE;
    private nextDirection: Direction = Direction.NONE;

    private constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        this.keyState[event.code] = true;
        this.updateDirection();
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keyState[event.code] = false;
    }

    private updateDirection(): void {
        if (this.keyState['ArrowUp']) {
            this.nextDirection = Direction.UP;
        } else if (this.keyState['ArrowDown']) {
            this.nextDirection = Direction.DOWN;
        } else if (this.keyState['ArrowLeft']) {
            this.nextDirection = Direction.LEFT;
        } else if (this.keyState['ArrowRight']) {
            this.nextDirection = Direction.RIGHT;
        }
    }

    public getCurrentDirection(): Direction {
        return this.currentDirection;
    }

    public getNextDirection(): Direction {
        return this.nextDirection;
    }

    public setCurrentDirection(direction: Direction): void {
        this.currentDirection = direction;
    }

    public clearNextDirection(): void {
        this.nextDirection = Direction.NONE;
    }
} 