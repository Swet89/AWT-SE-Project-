import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { SuggestionsService } from '../../core/services/suggestions';
import { PlaceSuggestion, TravelMode } from '../../core/models/api.models';

interface ModeOption {
  value: TravelMode;
  label: string;
  icon: string;
  needsOrigin: boolean;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  private router = inject(Router);
  private suggestions = inject(SuggestionsService);

  readonly modes: ModeOption[] = [
    { value: 'flights', label: 'Flights', icon: '✈', needsOrigin: true },
    { value: 'trains', label: 'Trains', icon: '🚆', needsOrigin: true },
    { value: 'buses', label: 'Buses', icon: '🚌', needsOrigin: true },
    { value: 'cruises', label: 'Cruises', icon: '⛴', needsOrigin: false },
    { value: 'hotels', label: 'Stays', icon: '🏛', needsOrigin: false },
  ];

  mode: TravelMode = 'flights';
  origin = '';
  destination = '';
  departDate = '';
  returnDate = '';
  passengers = 1;

  originResults: PlaceSuggestion[] = [];
  destinationResults: PlaceSuggestion[] = [];
  activeField: 'origin' | 'destination' | null = null;

  private originQuery$ = new Subject<string>();
  private destinationQuery$ = new Subject<string>();

  constructor() {
    this.originQuery$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((q) => (q.length > 1 ? this.suggestions.autocompletePlaces(q).pipe(catchError(() => of([]))) : of([]))),
      )
      .subscribe((results) => (this.originResults = results));

    this.destinationQuery$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((q) => (q.length > 1 ? this.suggestions.autocompletePlaces(q).pipe(catchError(() => of([]))) : of([]))),
      )
      .subscribe((results) => (this.destinationResults = results));
  }

  get activeMode(): ModeOption {
    return this.modes.find((m) => m.value === this.mode) ?? this.modes[0];
  }

  selectMode(mode: TravelMode): void {
    this.mode = mode;
  }

  onOriginInput(): void {
    this.activeField = 'origin';
    this.originQuery$.next(this.origin);
  }

  onDestinationInput(): void {
    this.activeField = 'destination';
    this.destinationQuery$.next(this.destination);
  }

  pickOrigin(place: PlaceSuggestion): void {
    this.origin = place.name;
    this.originResults = [];
    this.activeField = null;
  }

  pickDestination(place: PlaceSuggestion): void {
    this.destination = place.name;
    this.destinationResults = [];
    this.activeField = null;
  }

  prefill(destination: string): void {
    this.destination = destination;
  }

  submit(): void {
    if (!this.destination.trim()) return;
    this.router.navigate(['/search'], {
      queryParams: {
        mode: this.mode,
        origin: this.origin || undefined,
        destination: this.destination,
        departDate: this.departDate || undefined,
        returnDate: this.returnDate || undefined,
        passengers: this.passengers,
      },
    });
  }
}
