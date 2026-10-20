import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MeanderDivider } from '../meander-divider/meander-divider';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MeanderDivider],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly year = new Date().getFullYear();
}
