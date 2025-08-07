import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction, Bid, Offer, CreateOfferRequest } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-auction-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './auction-detail.component.html',
    styleUrls: ['./auction-detail.component.scss']
})
export class AuctionDetailComponent implements OnInit {
    auction: Auction | null = null;
    loading = true;
    bidAmount: number = 0;
    offerAmount: number = 0;
    offerMessage: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auctionService: AuctionService,
        public authService: AuthService,
        public currencyService: CurrencyService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        const auctionId = this.route.snapshot.paramMap.get('id');
        if (auctionId) {
            this.loadAuction(auctionId);
        }
    }

    loadAuction(id: string) {
        this.loading = true;
        this.auctionService.getAuction(id).subscribe({
            next: (auction) => {
                this.auction = auction;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading auction:', error);
                this.loading = false;
                this.loadMockAuction(id);
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

    canBid(): boolean {
        return this.authService.isUserLoggedIn() &&
            this.auction?.status === 'active' &&
            this.auction?.owner?.id !== this.authService.user()?.id;
    }

    isEndingSoon(): boolean {
        if (!this.auction || !this.auction.endTime) return false;
        const now = new Date();
        const endTime = new Date(this.auction.endTime);
        const oneDay = 24 * 60 * 60 * 1000;
        return endTime.getTime() - now.getTime() <= oneDay;
    }

    getTimeRemaining(): string {
        if (!this.auction || !this.auction.endTime) return 'No end time';

        const now = new Date();
        const endTime = new Date(this.auction.endTime);
        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) return 'Auction ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    isWinningBid(bid: Bid): boolean {
        if (!this.auction?.bids) return false;
        const highestBid = Math.max(...this.auction.bids.map(b => b.amount));
        return bid.amount === highestBid;
    }

    trackBid(bid: Bid): string {
        return bid.id;
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

    loadMockAuction(id: string) {
        // Create a direct sale for testing offers functionality
        if (id === '1') {
            this.auction = {
                id: id,
                title: 'Rare Space Marine Terminator - Direct Sale',
                description: 'Limited edition Space Marine Terminator from the 2023 collector\'s series. This beautifully painted model features intricate details and comes with a custom scenic base. Perfect for display or gaming.',
                startingPrice: 200,
                currentPrice: 200,
                endTime: null, // Direct sales have no end time
                imageUrl: 'https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Space+Marine+Terminator',
                category: 'miniatures',
                condition: 'excellent',
                saleType: 'direct',
                minOffer: 150,
                offerExpiryDays: 7,
                owner: { id: '1', username: 'WarhammerCollector' },
                bids: [],
                offers: [
                    { id: '1', amount: 180, message: 'Would you consider 180€?', buyer: { id: '2', username: 'AdeptusFan' }, status: 'pending', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
                    { id: '2', amount: 160, message: 'I can offer 160€ for this item', buyer: { id: '3', username: 'SpaceMarineLover' }, status: 'rejected', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
                ],
                status: 'active',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            };
        } else {
            // Regular auction for other IDs
            this.auction = {
                id: id,
                title: 'Space Marine Captain - Limited Edition',
                description: 'Rare limited edition Space Marine Captain miniature from the 2023 collector\'s series. This beautifully painted model features intricate details and comes with a custom scenic base. Perfect for display or gaming.',
                startingPrice: 150,
                currentPrice: 275,
                endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                imageUrl: 'https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Space+Marine+Captain',
                category: 'miniatures',
                condition: 'excellent',
                saleType: 'auction',
                owner: { id: '1', username: 'WarhammerCollector' },
                bids: [
                    { id: '1', amount: 275, bidder: { id: '2', username: 'AdeptusFan' }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
                    { id: '2', amount: 250, bidder: { id: '3', username: 'SpaceMarineLover' }, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
                    { id: '3', amount: 200, bidder: { id: '4', username: 'MiniatureCollector' }, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
                ],
                offers: [],
                status: 'active',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            };
        }
    }

    formatPrice(amountEUR: number): string {
        return this.currencyService.formatPriceRange(amountEUR);
    }
} 