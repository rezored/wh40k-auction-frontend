import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card login-card">
            <div class="card-header text-center">
              <h3 class="mb-0">
                <i class="fas fa-sign-in-alt me-2"></i>
                Login
              </h3>
              <p class="text-muted mb-0">Welcome to WH40K Auction House</p>
            </div>
            <div class="card-body">
              <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" 
                         class="form-control" 
                         [(ngModel)]="email" 
                         name="email"
                         required
                         placeholder="Enter your email">
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" 
                         class="form-control" 
                         [(ngModel)]="password" 
                         name="password"
                         required
                         placeholder="Enter your password">
                </div>
                
                <div class="d-grid">
                  <button type="submit" 
                          class="btn btn-primary btn-lg" 
                          [disabled]="!loginForm.valid || loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i *ngIf="!loading" class="fas fa-sign-in-alt me-2"></i>
                    {{ loading ? 'Logging in...' : 'Login' }}
                  </button>
                </div>
                
                <div class="text-center mt-3">
                  <p class="mb-0">Don't have an account? 
                    <a routerLink="/register" class="text-decoration-none">Register here</a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-card {
      margin-top: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border: none;
    }
    
    .card-header {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white;
      border-bottom: none;
      padding: 2rem 1.5rem;
    }
    
    .form-control:focus {
      border-color: #1a1a2e;
      box-shadow: 0 0 0 0.2rem rgba(26, 26, 46, 0.25);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: none;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #16213e, #0f3460);
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auctions']);
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
      }
    });
  }
}
