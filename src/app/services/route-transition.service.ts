import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RouteTransitionService {
    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.isLoadingSubject.asObservable();

    constructor(private router: Router) {
        this.setupRouterEvents();
    }

    private setupRouterEvents() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                this.isLoadingSubject.next(true);
            }

            if (event instanceof NavigationEnd ||
                event instanceof NavigationCancel ||
                event instanceof NavigationError) {
                // Shorter delay for better UX
                setTimeout(() => {
                    this.isLoadingSubject.next(false);
                }, 50);
            }
        });
    }

    showLoading() {
        this.isLoadingSubject.next(true);
    }

    hideLoading() {
        this.isLoadingSubject.next(false);
    }
} 