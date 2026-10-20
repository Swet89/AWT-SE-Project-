import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../core/services/chatbot';
import { ChatMessage, ItineraryPlan } from '../../core/models/api.models';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.scss',
})
export class ChatbotWidget {
  private chatbot = inject(ChatbotService);

  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;

  readonly open = signal(false);
  readonly sending = signal(false);
  readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "I am your wayfinder. Ask me anything about your trip, or say 'plan my odyssey' and I'll draft a day-by-day itinerary.",
    },
  ]);
  readonly showPlanner = signal(false);
  readonly planning = signal(false);
  readonly plan = signal<ItineraryPlan | null>(null);

  draft = '';
  plannerDestination = '';
  plannerDays = 5;
  plannerInterests = '';

  toggle(): void {
    this.open.update((v) => !v);
  }

  send(): void {
    const message = this.draft.trim();
    if (!message || this.sending()) return;

    const history = this.messages();
    this.messages.set([...history, { role: 'user', content: message }]);
    this.draft = '';
    this.sending.set(true);
    this.scrollSoon();

    if (/plan my odyssey|plan.*itinerary|plan.*trip/i.test(message)) {
      this.showPlanner.set(true);
      this.sending.set(false);
      return;
    }

    this.chatbot.sendMessage(message, history).subscribe({
      next: (res) => {
        this.messages.update((m) => [...m, { role: 'assistant', content: res.reply }]);
        this.sending.set(false);
        this.scrollSoon();
      },
      error: () => {
        this.messages.update((m) => [
          ...m,
          { role: 'assistant', content: 'The signal fire went out — please try again in a moment.' },
        ]);
        this.sending.set(false);
        this.scrollSoon();
      },
    });
  }

  submitPlanner(): void {
    if (!this.plannerDestination.trim()) return;
    this.planning.set(true);
    this.chatbot
      .planItinerary({
        destination: this.plannerDestination,
        days: this.plannerDays,
        interests: this.plannerInterests,
      })
      .subscribe({
        next: (res) => {
          this.plan.set(res);
          this.planning.set(false);
          this.showPlanner.set(false);
          this.messages.update((m) => [
            ...m,
            { role: 'assistant', content: `Here's a ${res.days.length}-day plan for ${res.destination}. ${res.summary}` },
          ]);
          this.scrollSoon();
        },
        error: () => {
          this.planning.set(false);
          this.messages.update((m) => [
            ...m,
            { role: 'assistant', content: "I couldn't draft that itinerary — please try again." },
          ]);
        },
      });
  }

  private scrollSoon(): void {
    setTimeout(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 30);
  }
}
