// Mock pour le canvas et le contexte 2D
class MockCanvasRenderingContext2D {
    fillStyle: string = '';
    strokeStyle: string = '';
    lineWidth: number = 1;
    font: string = '';
    textAlign: string = 'left';

    beginPath() {}
    arc() {}
    fill() {}
    stroke() {}
    moveTo() {}
    lineTo() {}
    quadraticCurveTo() {}
    fillRect() {}
    strokeRect() {}
    fillText() {}
    save() {}
    restore() {}
    translate() {}
    rotate() {}
}

class MockCanvas {
    width: number = 448;
    height: number = 496;
    style: any = {};

    getContext(contextId: string): MockCanvasRenderingContext2D | null {
        return new MockCanvasRenderingContext2D();
    }
}

// Mock pour l'Audio
class MockAudio {
    src: string = '';
    currentTime: number = 0;
    volume: number = 1;
    loop: boolean = false;

    load() {}
    play() { return Promise.resolve(); }
    pause() {}
}

// Configuration globale pour Jest
global.HTMLCanvasElement = MockCanvas as any;
global.Audio = MockAudio as any;

// Mock pour localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock as any;

// Mock pour requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(() => callback(Date.now()), 1000 / 60);
};

// Mock pour les événements du DOM
class MockEvent {
    code: string;
    constructor(code: string) {
        this.code = code;
    }
}

global.KeyboardEvent = MockEvent as any; 