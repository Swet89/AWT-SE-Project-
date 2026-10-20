import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private http: HttpClient) {}

  getStatus(): Observable<GameStatus> {
    return this.http.get<GameStatus>('/api/game/status');
  }

  submitScore(score: number): Observable<GameStatus> {
    return this.http.post<GameStatus>('/api/game/play', { score });
  }
}
