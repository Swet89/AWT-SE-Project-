import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HotSuggestion, PlaceSuggestion } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SuggestionsService {
  constructor(private http: HttpClient) {}

  getHotSuggestions(): Observable<HotSuggestion[]> {
    return this.http.get<HotSuggestion[]>('/api/suggestions');
  }

  autocompletePlaces(query: string): Observable<PlaceSuggestion[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<PlaceSuggestion[]>('/api/suggestions/places', { params });
  }
}
