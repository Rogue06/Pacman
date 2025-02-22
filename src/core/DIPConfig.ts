export interface DIPSettings {
    lives: number;           // Nombre de vies initial
    bonusLife: number;       // Score pour une vie bonus
    ghostSpeed: number;      // Vitesse des fantômes (0.8 à 1.2)
    pacmanSpeed: number;     // Vitesse de Pac-Man (0.8 à 1.2)
    frightTime: number;      // Durée du mode vulnérable en ms
    fruitScore: number;      // Multiplicateur de score des fruits
    difficulty: 'easy' | 'normal' | 'hard'; // Niveau de difficulté global
}

export class DIPConfig {
    private static instance: DIPConfig;
    private settings: DIPSettings;
    private readonly DEFAULT_SETTINGS: DIPSettings = {
        lives: 3,
        bonusLife: 10000,
        ghostSpeed: 1.0,
        pacmanSpeed: 1.0,
        frightTime: 6000,
        fruitScore: 1,
        difficulty: 'normal'
    };

    private constructor() {
        this.settings = this.loadSettings();
    }

    public static getInstance(): DIPConfig {
        if (!DIPConfig.instance) {
            DIPConfig.instance = new DIPConfig();
        }
        return DIPConfig.instance;
    }

    private loadSettings(): DIPSettings {
        const saved = localStorage.getItem('pacman-dip-settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Invalid DIP settings in localStorage');
            }
        }
        return { ...this.DEFAULT_SETTINGS };
    }

    public saveSettings(): void {
        localStorage.setItem('pacman-dip-settings', JSON.stringify(this.settings));
    }

    public getSettings(): DIPSettings {
        return { ...this.settings };
    }

    public updateSettings(newSettings: Partial<DIPSettings>): void {
        this.settings = {
            ...this.settings,
            ...this.validateSettings(newSettings)
        };
        this.saveSettings();
    }

    public resetToDefaults(): void {
        this.settings = { ...this.DEFAULT_SETTINGS };
        this.saveSettings();
    }

    private validateSettings(settings: Partial<DIPSettings>): Partial<DIPSettings> {
        const validated: Partial<DIPSettings> = {};

        if (settings.lives !== undefined) {
            validated.lives = Math.max(1, Math.min(5, settings.lives));
        }

        if (settings.bonusLife !== undefined) {
            validated.bonusLife = Math.max(5000, Math.min(20000, settings.bonusLife));
        }

        if (settings.ghostSpeed !== undefined) {
            validated.ghostSpeed = Math.max(0.8, Math.min(1.2, settings.ghostSpeed));
        }

        if (settings.pacmanSpeed !== undefined) {
            validated.pacmanSpeed = Math.max(0.8, Math.min(1.2, settings.pacmanSpeed));
        }

        if (settings.frightTime !== undefined) {
            validated.frightTime = Math.max(4000, Math.min(8000, settings.frightTime));
        }

        if (settings.fruitScore !== undefined) {
            validated.fruitScore = Math.max(0.5, Math.min(2.0, settings.fruitScore));
        }

        if (settings.difficulty !== undefined) {
            validated.difficulty = ['easy', 'normal', 'hard'].includes(settings.difficulty) 
                ? settings.difficulty 
                : 'normal';
        }

        return validated;
    }

    public getDifficultyMultiplier(): number {
        switch (this.settings.difficulty) {
            case 'easy': return 0.8;
            case 'hard': return 1.2;
            default: return 1.0;
        }
    }
} 