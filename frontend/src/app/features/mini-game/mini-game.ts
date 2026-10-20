import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { GameService } from '../../core/services/game';
import { AuthService } from '../../core/services/auth';
import { GameStatus } from '../../core/models/api.models';

const TOTAL_ARROWS = 3;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 160;
const TRACK_MARGIN = 40;

@Component({
  selector: 'app-mini-game',
  standalone: true,
  templateUrl: './mini-game.html',
  styleUrl: './mini-game.scss',
})
export class MiniGame implements OnInit, AfterViewInit, OnDestroy {
  private gameService = inject(GameService);
  private auth = inject(AuthService);

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly loadingStatus = signal(true);
  readonly status = signal<GameStatus | null>(null);
  readonly arrowsShot = signal(0);
  readonly shotScores = signal<number[]>([]);
  readonly roundOver = signal(false);
  readonly submitting = signal(false);
  readonly result = signal<GameStatus | null>(null);

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private startTime = 0;
  private markerX = CANVAS_WIDTH / 2;

  ngOnInit(): void {
    this.gameService.getStatus().subscribe({
      next: (res) => {
        this.status.set(res);
        this.loadingStatus.set(false);
      },
      error: () => this.loadingStatus.set(false),
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    this.startTime = performance.now();
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  get arrowsLeft(): number {
    return TOTAL_ARROWS - this.arrowsShot();
  }

  get totalScore(): number {
    return this.shotScores().reduce((a, b) => a + b, 0);
  }

  shoot(): void {
    if (this.roundOver() || this.arrowsShot() >= TOTAL_ARROWS) return;
    const center = CANVAS_WIDTH / 2;
    const distance = Math.abs(this.markerX - center);
    const maxDistance = CANVAS_WIDTH / 2 - TRACK_MARGIN;
    const accuracy = Math.max(0, 1 - distance / maxDistance);
    const points = Math.round(accuracy * 100);

    this.shotScores.update((scores) => [...scores, points]);
    this.arrowsShot.update((n) => n + 1);

    if (this.arrowsShot() >= TOTAL_ARROWS) {
      this.finishRound();
    }
  }

  private finishRound(): void {
    this.roundOver.set(true);
    this.submitting.set(true);
    this.gameService.submitScore(this.totalScore).subscribe({
      next: (res) => {
        this.result.set(res);
        this.submitting.set(false);
        this.auth.patchUser({ gamePlayed: true });
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  private loop = (): void => {
    if (!this.ctx) return;
    const elapsed = (performance.now() - this.startTime) / 1000;
    const center = CANVAS_WIDTH / 2;
    const amplitude = CANVAS_WIDTH / 2 - TRACK_MARGIN;
    this.markerX = center + Math.sin(elapsed * 2.1) * amplitude;

    this.draw(this.ctx);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private draw(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerY = CANVAS_HEIGHT / 2;
    const center = CANVAS_WIDTH / 2;
    const outerR = CANVAS_WIDTH / 2 - TRACK_MARGIN;

    const rings: [number, string][] = [
      [outerR, '#3c2a1e'],
      [outerR * 0.72, '#a6432d'],
      [outerR * 0.46, '#b9862f'],
      [outerR * 0.22, '#d9a63f'],
    ];
    for (const [r, color] of rings) {
      ctx.beginPath();
      ctx.ellipse(center, centerY, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(this.markerX, centerY - 55);
    ctx.lineTo(this.markerX, centerY + 55);
    ctx.strokeStyle = '#f4ecd8';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
