import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouteTransitionService } from './services/route-transition.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    public routeTransitionService: RouteTransitionService
  ) {
    this.testApiConnection();
  }

  testApiConnection() {
    console.log('Testing API connection...');
    this.authService.testApiConnection().subscribe({
      next: (result) => {
        console.log('API connection test result:', result);
      },
      error: (error) => {
        console.error('API connection test error:', error);
      }
    });
  }

  getTokenStatus(): string {
    return localStorage.getItem('token') ? 'Present' : 'Missing';
  }

  logout(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Logout method called - User clicked logout button');
    this.authService.logout();
  }

  onUserClick() {
    console.log('User dropdown clicked - this should not trigger logout');
  }

  checkAuthState() {
    console.log('=== Auth State Debug ===');
    console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('AuthService isLoggedIn():', this.authService.isLoggedIn());
    console.log('AuthService isUserLoggedIn():', this.authService.isUserLoggedIn());
    console.log('AuthService user():', this.authService.user());
    console.log('Debug bar shows logged in:', this.authService.isUserLoggedIn());
  }
}
