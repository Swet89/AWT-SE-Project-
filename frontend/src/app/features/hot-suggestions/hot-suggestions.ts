import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { SuggestionsService } from '../../core/services/suggestions';
import { HotSuggestion } from '../../core/models/api.models';

@Component({
  selector: 'app-hot-suggestions',
  standalone: true,
  templateUrl: './hot-suggestions.html',
  styleUrl: './hot-suggestions.scss',
})
export class HotSuggestions implements OnInit {
  private suggestions = inject(SuggestionsService);

  readonly items = signal<HotSuggestion[]>([]);
  readonly loading = signal(true);

  @Output() destinationPicked = new EventEmitter<string>();

  ngOnInit(): void {
    this.suggestions.getHotSuggestions().subscribe({
      next: (res) => {
        this.items.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pick(item: HotSuggestion): void {
    this.destinationPicked.emit(item.title);
  }
}
