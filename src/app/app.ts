import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly title = signal('auction-frontend');

  // Temporary auth mock for development
  protected auth = {
    isLoggedIn: () => false,
    logout: () => console.log('Logout clicked')
  };
}

// Export for main files
export const App = AppComponent;
