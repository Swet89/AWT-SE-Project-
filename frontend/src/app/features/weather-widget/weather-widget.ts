import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeatherService } from '../../core/services/weather';
import { WeatherData } from '../../core/models/api.models';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './weather-widget.html',
  styleUrl: './weather-widget.scss',
})
export class WeatherWidget {
  private weather = inject(WeatherService);

  city = 'Athens';
  readonly data = signal<WeatherData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.check();
  }

  glyphFor(description: string): string {
    const d = description.toLowerCase();
    if (d.includes('thunder') || d.includes('storm')) return '⚡';
    if (d.includes('snow')) return '❄';
    if (d.includes('rain') || d.includes('drizzle')) return '🌧';
    if (d.includes('cloud') || d.includes('mist') || d.includes('fog') || d.includes('haze')) return '☁';
    if (d.includes('wind')) return '💨';
    return '☀';
  }

  check(): void {
    const query = this.city.trim();
    if (!query) return;
    this.loading.set(true);
    this.error.set(null);
    this.weather.getWeather(query).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("The winds are unclear on that city's name — try another.");
        this.loading.set(false);
      },
    });
  }
}
