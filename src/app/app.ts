import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouteTransitionService } from './services/route-transition.service';
import { environment } from '../environments/environment';
import { ToasterComponent } from './shared/toast/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToasterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  environment = environment;

  constructor(
    public authService: AuthService,
    public routeTransitionService: RouteTransitionService
  ) {}

  getTokenStatus(): string {
    return localStorage.getItem('token') ? 'Present' : 'Missing';
  }

  logout(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.authService.logout();
  }

  onUserClick() {
    // User dropdown clicked
  }

  checkAuthState() {
    // Debug method for checking auth state
  }
}
