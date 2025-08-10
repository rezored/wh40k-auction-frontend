import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuctionService, Bid, Offer } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
    selector: 'app-my-bids',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-bids.component.html',
    styleUrls: ['./my-bids.component.scss']
})
export class MyBidsComponent implements OnInit {
    bids: Bid[] = [];
    offers: Offer[] = [];
    loadingBids = true;
    loadingOffers = true;
    errorBids = false;
    errorOffers = false;
    errorMessageBids = '';
    errorMessageOffers = '';

    constructor(
        private auctionService: AuctionService,
        public authService: AuthService,
        public currencyService: CurrencyService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (!this.authService.isUserLoggedIn()) {
            return;
        }
        this.loadBids();
        this.loadOffers();
    }

    loadBids() {
        this.loadingBids = true;
        this.errorBids = false;
        this.errorMessageBids = '';
        this.cdr.detectChanges(); // Trigger change detection for loading state

        this.auctionService.getMyBids().subscribe({
            next: (bids) => {
                this.bids = bids || [];
                this.loadingBids = false;
                this.cdr.detectChanges(); // Trigger change detection after data loads
            },
            error: (error) => {
                console.error('Error loading bids:', error);
                this.loadingBids = false;
                this.errorBids = true;

                if (error.status === 401) {
                    this.errorMessageBids = 'Please log in to view your bids.';
                } else if (error.status === 0) {
                    this.errorMessageBids = 'Unable to connect to the server. Please check your internet connection.';
                } else if (error.status === 404) {
                    this.errorMessageBids = 'Bid service not found. Please contact support.';
                } else if (error.status === 500) {
                    this.errorMessageBids = 'Server error. Please try again later.';
                } else {
                    this.errorMessageBids = 'Failed to load bids. Please try again.';
                }
                this.cdr.detectChanges(); // Trigger change detection after error
            }
        });
    }

    loadOffers() {
        this.loadingOffers = true;
        this.errorOffers = false;
        this.errorMessageOffers = '';
        this.cdr.detectChanges(); // Trigger change detection for loading state

        this.auctionService.getMyOffers().subscribe({
            next: (offers) => {
                this.offers = offers || [];
                this.loadingOffers = false;
                this.cdr.detectChanges(); // Trigger change detection after data loads
            },
            error: (error) => {
                console.error('Error loading offers:', error);
                this.loadingOffers = false;
                this.errorOffers = true;

                if (error.status === 401) {
                    this.errorMessageOffers = 'Please log in to view your offers.';
                } else if (error.status === 0) {
                    this.errorMessageOffers = 'Unable to connect to the server. Please check your internet connection.';
                } else if (error.status === 404) {
                    this.errorMessageOffers = 'Offer service not found. Please contact support.';
                } else if (error.status === 500) {
                    this.errorMessageOffers = 'Server error. Please try again later.';
                } else {
                    this.errorMessageOffers = 'Failed to load offers. Please try again.';
                }
                this.cdr.detectChanges(); // Trigger change detection after error
            }
        });
    }

    getBidStatusClass(bid: Bid): string {
        if (!bid.auction) return 'badge-secondary';

        const isWinning = this.isWinningBid(bid);
        const isEnded = bid.auction.status === 'ended';
        const isOwnAuction = bid.auction.owner?.id === this.authService.user()?.id;

        if (isEnded) {
            return isWinning ? 'badge-winning' : 'badge-outbid';
        }

        // If it's your own auction, show as active
        if (isOwnAuction) {
            return 'badge-active';
        }

        // For other auctions, show winning or outbid
        return isWinning ? 'badge-winning' : 'badge-outbid';
    }

    getBidStatusText(bid: Bid): string {
        if (!bid.auction) return 'Unknown';

        const isWinning = this.isWinningBid(bid);
        const isEnded = bid.auction.status === 'ended';
        const isOwnAuction = bid.auction.owner?.id === this.authService.user()?.id;

        if (isEnded) {
            return isWinning ? 'Won' : 'Lost';
        }

        // If it's your own auction, show as "Your Auction"
        if (isOwnAuction) {
            return 'Your Auction';
        }

        // For other auctions, show winning or outbid
        return isWinning ? 'Winning' : 'Outbid';
    }

    getOfferStatusClass(offer: Offer): string {
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

    makeNewOffer(offer: Offer) {
        if (offer.auction) {
            // Navigate to the auction page to make a new offer
            window.location.href = `/auctions/${offer.auction.id}`;
        }
    }

    isWinningBid(bid: Bid): boolean {
        // If the backend provides the isWinningBid property, use it
        if (bid.isWinningBid !== undefined) {
            return bid.isWinningBid;
        }

        // If no auction data, can't determine
        if (!bid.auction) {
            return false;
        }

        // If the backend doesn't provide complete bid data, use current price as fallback
        if (!bid.auction.bids || bid.auction.bids.length === 0) {
            const bidAmount = typeof bid.amount === 'string' ? parseFloat(bid.amount) : bid.amount;
            const currentPrice = typeof bid.auction.currentPrice === 'string' ? parseFloat(bid.auction.currentPrice) : bid.auction.currentPrice;
            return bidAmount >= currentPrice;
        }

        // Find the highest bid amount
        const highestBid = Math.max(...bid.auction.bids.map((b: Bid) => {
            const amount = typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount;
            return amount;
        }));

        // Check if this bid is the highest AND it's not your own auction
        const isOwnAuction = bid.auction.owner?.id === this.authService.user()?.id;

        // If it's your own auction, you can't "win" it
        if (isOwnAuction) {
            return false;
        }

        // Check if this specific bid amount equals the highest bid amount
        const bidAmount = typeof bid.amount === 'string' ? parseFloat(bid.amount) : bid.amount;
        const isHighest = bidAmount === highestBid;

        return isHighest;
    }

    formatPrice(amountEUR: number | string): string {
        const numericAmount = typeof amountEUR === 'string' ? parseFloat(amountEUR) : amountEUR;
        return this.currencyService.formatPriceRange(numericAmount);
    }
} 