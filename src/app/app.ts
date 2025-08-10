import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { RouteTransitionService } from './services/route-transition.service';
import { NotificationService, Notification } from './services/notification.service';
import { environment } from '../environments/environment';
import { ToasterComponent } from './shared/toast/toaster.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToasterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  environment = environment;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotificationDropdown = false;
  notificationSubscription?: Subscription;
  unreadCountSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    public routeTransitionService: RouteTransitionService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    // Load notifications if user is logged in
    if (this.authService.loginStatus()) {
      this.loadNotifications();
      this.loadUnreadCount();
    }

    // Set up polling for new notifications (every 30 seconds)
    this.notificationSubscription = interval(30000).subscribe(() => {
      if (this.authService.loginStatus()) {
        this.loadUnreadCount();
      }
    });

    // Check login status periodically and load notifications when logged in
    const loginCheckInterval = interval(5000).subscribe(() => {
      const isLoggedIn = this.authService.loginStatus();
      if (isLoggedIn && this.notifications.length === 0) {
        this.loadNotifications();
        this.loadUnreadCount();
      } else if (!isLoggedIn) {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });

    // Store the subscription for cleanup
    this.notificationSubscription = loginCheckInterval;
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount = response.count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.loadNotifications(); // Refresh notifications when dropdown opens
    }
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
        this.loadUnreadCount(); // Refresh unread count

        // If notification has auction data, navigate to the auction
        if (notification?.data?.auctionId) {
          // Navigate to auction detail page
          this.router.navigate(['/auctions', notification.data.auctionId]);
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Update local state
        this.notifications.forEach(notification => {
          notification.isRead = true;
        });
        this.unreadCount = 0;
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown-container')) {
      this.showNotificationDropdown = false;
    }
  }

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
