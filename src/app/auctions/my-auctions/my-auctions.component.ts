import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuctionService, Auction, Offer } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-my-auctions',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-auctions.component.html',
    styleUrls: ['./my-auctions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAuctionsComponent implements OnInit, OnDestroy {
    auctions: Auction[] = [];
    pendingOffers: Offer[] = [];
    loading = true;
    loadingOffers = true;
    error = false;
    errorOffers = false;
    errorMessage = '';
    errorMessageOffers = '';

    constructor(
        private auctionService: AuctionService,
        public authService: AuthService,
        public currencyService: CurrencyService,
        private toastService: ToastService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.authService.restoreUserState();

        // Check if user is logged in before loading data
        if (this.authService.loginStatus()) {
            this.loadMyAuctions();
            this.loadPendingOffers();
        } else {
            console.warn('User not logged in, skipping data load');
            this.loading = false;
            this.loadingOffers = false;
            this.cdr.detectChanges();
        }
    }

    ngOnDestroy(): void {
        // Cleanup if needed
    }

    loadMyAuctions() {
        this.loading = true;
        this.error = false;
        this.cdr.detectChanges();

        this.auctionService.getMyAuctions().subscribe({
            next: (auctions) => {
                console.log('My auctions loaded:', auctions);
                // Ensure auctions is always an array
                this.auctions = Array.isArray(auctions) ? auctions : [];

                // Debug: Log each auction's sale type and offers
                this.auctions.forEach(auction => {
                    console.log(`Auction "${auction.title}":`, {
                        id: auction.id,
                        saleType: auction.saleType,
                        offers: auction.offers,
                        offersCount: auction.offers?.length || 0
                    });
                });

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading my auctions:', error);
                this.error = true;
                this.errorMessage = 'Failed to load your auctions. Please try again.';
                this.auctions = []; // Set empty array on error
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadPendingOffers() {
        this.loadingOffers = true;
        this.errorOffers = false;
        this.cdr.detectChanges();

        // Get all pending offers from user's auctions
        const pendingOffers: Offer[] = [];

        this.auctionService.getMyAuctions().subscribe({
            next: (auctions) => {
                console.log('Loading pending offers from auctions:', auctions);
                if (Array.isArray(auctions)) {
                    auctions.forEach(auction => {
                        console.log(`Checking offers for auction "${auction.title}":`, {
                            auctionId: auction.id,
                            offers: auction.offers,
                            offersCount: auction.offers?.length || 0
                        });

                        if (auction.offers && auction.offers.length > 0) {
                            const pending = auction.offers.filter(offer => offer.status === 'pending');
                            console.log(`Found ${pending.length} pending offers for auction "${auction.title}"`);

                            pending.forEach(offer => {
                                // Add auction info to the offer for display
                                (offer as any).auctionTitle = auction.title;
                                (offer as any).auctionId = auction.id;
                                (offer as any).auctionImage = auction.imageUrl;
                                pendingOffers.push(offer);
                            });
                        } else {
                            console.log(`No offers found for auction "${auction.title}"`);
                        }
                    });
                } else {
                    console.warn('Auctions is not an array:', auctions);
                }

                this.pendingOffers = pendingOffers;
                this.loadingOffers = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading pending offers:', error);
                this.errorOffers = true;
                this.errorMessageOffers = 'Failed to load pending offers. Please try again.';
                this.pendingOffers = []; // Set empty array on error
                this.loadingOffers = false;
                this.cdr.detectChanges();
            }
        });
    }

    acceptOffer(offer: Offer) {
        if (!offer.id) return;

        this.auctionService.respondToOffer(offer.id, 'accept').subscribe({
            next: () => {
                this.toastService.success('Offer accepted successfully!');
                this.loadPendingOffers(); // Refresh the list
                this.loadMyAuctions(); // Refresh auctions
            },
            error: (error) => {
                console.error('Error accepting offer:', error);
                this.toastService.error('Failed to accept offer. Please try again.');
            }
        });
    }

    rejectOffer(offer: Offer) {
        if (!offer.id) return;

        this.auctionService.respondToOffer(offer.id, 'reject').subscribe({
            next: () => {
                this.toastService.success('Offer rejected successfully!');
                this.loadPendingOffers(); // Refresh the list
                this.loadMyAuctions(); // Refresh auctions
            },
            error: (error) => {
                console.error('Error rejecting offer:', error);
                this.toastService.error('Failed to reject offer. Please try again.');
            }
        });
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

    getAuctionStatusClass(auction: Auction): string {
        if (!auction || !auction.status) return 'badge-info'; // Default to 'badge-info' for sold auctions

        switch (auction.status) {
            case 'active':
                return 'badge-success';
            case 'ended':
                return 'badge-danger';
            case 'cancelled':
                return 'badge-secondary';
            case 'sold':
                return 'badge-info';
            default:
                return 'badge-info'; // Default to 'badge-info' for sold auctions
        }
    }

    getAuctionStatusText(auction: Auction): string {
        if (!auction || !auction.status) return 'Sold'; // Default to 'Sold' instead of 'Unknown'

        switch (auction.status) {
            case 'active':
                return 'Active';
            case 'ended':
                return 'Ended';
            case 'cancelled':
                return 'Cancelled';
            case 'sold':
                return 'Sold';
            default:
                return 'Sold'; // Default to 'Sold' instead of 'Unknown'
        }
    }

    formatPrice(amountEUR: number | string): string {
        if (amountEUR === null || amountEUR === undefined || isNaN(parseFloat(amountEUR as string))) {
            return this.currencyService.formatPriceRange(0);
        }
        return this.currencyService.formatPriceRange(parseFloat(amountEUR as string));
    }

    getPendingOffersCount(auction: Auction): number {
        if (!auction.offers || auction.offers.length === 0) return 0;
        return auction.offers.filter(offer => offer.status === 'pending').length;
    }

    trackAuction(auction: Auction): string {
        return auction.id || 'unknown';
    }

    trackOffer(offer: Offer): string {
        return offer.id || 'unknown';
    }

    getSaleTypeDisplay(auction: Auction): string {
        if (auction.saleType === 'auction') {
            return auction.endTime ? `Ends: ${new Date(auction.endTime).toLocaleString()}` : 'Auction (No end time)';
        } else if (auction.saleType === 'direct') {
            return 'Direct Sale';
        } else {
            return 'Direct Sale'; // Default to Direct Sale instead of Unknown
        }
    }
}
