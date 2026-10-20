import { Component } from '@angular/core';

interface Crew {
  name: string;
  role: string;
  epithet: string;
  initials: string;
}

@Component({
  selector: 'app-dev-team',
  standalone: true,
  templateUrl: './dev-team.html',
  styleUrl: './dev-team.scss',
})
export class DevTeam {
  // Replace with your real team. Kept data-driven so it's a one-file edit.
  readonly crew: Crew[] = [
    { name: 'Your Name', role: 'Full-Stack Lead', epithet: 'Sacker of Bugs', initials: 'YN' },
    { name: 'Teammate Two', role: 'Frontend Engineer', epithet: 'Weaver of Views', initials: 'T2' },
    { name: 'Teammate Three', role: 'Backend Engineer', epithet: 'Keeper of the API', initials: 'T3' },
    { name: 'Teammate Four', role: 'Designer', epithet: 'Painter of Pottery', initials: 'T4' },
  ];
}
