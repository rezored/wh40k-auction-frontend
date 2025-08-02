import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private userSignal = signal<any | null>(null);
    user = this.userSignal.asReadonly();

    constructor(private http: HttpClient) { }

    register(email: string, password: string, username: string) {
        return this.http.post('/api/auth/register', { email, password, username });
    }

    login(email: string, password: string) {
        return this.http.post<{ access_token: string, user: any }>('/api/auth/login', { email, password })
            .subscribe(res => {
                localStorage.setItem('token', res.access_token);
                this.userSignal.set(res.user);
            });
    }

    logout() {
        localStorage.removeItem('token');
        this.userSignal.set(null);
    }

    isLoggedIn() {
        return this.userSignal() !== null;
    }
}
