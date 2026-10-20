import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { SearchBar } from '../search-bar/search-bar';
import { HotSuggestions } from '../hot-suggestions/hot-suggestions';
import { WeatherWidget } from '../weather-widget/weather-widget';
import { MeanderDivider } from '../../shared/components/meander-divider/meander-divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchBar, HotSuggestions, WeatherWidget, MeanderDivider],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  @ViewChild('searchBar') searchBar?: SearchBar;
  @ViewChild('bgAudio') bgAudio?: ElementRef<HTMLAudioElement>;
  @ViewChild('bgVideo') bgVideo?: ElementRef<HTMLVideoElement>;

  readonly videoFailed = signal(false);
  readonly musicPlaying = signal(false);

  onVideoError(): void {
    this.videoFailed.set(true);
  }

  toggleMusic(): void {
    const audio = this.bgAudio?.nativeElement;
    if (!audio) return;
    if (this.musicPlaying()) {
      audio.pause();
      this.musicPlaying.set(false);
    } else {
      audio.play().then(
        () => this.musicPlaying.set(true),
        () => this.musicPlaying.set(false),
      );
    }
  }

  onDestinationPicked(destination: string): void {
    this.searchBar?.prefill(destination);
    document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
