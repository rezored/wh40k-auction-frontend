import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, retry, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private userSignal = signal<any | null>(null);
    private loginStatusSignal = signal<boolean>(false);
    user = this.userSignal.asReadonly();
    loginStatus = this.loginStatusSignal.asReadonly();
    private validationRetryCount = 0;
    private maxRetries = 3;

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {
        this.checkExistingToken();
        // Schedule periodic token expiration checks
        this.scheduleTokenExpirationCheck();
        // Make service available globally for debugging
        (window as any).authService = this;
    }

    private scheduleTokenExpirationCheck() {
        // Check token expiration every minute
        setInterval(() => {
            const token = this.getToken();
            if (token && this.isTokenExpired(token)) {
                console.log('Token expired during periodic check, logging out...');
                this.logout();
            }
        }, 60000); // Check every minute
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token && this.isTokenExpired(token)) {
            console.log('Token is expired in getAuthHeaders, clearing...');
            this.clearToken();
            this.userSignal.set(null);
            return new HttpHeaders({
                'Content-Type': 'application/json'
            });
        }
        
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        });
    }

    private decodeJwtToken(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return null;
        }
    }

    private isTokenExpired(token: string): boolean {
        const decoded = this.decodeJwtToken(token);
        if (!decoded || !decoded.exp) {
            return true; // If we can't decode or no expiration, consider it expired
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = decoded.exp < currentTime;
        
        if (isExpired) {
            console.log('Token expired at:', new Date(decoded.exp * 1000));
            console.log('Current time:', new Date());
        }
        
        return isExpired;
    }

    private checkExistingToken() {
        // Always check localStorage first for better persistence
        const token = localStorage.getItem('token');
        
        if (token) {
            // Check if token is expired
            if (this.isTokenExpired(token)) {
                console.log('Stored token is expired, clearing...');
                this.clearToken();
                this.userSignal.set(null);
                this.loginStatusSignal.set(false);
                return;
            }
            
            this.validateTokenLocally(token);
            return;
        }
        
        // No token found, ensure login status is false
        this.loginStatusSignal.set(false);
    }

    private validateTokenLocally(token: string) {
        // Check if token is expired first
        if (this.isTokenExpired(token)) {
            console.log('Token is expired, clearing...');
            this.clearToken();
            this.userSignal.set(null);
            this.loginStatusSignal.set(false);
            return;
        }
        
        // Simple local validation - check if token exists and has valid format
        if (token && token.length > 10) {
            // Try to get user data from localStorage if available
            const storedUser = localStorage.getItem('user');
            
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    this.userSignal.set(user);
                    this.loginStatusSignal.set(true);
                    return;
                } catch (error) {
                    // Failed to parse stored user data
                }
            }
            
            // If no stored user, create a basic user object
            const basicUser = {
                id: 'unknown',
                username: 'User',
                email: 'user@example.com',
                token: 'valid'
            };
            this.userSignal.set(basicUser);
            this.loginStatusSignal.set(true);
        } else {
            this.clearToken();
            this.userSignal.set(null);
            this.loginStatusSignal.set(false);
        }
    }

    private storeToken(token: string, rememberMe: boolean = true) {
        // Always use localStorage for better persistence
        localStorage.setItem('token', token);
        // Also store in sessionStorage as backup
        sessionStorage.setItem('token', token);
        
        // Store remember me preference
        localStorage.setItem('rememberMe', rememberMe.toString());
    }

    private clearToken() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('user'); // Also clear stored user data
        this.loginStatusSignal.set(false);
    }

    testApiConnection(): Observable<any> {
        return this.http.get(`${this.configService.apiUrl}/health`).pipe(
            catchError((error) => {
                return of({ error: 'Backend not available' });
            })
        );
    }

    register(email: string, password: string, username: string): Observable<any> {
        return this.http.post(this.configService.authEndpoints.register, { email, password, username });
    }

    login(email: string, password: string): Observable<{ access_token: string, user: any }> {
        return this.http.post<{ access_token: string, user: any }>(this.configService.authEndpoints.login, { email, password });
    }

    setUserData(token: string, user: any, rememberMe: boolean = true) {
        this.storeToken(token, rememberMe);
        
        // Also store user data in localStorage for restoration
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
        
        this.userSignal.set(user);
        this.loginStatusSignal.set(true);
    }

    logout() {
        this.clearToken();
        this.userSignal.set(null);
        this.loginStatusSignal.set(false);
    }

    isLoggedIn() {
        const user = this.userSignal();
        
        // Add comprehensive null/undefined checks
        if (user === null || user === undefined) {
            return false;
        }
        
        // Check if user has a token property and it's not 'validating'
        const loggedIn = user && typeof user === 'object' && user.token !== 'validating';
        
        // Don't check token expiration here to avoid change detection issues
        // Token expiration is handled in isUserLoggedIn() which is called from templates
        return loggedIn;
    }

    // Safer method to check if user is logged in (for template use)
    isUserLoggedIn(): boolean {
        try {
            // Get the current token
            const token = this.getToken();
            
            // If no token, definitely not logged in
            if (!token) {
                return false;
            }
            
            // Check for token expiration
            if (this.isTokenExpired(token)) {
                console.log('Token is expired in isUserLoggedIn, clearing...');
                this.clearToken();
                this.userSignal.set(null);
                return false;
            }
            
            // Ensure user state is restored if we have a valid token but no user
            const currentUser = this.userSignal();
            if (!currentUser) {
                this.validateTokenLocally(token);
            }
            
            // Final check - return true only if we have both a valid token and user
            return this.isLoggedIn();
        } catch (error) {
            console.error('Error in isUserLoggedIn:', error);
            return false;
        }
    }

    // Method to ensure user state is always restored
    private ensureUserState() {
        const currentUser = this.userSignal();
        const token = this.getToken();
        
        // If we have a token but no user, restore the user state
        if (token && !currentUser) {
            this.validateTokenLocally(token);
        }
    }

    getToken(): string | null {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    // Method to manually refresh token validation
    refreshTokenValidation() {
        const token = this.getToken();
        if (token) {
            this.validationRetryCount = 0;
            this.validateTokenLocally(token);
        }
    }

    // Method to check if we have a stored token (even if not validated)
    hasStoredToken(): boolean {
        return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    }

    // Debug method to check token status
    debugTokenStatus() {
        const localStorageToken = localStorage.getItem('token');
        const sessionStorageToken = sessionStorage.getItem('token');
        const user = this.userSignal();
        
        return {
            localStorageToken: !!localStorageToken,
            sessionStorageToken: !!sessionStorageToken,
            userState: user,
            apiUrl: this.configService.apiUrl
        };
    }

    // Test method that can be called from browser console
    testTokenValidation() {
        const token = this.getToken();
        if (!token) {
            return;
        }

        this.validateTokenLocally(token);
    }

    // Public method to manually trigger token validation (for debugging)
    manualTokenValidation() {
        this.checkExistingToken();
    }

    // Public method to manually restore user state (for debugging)
    restoreUserState() {
        this.ensureUserState();
        return this.userSignal();
    }
}
