import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <mat-card>
      <h2>Login</h2>
      <form (ngSubmit)="onLogin()">
        <mat-form-field><input matInput [(ngModel)]="email" name="email" placeholder="Email"></mat-form-field>
        <mat-form-field><input matInput [(ngModel)]="password" name="password" placeholder="Password" type="password"></mat-form-field>
        <button mat-raised-button color="primary">Login</button>
      </form>
    </mat-card>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  email = '';
  password = '';

  onLogin() {
    this.auth.login(this.email, this.password);
  }
}
