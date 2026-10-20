import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TravelSearchParams, TravelSearchResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TravelService {
  constructor(private http: HttpClient) {}

  search(params: TravelSearchParams): Observable<TravelSearchResponse> {
    let httpParams = new HttpParams()
      .set('mode', params.mode)
      .set('destination', params.destination);
    if (params.origin) httpParams = httpParams.set('origin', params.origin);
    if (params.departDate) httpParams = httpParams.set('departDate', params.departDate);
    if (params.returnDate) httpParams = httpParams.set('returnDate', params.returnDate);
    if (params.passengers) httpParams = httpParams.set('passengers', params.passengers);
    return this.http.get<TravelSearchResponse>('/api/travel/search', { params: httpParams });
  }
}
