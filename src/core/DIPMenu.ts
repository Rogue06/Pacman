import { DIPConfig, DIPSettings } from './DIPConfig';

export class DIPMenu {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dipConfig: DIPConfig;
    private selectedOption: number = 0;
    private isVisible: boolean = false;
    private readonly OPTIONS = [
        { name: 'LIVES', min: 1, max: 5, step: 1 },
        { name: 'BONUS LIFE', min: 5000, max: 20000, step: 5000 },
        { name: 'GHOST SPEED', min: 0.8, max: 1.2, step: 0.1 },
        { name: 'PACMAN SPEED', min: 0.8, max: 1.2, step: 0.1 },
        { name: 'FRIGHT TIME', min: 4000, max: 8000, step: 1000 },
        { name: 'FRUIT SCORE', min: 0.5, max: 2.0, step: 0.5 },
        { name: 'DIFFICULTY', values: ['EASY', 'NORMAL', 'HARD'] }
    ];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.dipConfig = DIPConfig.getInstance();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (event) => {
            if (!this.isVisible) return;

            switch (event.code) {
                case 'ArrowUp':
                    this.selectedOption = (this.selectedOption - 1 + this.OPTIONS.length) % this.OPTIONS.length;
                    break;
                case 'ArrowDown':
                    this.selectedOption = (this.selectedOption + 1) % this.OPTIONS.length;
                    break;
                case 'ArrowLeft':
                    this.decreaseValue();
                    break;
                case 'ArrowRight':
                    this.increaseValue();
                    break;
                case 'KeyR':
                    this.dipConfig.resetToDefaults();
                    break;
                case 'Escape':
                    this.hide();
                    break;
            }
        });
    }

    public show(): void {
        this.isVisible = true;
        this.selectedOption = 0;
    }

    public hide(): void {
        this.isVisible = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }

    private increaseValue(): void {
        const option = this.OPTIONS[this.selectedOption];
        const settings = this.dipConfig.getSettings();
        const key = option.name.toLowerCase().replace(' ', '') as keyof DIPSettings;

        if ('values' in option) {
            const values = option.values!;
            const currentIndex = values.indexOf(settings[key].toString().toUpperCase());
            const newValue = values[(currentIndex + 1) % values.length].toLowerCase();
            this.dipConfig.updateSettings({ [key]: newValue });
        } else {
            const currentValue = settings[key] as number;
            const newValue = Math.min(option.max, currentValue + option.step);
            this.dipConfig.updateSettings({ [key]: newValue });
        }
    }

    private decreaseValue(): void {
        const option = this.OPTIONS[this.selectedOption];
        const settings = this.dipConfig.getSettings();
        const key = option.name.toLowerCase().replace(' ', '') as keyof DIPSettings;

        if ('values' in option) {
            const values = option.values!;
            const currentIndex = values.indexOf(settings[key].toString().toUpperCase());
            const newValue = values[(currentIndex - 1 + values.length) % values.length].toLowerCase();
            this.dipConfig.updateSettings({ [key]: newValue });
        } else {
            const currentValue = settings[key] as number;
            const newValue = Math.max(option.min, currentValue - option.step);
            this.dipConfig.updateSettings({ [key]: newValue });
        }
    }

    public render(): void {
        if (!this.isVisible) return;

        // Fond semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Titre
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DIP SWITCH SETTINGS', this.canvas.width / 2, 50);

        // Instructions
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('↑↓: Select   ←→: Adjust   R: Reset   ESC: Close', this.canvas.width / 2, 80);

        // Options
        const settings = this.dipConfig.getSettings();
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';

        this.OPTIONS.forEach((option, index) => {
            const y = 120 + index * 40;
            const key = option.name.toLowerCase().replace(' ', '') as keyof DIPSettings;
            const value = settings[key];

            // Highlight sélection
            if (index === this.selectedOption) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                this.ctx.fillRect(50, y - 20, this.canvas.width - 100, 30);
            }

            // Nom de l'option
            this.ctx.fillStyle = index === this.selectedOption ? 'yellow' : 'white';
            this.ctx.fillText(option.name, 60, y);

            // Valeur
            this.ctx.textAlign = 'right';
            this.ctx.fillText(value.toString().toUpperCase(), this.canvas.width - 60, y);
            this.ctx.textAlign = 'left';
        });
    }
} 