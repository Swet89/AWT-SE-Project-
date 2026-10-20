import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, ItineraryPlan } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[]): Observable<{ reply: string; demoMode: boolean }> {
    return this.http.post<{ reply: string; demoMode: boolean }>('/api/chatbot/chat', { message, history });
  }

  planItinerary(payload: {
    destination: string;
    days: number;
    interests: string;
    startDate?: string;
  }): Observable<ItineraryPlan> {
    return this.http.post<ItineraryPlan>('/api/chatbot/itinerary', payload);
  }
}
