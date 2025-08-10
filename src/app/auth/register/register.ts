import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './register.html',
    styleUrls: ['./register.scss']
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
    ) { }

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
