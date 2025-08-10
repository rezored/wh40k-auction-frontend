import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction, Bid, Offer, CreateOfferRequest } from '../../services/auction.service';
import { AuthService, UserAddress } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-auction-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './auction-detail.component.html',
    styleUrls: ['./auction-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
    auction: Auction | null = null;
    loading = true;
    bidAmount: number = 0;
    offerAmount: number = 0;
    offerMessage: string = '';

    // Winner notification properties
    showWinnerNotification = false;
    winnerAddress: UserAddress | null = null;
    notificationMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auctionService: AuctionService,
        public authService: AuthService,
        public currencyService: CurrencyService,
        private toastService: ToastService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Ensure user state is restored
        this.authService.restoreUserState();

        // Debug user state
        console.log('Auth service debug status:', this.authService.debugTokenStatus());

        // Load user addresses if logged in
        if (this.authService.isUserLoggedIn()) {
            this.loadUserAddresses();
        }

        const auctionId = this.route.snapshot.paramMap.get('id');
        if (auctionId) {
            this.loadAuction(auctionId);
        }
    }

    ngOnDestroy(): void {
        // Cleanup if needed
    }

    loadAuction(id: string) {
        this.loading = true;
        this.cdr.detectChanges();

        this.auctionService.getAuction(id).subscribe({
            next: (auction) => {
                this.auction = auction;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading auction:', error);
                this.loading = false;
            }
        });
    }

    loadUserAddresses() {
        this.authService.getAddresses().subscribe({
            next: (addresses) => {
                // Addresses are automatically updated in the signal
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading addresses:', error);
            }
        });
    }

    placeBid() {
        if (!this.auction || !this.bidAmount) return;

        this.auctionService.placeBid(this.auction.id, this.bidAmount).subscribe({
            next: (bid) => {
                // Refresh the auction data from the server to get the updated state
                this.loadAuction(this.auction!.id);
                this.bidAmount = 0;
                this.toastService.success('Bid placed successfully!');
            },
            error: (error) => {
                console.error('Error placing bid:', error);
                this.toastService.error('Failed to place bid. Please try again.');
            }
        });
    }

    makeOffer() {
        if (!this.auction || !this.offerAmount) return;

        const offer: CreateOfferRequest = {
            amount: this.offerAmount,
            message: this.offerMessage
        };

        this.auctionService.makeOffer(this.auction.id, offer).subscribe({
            next: (offer) => {
                this.toastService.success('Offer submitted successfully! The seller will review your offer.');
                this.offerAmount = 0;
                this.offerMessage = '';
                this.loadAuction(this.auction!.id);
            },
            error: (error) => {
                console.error('Error making offer:', error);
                this.toastService.error('Failed to submit offer. Please try again.');
            }
        });
    }

    // Winner notification methods
    showWinnerNotificationForm() {
        this.showWinnerNotification = true;
        this.cdr.detectChanges();
    }

    hideWinnerNotificationForm() {
        this.showWinnerNotification = false;
        this.winnerAddress = null;
        this.notificationMessage = '';
        this.cdr.detectChanges();
    }

    async notifyWinner() {
        if (!this.auction || !this.winnerAddress) return;

        try {
            // Get the winning bid to find the winner
            const winningBid = this.auction.bids.reduce((prev, current) =>
                (prev.amount > current.amount) ? prev : current
            );

            if (!winningBid.bidder) {
                this.toastService.error('No winning bidder found');
                return;
            }

            // Send winner notification with address
            await this.notificationService.notifyAuctionWinner({
                auctionId: this.auction.id,
                winnerId: winningBid.bidder.id,
                winnerAddress: this.winnerAddress,
                finalPrice: winningBid.amount,
                auctionTitle: this.auction.title,
                message: this.notificationMessage
            }).toPromise();

            this.toastService.success('Winner notified successfully with shipping address!');
            this.hideWinnerNotificationForm();
        } catch (error) {
            console.error('Error notifying winner:', error);
            this.toastService.error('Failed to notify winner');
        }
    }

    async acceptOfferWithAddress(offer: Offer) {
        if (!this.auction || !offer.buyer) return;

        try {
            // Get buyer's default address
            const buyerAddress = await this.authService.getWinnerAddress(offer.buyer.id).toPromise();

            if (!buyerAddress) {
                this.toastService.error('Buyer has no shipping address configured');
                return;
            }

            // Accept the offer and send address notification
            await this.notificationService.notifyOfferAccepted({
                offerId: offer.id,
                buyerId: offer.buyer.id,
                buyerAddress: buyerAddress,
                offerAmount: offer.amount,
                auctionTitle: this.auction.title,
                message: this.notificationMessage
            }).toPromise();

            this.toastService.success('Offer accepted and buyer notified with your address!');
            this.loadAuction(this.auction.id);
        } catch (error) {
            console.error('Error accepting offer:', error);
            this.toastService.error('Failed to accept offer');
        }
    }

    // Check if auction has ended and has a winner
    hasWinner(): boolean {
        return this.auction?.status === 'ended' &&
            this.auction.bids &&
            this.auction.bids.length > 0;
    }

    // Get winning bid
    getWinningBid(): Bid | null {
        if (!this.auction?.bids || this.auction.bids.length === 0) {
            return null;
        }
        return this.auction.bids.reduce((prev, current) =>
            (prev.amount > current.amount) ? prev : current
        );
    }

    // Check if current user is the winner
    isWinner(): boolean {
        const winningBid = this.getWinningBid();
        const currentUser = this.authService.user();
        return winningBid?.bidder?.id === currentUser?.id;
    }

    canBid(): boolean {
        try {
            return this.authService.isUserLoggedIn() &&
                this.auction?.status === 'active' &&
                this.auction?.owner?.id !== this.authService.user()?.id;
        } catch (error) {
            console.warn('Error checking if user can bid:', error);
            return false;
        }
    }

    isAuctionOwner(): boolean {
        try {
            const currentUser = this.authService.user();
            const auctionOwner = this.auction?.owner;
            // Check if user is logged in
            if (!this.authService.isUserLoggedIn()) {
                return false;
            }

            // Check if we have both user and auction owner data
            if (!currentUser || !auctionOwner) {
                return false;
            }

            // Try different possible ID field names for user (using type assertion for flexibility)
            const userAny = currentUser as any;
            const userId = userAny.id || userAny.userId || userAny.user_id || userAny._id;
            const ownerId = auctionOwner.id;

            return userId === ownerId;
        } catch (error) {
            console.warn('Error checking if user is auction owner:', error);
            return false;
        }
    }

    isEndingSoon(): boolean {
        if (!this.auction || !this.auction.endTime) return false;

        try {
            const now = new Date();
            const endTime = new Date(this.auction.endTime);

            // Check if the date is valid
            if (isNaN(endTime.getTime())) {
                return false;
            }

            const oneDay = 24 * 60 * 60 * 1000;
            return endTime.getTime() - now.getTime() <= oneDay;
        } catch (error) {
            console.warn('Error calculating if auction is ending soon:', error);
            return false;
        }
    }

    getTimeRemaining(): string {
        if (!this.auction || !this.auction.endTime) return 'No end time';

        try {
            const now = new Date();
            const endTime = new Date(this.auction.endTime);

            // Check if the date is valid
            if (isNaN(endTime.getTime())) {
                return 'Invalid end time';
            }

            const diff = endTime.getTime() - now.getTime();

            if (diff <= 0) return 'Auction ended';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        } catch (error) {
            console.warn('Error calculating time remaining:', error);
            return 'Time unavailable';
        }
    }

    isWinningBid(bid: Bid): boolean {
        if (!this.auction?.bids || !Array.isArray(this.auction.bids) || this.auction.bids.length === 0) {
            return false;
        }

        try {
            const validBids = this.auction.bids.filter(b => b && typeof b.amount === 'number' && !isNaN(b.amount));
            if (validBids.length === 0) return false;

            const highestBid = Math.max(...validBids.map(b => b.amount));
            return bid.amount === highestBid;
        } catch (error) {
            console.warn('Error calculating winning bid:', error);
            return false;
        }
    }

    trackBid(bid: Bid): string {
        return bid.id || 'unknown';
    }

    getOfferStatusClass(offer: Offer): string {
        if (!offer || !offer.status) return 'badge-secondary';

        switch (offer.status) {
            case 'pending':
                return 'badge-warning';
            case 'accepted':
                return 'badge-success';
            case 'rejected':
                return 'badge-danger';
            case 'expired':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    }

    getOfferStatusText(offer: Offer): string {
        if (!offer || !offer.status) return 'Unknown';

        switch (offer.status) {
            case 'pending':
                return 'Pending';
            case 'accepted':
                return 'Accepted';
            case 'rejected':
                return 'Rejected';
            case 'expired':
                return 'Expired';
            default:
                return 'Unknown';
        }
    }

    formatPrice(amountEUR: number): string {
        if (amountEUR === null || amountEUR === undefined || isNaN(amountEUR)) {
            return this.currencyService.formatPriceRange(0);
        }
        return this.currencyService.formatPriceRange(amountEUR);
    }
} 