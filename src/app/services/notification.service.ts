import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService, UserAddress } from './auth.service';

export interface Notification {
    id: string;
    type: 'auction_won' | 'offer_accepted' | 'bid_outbid' | 'auction_ending' | 'general';
    title: string;
    message: string;
    auctionId?: string;
    offerId?: string;
    recipientId: string;
    senderId?: string;
    isRead: boolean;
    createdAt: string;
    metadata?: {
        winnerAddress?: UserAddress;
        finalPrice?: number;
        shippingInfo?: any;
    };
}

export interface CreateNotificationRequest {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    auctionId?: string;
    offerId?: string;
    metadata?: any;
}

export interface WinnerNotificationData {
    auctionId: string;
    winnerId: string;
    winnerAddress: UserAddress;
    finalPrice: number;
    auctionTitle: string;
    message?: string;
}

export interface OfferAcceptanceData {
    offerId: string;
    buyerId: string;
    buyerAddress: UserAddress;
    offerAmount: number;
    auctionTitle: string;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(
        private http: HttpClient,
        private configService: ConfigService,
        private authService: AuthService
    ) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        });
    }

    // Get user notifications
    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(
            `${this.configService.apiUrl}/notifications`,
            { headers: this.getAuthHeaders() }
        );
    }

    // Mark notification as read
    markAsRead(notificationId: string): Observable<any> {
        return this.http.put<any>(
            `${this.configService.apiUrl}/notifications/${notificationId}/read`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    // Mark all notifications as read
    markAllAsRead(): Observable<any> {
        return this.http.put<any>(
            `${this.configService.apiUrl}/notifications/mark-all-read`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    // Delete notification
    deleteNotification(notificationId: string): Observable<any> {
        return this.http.delete<any>(
            `${this.configService.apiUrl}/notifications/${notificationId}`,
            { headers: this.getAuthHeaders() }
        );
    }

    // Create notification
    createNotification(notificationData: CreateNotificationRequest): Observable<Notification> {
        return this.http.post<Notification>(
            `${this.configService.apiUrl}/notifications`,
            notificationData,
            { headers: this.getAuthHeaders() }
        );
    }

    // Send auction winner notification with address
    notifyAuctionWinner(data: WinnerNotificationData): Observable<any> {
        return this.http.post<any>(
            `${this.configService.apiUrl}/notifications/auction-winner`,
            {
                auctionId: data.auctionId,
                winnerId: data.winnerId,
                winnerAddress: data.winnerAddress,
                finalPrice: data.finalPrice,
                auctionTitle: data.auctionTitle,
                message: data.message
            },
            { headers: this.getAuthHeaders() }
        );
    }

    // Send offer acceptance notification with address
    notifyOfferAccepted(data: OfferAcceptanceData): Observable<any> {
        return this.http.post<any>(
            `${this.configService.apiUrl}/notifications/offer-accepted`,
            {
                offerId: data.offerId,
                buyerId: data.buyerId,
                buyerAddress: data.buyerAddress,
                offerAmount: data.offerAmount,
                auctionTitle: data.auctionTitle,
                message: data.message
            },
            { headers: this.getAuthHeaders() }
        );
    }

    // Get unread notification count
    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(
            `${this.configService.apiUrl}/notifications/unread-count`,
            { headers: this.getAuthHeaders() }
        );
    }

    // Get notification settings
    getNotificationSettings(): Observable<any> {
        return this.http.get<any>(
            `${this.configService.apiUrl}/notifications/settings`,
            { headers: this.getAuthHeaders() }
        );
    }

    // Update notification settings
    updateNotificationSettings(settings: any): Observable<any> {
        return this.http.put<any>(
            `${this.configService.apiUrl}/notifications/settings`,
            settings,
            { headers: this.getAuthHeaders() }
        );
    }

    // Send shipping address to auction owner (when bidder wins)
    sendShippingAddressToOwner(auctionId: string, ownerId: string, winnerAddress: UserAddress): Observable<any> {
        return this.http.post<any>(
            `${this.configService.apiUrl}/notifications/shipping-address`,
            {
                auctionId,
                ownerId,
                winnerAddress
            },
            { headers: this.getAuthHeaders() }
        );
    }

    // Send shipping address to offer buyer (when owner accepts offer)
    sendShippingAddressToBuyer(offerId: string, buyerId: string, ownerAddress: UserAddress): Observable<any> {
        return this.http.post<any>(
            `${this.configService.apiUrl}/notifications/offer-shipping-address`,
            {
                offerId,
                buyerId,
                ownerAddress
            },
            { headers: this.getAuthHeaders() }
        );
    }
}
