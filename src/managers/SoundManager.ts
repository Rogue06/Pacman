export enum SoundEffect {
    WAKAWAKA = 'wakawaka',     // Son quand Pac-Man mange une pac-gomme
    DEATH = 'death',           // Son de mort de Pac-Man
    GHOST_EAT = 'ghost_eat',   // Son quand Pac-Man mange un fantôme
    POWER_PELLET = 'power_pellet', // Son quand Pac-Man mange une super pac-gomme
    GAME_START = 'game_start', // Son au début du jeu
    SIREN = 'siren',          // Son d'ambiance pendant le jeu
    CUTSCENE = 'cutscene',    // Musique des cutscenes
    EXTEND = 'extend',        // Son quand on gagne une vie
    FRUIT = 'fruit',          // Son quand on mange un fruit
    INTERMISSION = 'intermission' // Son de transition entre les niveaux
}

export class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundEffect, HTMLAudioElement>;
    private musicEnabled: boolean = true;
    private soundEnabled: boolean = true;
    private sirenLoop: HTMLAudioElement | null = null;

    private constructor() {
        this.sounds = new Map();
        this.initializeSounds();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private initializeSounds(): void {
        // Ces chemins seront à mettre à jour une fois que vous aurez les fichiers audio
        const soundPaths = {
            [SoundEffect.WAKAWAKA]: 'assets/sounds/wakawaka.mp3',
            [SoundEffect.DEATH]: 'assets/sounds/death.mp3',
            [SoundEffect.GHOST_EAT]: 'assets/sounds/ghost_eat.mp3',
            [SoundEffect.POWER_PELLET]: 'assets/sounds/power_pellet.mp3',
            [SoundEffect.GAME_START]: 'assets/sounds/game_start.mp3',
            [SoundEffect.SIREN]: 'assets/sounds/siren.mp3',
            [SoundEffect.CUTSCENE]: 'assets/sounds/cutscene.mp3',
            [SoundEffect.EXTEND]: 'assets/sounds/extend.mp3',
            [SoundEffect.FRUIT]: 'assets/sounds/fruit.mp3',
            [SoundEffect.INTERMISSION]: 'assets/sounds/intermission.mp3'
        };

        // Précharger tous les sons
        Object.entries(soundPaths).forEach(([effect, path]) => {
            const audio = new Audio();
            audio.src = path;
            audio.load(); // Précharge le son
            this.sounds.set(effect as SoundEffect, audio);

            // Configuration spéciale pour la sirène qui doit jouer en boucle
            if (effect === SoundEffect.SIREN) {
                audio.loop = true;
                this.sirenLoop = audio;
            }
        });
    }

    public playSound(effect: SoundEffect): void {
        if (!this.soundEnabled && effect !== SoundEffect.SIREN) return;
        if (!this.musicEnabled && effect === SoundEffect.SIREN) return;

        const sound = this.sounds.get(effect);
        if (sound) {
            // Pour les effets courts, on les rejoue depuis le début
            if (effect !== SoundEffect.SIREN) {
                sound.currentTime = 0;
            }
            sound.play().catch(error => {
                console.warn(`Erreur lors de la lecture du son ${effect}:`, error);
            });
        }
    }

    public stopSound(effect: SoundEffect): void {
        const sound = this.sounds.get(effect);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    public startSiren(): void {
        if (this.musicEnabled && this.sirenLoop) {
            this.sirenLoop.play().catch(error => {
                console.warn('Erreur lors du démarrage de la sirène:', error);
            });
        }
    }

    public stopSiren(): void {
        if (this.sirenLoop) {
            this.sirenLoop.pause();
            this.sirenLoop.currentTime = 0;
        }
    }

    public toggleMusic(): void {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopSiren();
        } else if (this.sirenLoop) {
            this.startSiren();
        }
    }

    public toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
    }

    public isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    public isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    // Méthode pour ajuster le volume des effets sonores
    public setEffectsVolume(volume: number): void {
        this.sounds.forEach((sound, effect) => {
            if (effect !== SoundEffect.SIREN) {
                sound.volume = Math.max(0, Math.min(1, volume));
            }
        });
    }

    // Méthode pour ajuster le volume de la musique
    public setMusicVolume(volume: number): void {
        if (this.sirenLoop) {
            this.sirenLoop.volume = Math.max(0, Math.min(1, volume));
        }
    }
} 