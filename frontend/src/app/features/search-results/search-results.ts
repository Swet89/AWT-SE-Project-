import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TravelService } from '../../core/services/travel';
import { TravelMode, TravelOption } from '../../core/models/api.models';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResults implements OnInit {
  private route = inject(ActivatedRoute);
  private travel = inject(TravelService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly results = signal<TravelOption[]>([]);
  readonly demoMode = signal(false);
  readonly mode = signal<TravelMode>('flights');
  readonly destination = signal('');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const mode = (params.get('mode') as TravelMode) || 'flights';
      const destination = params.get('destination') || '';
      this.mode.set(mode);
      this.destination.set(destination);

      if (!destination) {
        this.loading.set(false);
        this.error.set('Choose a destination from the homepage search bar to see results.');
        return;
      }

      this.loading.set(true);
      this.error.set(null);
      this.travel
        .search({
          mode,
          destination,
          origin: params.get('origin') ?? undefined,
          departDate: params.get('departDate') ?? undefined,
          returnDate: params.get('returnDate') ?? undefined,
          passengers: params.get('passengers') ? Number(params.get('passengers')) : undefined,
        })
        .subscribe({
          next: (res) => {
            this.results.set(res.results);
            this.demoMode.set(res.demoMode);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('The oracle is silent — the search failed. Please try again.');
            this.loading.set(false);
          },
        });
    });
  }
}
