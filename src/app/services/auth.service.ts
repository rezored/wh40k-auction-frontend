import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private userSignal = signal<any | null>(null);
    user = this.userSignal.asReadonly();

    constructor(private http: HttpClient) { }

    register(email: string, password: string, username: string): Observable<any> {
        return this.http.post('/api/auth/register', { email, password, username });
    }

    login(email: string, password: string): Observable<{ access_token: string, user: any }> {
        return this.http.post<{ access_token: string, user: any }>('http://localhost:3000/api/v1/auth/login', { email, password });
    }

    logout() {
        localStorage.removeItem('token');
        this.userSignal.set(null);
    }

    isLoggedIn() {
        return this.userSignal() !== null;
    }
}
