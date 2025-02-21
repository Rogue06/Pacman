# Pac-Man TypeScript

Une réplique fidèle du jeu Pac-Man classique, développée en TypeScript.

## Structure du Projet

Le projet est organisé de la manière suivante :

```
pacman/
├── src/
│   ├── core/
│   │   └── Game.ts
│   ├── entities/
│   │   ├── Entity.ts
│   │   ├── Ghost.ts
│   │   ├── Maze.ts
│   │   ├── Pacman.ts
│   │   └── ghosts/
│   │       ├── Blinky.ts
│   │       ├── Pinky.ts
│   │       ├── Inky.ts
│   │       └── Clyde.ts
│   ├── managers/
│   │   ├── InputManager.ts
│   │   └── SoundManager.ts
│   └── index.ts
├── dist/
│   ├── assets/
│   │   └── sounds/
│   │       ├── wakawaka.mp3    # Son de Pac-Man mangeant une pac-gomme
│   │       ├── death.mp3       # Son de mort de Pac-Man
│   │       ├── ghost_eat.mp3   # Son de Pac-Man mangeant un fantôme
│   │       ├── power_pellet.mp3# Son de super pac-gomme
│   │       ├── game_start.mp3  # Son de début de partie
│   │       └── siren.mp3       # Son d'ambiance en boucle
│   ├── index.html
│   └── bundle.js
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Installation

1. Clonez le dépôt :

```bash
git clone https://github.com/Rogue06/Pacman.git
cd pacman
```

2. Installez les dépendances :

```bash
npm install
```

3. Ajoutez les fichiers audio :

   - Créez le dossier `dist/assets/sounds/` s'il n'existe pas
   - Ajoutez les fichiers audio suivants dans ce dossier :
     - `wakawaka.mp3` : Son de Pac-Man mangeant une pac-gomme
     - `death.mp3` : Son de mort de Pac-Man
     - `ghost_eat.mp3` : Son de Pac-Man mangeant un fantôme
     - `power_pellet.mp3` : Son de super pac-gomme
     - `game_start.mp3` : Son de début de partie
     - `siren.mp3` : Son d'ambiance en boucle

4. Lancez le serveur de développement :

```bash
npm start
```

5. Ouvrez votre navigateur à l'adresse : `http://localhost:9001`

## Contrôles

- Flèches directionnelles : Déplacer Pac-Man
- M : Activer/Désactiver la musique
- S : Activer/Désactiver les effets sonores

## Fonctionnalités

- Gameplay classique de Pac-Man
- 4 fantômes avec leurs comportements uniques :
  - Blinky (Rouge) : Poursuit directement Pac-Man
  - Pinky (Rose) : Tente d'embusquer Pac-Man
  - Inky (Bleu) : Utilise la position de Blinky pour calculer sa cible
  - Clyde (Orange) : Alterne entre poursuite et fuite
- Système de score
- Effets sonores et musique
- Animation fluide
- Mode vulnérable des fantômes (à venir)

## Développement

Pour construire le projet :

```bash
npm run build
```

## Notes sur les Fichiers Audio

Les fichiers audio doivent être au format MP3 et respecter les caractéristiques suivantes :

1. `wakawaka.mp3` :

   - Durée : ~100ms
   - Son court et distinct

2. `death.mp3` :

   - Durée : ~1.5s
   - Son descendant caractéristique

3. `ghost_eat.mp3` :

   - Durée : ~500ms
   - Son ascendant

4. `power_pellet.mp3` :

   - Durée : ~200ms
   - Son distinct pour la super pac-gomme

5. `game_start.mp3` :

   - Durée : ~2s
   - Mélodie de début de partie

6. `siren.mp3` :
   - Durée : ~5s
   - Son en boucle pour l'ambiance
   - Doit pouvoir être joué en boucle sans discontinuité audible
