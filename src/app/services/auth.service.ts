import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, retry, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';

// User Profile Interfaces
export interface UserAddress {
    id?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
}

export interface UserProfile {
    id?: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addresses: UserAddress[];
    preferences?: {
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        currency?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfileRequest {
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferences?: {
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        currency?: string;
    };
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface AddAddressRequest {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
}

export interface UpdateAddressRequest {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private userSignal = signal<any | null>(null);
    private loginStatusSignal = signal<boolean>(false);
    private addressesSignal = signal<UserAddress[]>([]);
    user = this.userSignal.asReadonly();
    loginStatus = this.loginStatusSignal.asReadonly();
    addresses = this.addressesSignal.asReadonly();
    private validationRetryCount = 0;
    private maxRetries = 3;

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {
        this.checkExistingToken();
        // Schedule periodic token expiration checks
        this.scheduleTokenExpirationCheck();
    }

    private scheduleTokenExpirationCheck() {
        // Check token expiration every minute
        setInterval(() => {
            const token = this.getToken();
            if (token && this.isTokenExpired(token)) {
                this.logout();
            }
        }, 60000); // Check every minute
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (token && this.isTokenExpired(token)) {
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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

        return isExpired;
    }

    private checkExistingToken() {
        // Always check localStorage first for better persistence
        const token = localStorage.getItem('token');

        if (token) {
            // Check if token is expired
            if (this.isTokenExpired(token)) {
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

            // If no stored user, try to extract user info from JWT token
            const decodedToken = this.decodeJwtToken(token);
            const basicUser = {
                id: decodedToken?.sub || decodedToken?.user_id || decodedToken?.id || 'unknown',
                username: decodedToken?.username || decodedToken?.name || 'User',
                email: decodedToken?.email || 'user@example.com',
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

    // Profile Management Methods
    getProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.configService.apiUrl}/users/profile`, {
            headers: this.getAuthHeaders()
        });
    }

    updateProfile(profileData: UpdateProfileRequest): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.configService.apiUrl}/users/profile`, profileData, {
            headers: this.getAuthHeaders()
        }).pipe(
            switchMap(updatedProfile => {
                // Update local user data
                const currentUser = this.userSignal();
                if (currentUser) {
                    const updatedUser = { ...currentUser, ...updatedProfile };
                    this.userSignal.set(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return of(updatedProfile);
            })
        );
    }

    changePassword(passwordData: ChangePasswordRequest): Observable<any> {
        return this.http.post(`${this.configService.apiUrl}/users/change-password`, passwordData, {
            headers: this.getAuthHeaders()
        });
    }

    // Address Management Methods
    getAddresses(): Observable<UserAddress[]> {
        return this.http.get<UserAddress[]>(`${this.configService.apiUrl}/users/addresses`, {
            headers: this.getAuthHeaders()
        });
    }

    addAddress(addressData: AddAddressRequest): Observable<UserAddress> {
        return this.http.post<UserAddress>(`${this.configService.apiUrl}/users/addresses`, addressData, {
            headers: this.getAuthHeaders()
        }).pipe(
            switchMap(newAddress => {
                // Update local addresses
                const currentAddresses = this.addressesSignal();
                this.addressesSignal.set([...currentAddresses, newAddress]);
                return of(newAddress);
            })
        );
    }

    updateAddress(addressData: UpdateAddressRequest): Observable<UserAddress> {
        return this.http.put<UserAddress>(`${this.configService.apiUrl}/users/addresses/${addressData.id}`, addressData, {
            headers: this.getAuthHeaders()
        }).pipe(
            switchMap(updatedAddress => {
                // Update local addresses
                const currentAddresses = this.addressesSignal();
                const updatedAddresses = currentAddresses.map(addr =>
                    addr.id === updatedAddress.id ? updatedAddress : addr
                );
                this.addressesSignal.set(updatedAddresses);
                return of(updatedAddress);
            })
        );
    }

    deleteAddress(addressId: string): Observable<any> {
        return this.http.delete(`${this.configService.apiUrl}/users/addresses/${addressId}`, {
            headers: this.getAuthHeaders()
        }).pipe(
            switchMap(() => {
                // Update local addresses
                const currentAddresses = this.addressesSignal();
                const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);
                this.addressesSignal.set(updatedAddresses);
                return of({});
            })
        );
    }

    setDefaultAddress(addressId: string): Observable<any> {
        return this.http.post(`${this.configService.apiUrl}/users/addresses/${addressId}/set-default`, {}, {
            headers: this.getAuthHeaders()
        });
    }

    // Get winner address for auction notifications
    getWinnerAddress(userId: string): Observable<UserAddress> {
        return this.http.get<UserAddress>(`${this.configService.apiUrl}/users/${userId}/default-address`, {
            headers: this.getAuthHeaders()
        });
    }
}
