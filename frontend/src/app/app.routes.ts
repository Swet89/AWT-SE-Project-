import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Odyssey Travel — Plan a journey worthy of an epic',
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search-results/search-results').then((m) => m.SearchResults),
    title: 'Odyssey Travel — Search results',
  },
  {
    path: 'game',
    loadComponent: () => import('./features/mini-game/mini-game').then((m) => m.MiniGame),
    canActivate: [authGuard],
    title: 'Odyssey Travel — Contest of the Bow',
  },
  {
    path: 'dev-team',
    loadComponent: () => import('./features/dev-team/dev-team').then((m) => m.DevTeam),
    title: 'Odyssey Travel — The Crew',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Odyssey Travel — Log in',
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup').then((m) => m.Signup),
    title: 'Odyssey Travel — Set sail',
  },
  { path: '**', redirectTo: '' },
];
