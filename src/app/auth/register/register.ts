import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card register-card">
            <div class="card-header text-center">
              <h3 class="mb-0">
                <i class="fas fa-user-plus me-2"></i>
                Register
              </h3>
              <p class="text-muted mb-0">Join WH40K Auction House</p>
            </div>
            <div class="card-body">
              <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
                <div class="mb-3">
                  <label class="form-label">Username</label>
                  <input type="text" 
                         class="form-control" 
                         [(ngModel)]="username" 
                         name="username"
                         required
                         placeholder="Enter your username">
                </div>
                
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
                         minlength="6"
                         placeholder="Enter your password">
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Confirm Password</label>
                  <input type="password" 
                         class="form-control" 
                         [(ngModel)]="confirmPassword" 
                         name="confirmPassword"
                         required
                         placeholder="Confirm your password">
                  <div class="text-danger small" *ngIf="passwordMismatch">
                    Passwords do not match
                  </div>
                </div>
                
                <div class="d-grid">
                  <button type="submit" 
                          class="btn btn-primary btn-lg" 
                          [disabled]="!registerForm.valid || loading || passwordMismatch">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i *ngIf="!loading" class="fas fa-user-plus me-2"></i>
                    {{ loading ? 'Creating account...' : 'Register' }}
                  </button>
                </div>
                
                <div class="text-center mt-3">
                  <p class="mb-0">Already have an account? 
                    <a routerLink="/login" class="text-decoration-none">Login here</a>
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
    .register-card {
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
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get passwordMismatch(): boolean {
    return this.password !== this.confirmPassword && this.confirmPassword !== '';
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.loading = true;
    this.authService.register(this.email, this.password, this.username).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
        alert('Registration successful! Please log in.');
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
      }
    });
  }
}
