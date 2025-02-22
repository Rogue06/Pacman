// Profiler pour Pac-Man
class GameProfiler {
  constructor() {
    this.metrics = {
      fps: [],
      frameTime: [],
      renderTime: [],
      updateTime: [],
      collisionChecks: [],
      memoryUsage: [],
    };
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.sampleInterval = 1000; // 1 seconde
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.collectMetrics();
  }

  stop() {
    this.isRunning = false;
    this.generateReport();
  }

  measureFrameTime(callback) {
    if (!this.isRunning) return callback();

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    this.metrics.frameTime.push(endTime - startTime);
  }

  measureRender(callback) {
    if (!this.isRunning) return callback();

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    this.metrics.renderTime.push(endTime - startTime);
  }

  measureUpdate(callback) {
    if (!this.isRunning) return callback();

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    this.metrics.updateTime.push(endTime - startTime);
  }

  recordCollisionCheck() {
    if (!this.isRunning) return;
    this.metrics.collisionChecks[this.frameCount] =
      (this.metrics.collisionChecks[this.frameCount] || 0) + 1;
  }

  collectMetrics() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= this.sampleInterval) {
      const fps = (this.frameCount * 1000) / (now - this.lastTime);
      this.metrics.fps.push(fps);

      // Mesure de l'utilisation mémoire
      if (window.performance && window.performance.memory) {
        this.metrics.memoryUsage.push(window.performance.memory.usedJSHeapSize);
      }

      this.frameCount = 0;
      this.lastTime = now;
    }

    requestAnimationFrame(() => this.collectMetrics());
  }

  generateReport() {
    const report = {
      fps: {
        average: this.average(this.metrics.fps),
        min: Math.min(...this.metrics.fps),
        max: Math.max(...this.metrics.fps),
      },
      frameTime: {
        average: this.average(this.metrics.frameTime),
        p95: this.percentile(this.metrics.frameTime, 95),
      },
      renderTime: {
        average: this.average(this.metrics.renderTime),
        p95: this.percentile(this.metrics.renderTime, 95),
      },
      updateTime: {
        average: this.average(this.metrics.updateTime),
        p95: this.percentile(this.metrics.updateTime, 95),
      },
      collisionChecks: {
        average: this.average(this.metrics.collisionChecks),
        max: Math.max(...this.metrics.collisionChecks),
      },
      memoryUsage: {
        average: this.average(this.metrics.memoryUsage),
        max: Math.max(...this.metrics.memoryUsage),
      },
    };

    console.table(report);
    this.generateVisualization(report);
    return report;
  }

  average(array) {
    return array.reduce((a, b) => a + b, 0) / array.length;
  }

  percentile(array, p) {
    const sorted = array.slice().sort((a, b) => a - b);
    const pos = ((sorted.length - 1) * p) / 100;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }

  generateVisualization(report) {
    // Création d'un canvas pour visualiser les métriques
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner le graphique FPS
    ctx.strokeStyle = "green";
    ctx.beginPath();
    this.metrics.fps.forEach((fps, i) => {
      const x = (i / this.metrics.fps.length) * canvas.width;
      const y = canvas.height - (fps / 60) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Ajouter les légendes
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`FPS Moyen: ${report.fps.average.toFixed(2)}`, 10, 20);
    ctx.fillText(
      `Temps de frame moyen: ${report.frameTime.average.toFixed(2)}ms`,
      10,
      40
    );
  }
}

// Exemple d'utilisation
const profiler = new GameProfiler();

// Wrapper pour la boucle de jeu
function gameLoopWithProfiling(timestamp) {
  profiler.measureFrameTime(() => {
    profiler.measureUpdate(() => {
      game.update(timestamp);
    });

    profiler.measureRender(() => {
      game.render();
    });
  });

  requestAnimationFrame(gameLoopWithProfiling);
}

// Commandes de contrôle du profilage
window.startProfiling = () => profiler.start();
window.stopProfiling = () => profiler.stop();

// Export pour utilisation dans d'autres modules
export { GameProfiler };
