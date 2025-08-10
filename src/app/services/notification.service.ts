import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService, UserAddress } from './auth.service';

export interface Notification {
    id: string;
    userId: string;
    type: 'bid_placed' | 'bid_outbid' | 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'offer_expired' | 'auction_ended' | 'auction_won';
    title: string;
    message: string;
    data?: {
        auctionId?: string;
        auctionTitle?: string;
        bidAmount?: number;
        offerAmount?: number;
        bidderName?: string;
        offererName?: string;
        winnerAddress?: UserAddress;
        finalPrice?: number;
        shippingInfo?: any;
    };
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotificationRequest {
    type: 'bid_placed' | 'bid_outbid' | 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'offer_expired' | 'auction_ended' | 'auction_won';
    title: string;
    message: string;
    data?: {
        auctionId?: string;
        auctionTitle?: string;
        bidAmount?: number;
        offerAmount?: number;
        bidderName?: string;
        offererName?: string;
        winnerAddress?: UserAddress;
        finalPrice?: number;
        shippingInfo?: any;
    };
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
        return this.http.get<{ notifications: Notification[], unreadCount: number }>(
            `${this.configService.apiUrl}/notifications`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            switchMap(response => of(response.notifications))
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

    // Helper methods for specific notification types
    notifyBidPlaced(auctionOwnerId: string, auctionTitle: string, bidAmount: number, bidderName: string, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'bid_placed',
            title: 'New Bid Received',
            message: `${bidderName} placed a bid of €${bidAmount} on "${auctionTitle}"`,
            data: {
                auctionId,
                auctionTitle,
                bidAmount,
                bidderName
            }
        });
    }

    notifyBidOutbid(userId: string, auctionTitle: string, bidAmount: number, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'bid_outbid',
            title: 'You Have Been Outbid',
            message: `Someone outbid you on "${auctionTitle}"`,
            data: {
                auctionId,
                auctionTitle,
                bidAmount
            }
        });
    }

    notifyOfferReceived(auctionOwnerId: string, auctionTitle: string, offerAmount: number, offererName: string, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'offer_received',
            title: 'New Offer Received',
            message: `${offererName} made an offer of €${offerAmount} on "${auctionTitle}"`,
            data: {
                auctionId,
                auctionTitle,
                offerAmount,
                offererName
            }
        });
    }

    notifyOfferAccepted(offererId: string, auctionTitle: string, offerAmount: number, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'offer_accepted',
            title: 'Offer Accepted!',
            message: `Your offer of €${offerAmount} on "${auctionTitle}" was accepted!`,
            data: {
                auctionId,
                auctionTitle,
                offerAmount
            }
        });
    }

    notifyOfferRejected(offererId: string, auctionTitle: string, offerAmount: number, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'offer_rejected',
            title: 'Offer Rejected',
            message: `Your offer of €${offerAmount} on "${auctionTitle}" was not accepted.`,
            data: {
                auctionId,
                auctionTitle,
                offerAmount
            }
        });
    }

    notifyAuctionWon(winnerId: string, auctionTitle: string, finalPrice: number, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'auction_won',
            title: 'Congratulations! You Won!',
            message: `You won the auction "${auctionTitle}" for €${finalPrice}`,
            data: {
                auctionId,
                auctionTitle,
                finalPrice
            }
        });
    }

    notifyAuctionEnded(auctionOwnerId: string, auctionTitle: string, auctionId: string): Observable<Notification> {
        return this.createNotification({
            type: 'auction_ended',
            title: 'Auction Ended',
            message: `Your auction "${auctionTitle}" has ended`,
            data: {
                auctionId,
                auctionTitle
            }
        });
    }
}
