import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction } from '../services/auction.service';
import { AuthService } from '../services/auth.service';
import { CurrencyService } from '../services/currency.service';

@Component({
    selector: 'app-auctions',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './auctions.component.html',
    styleUrls: ['./auctions.component.scss']
})
export class AuctionsComponent implements OnInit {
    auctions: Auction[] = [];
    filteredAuctions: Auction[] = [];
    loading = true;

    selectedCategory = '';
    selectedStatus = '';
    selectedPriceRange = '';
    sortBy = 'ending-soon';

    constructor(
        private auctionService: AuctionService,
        private authService: AuthService,
        public currencyService: CurrencyService
    ) { }

    ngOnInit() {
        this.loadAuctions();
    }

    loadAuctions() {
        this.loading = true;
        this.auctionService.getAuctions().subscribe({
            next: (auctions) => {
                this.auctions = auctions;
                this.filterAuctions();
                
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading auctions:', error);
                this.loading = false;
            }
        });
    }

    filterAuctions() {
        let filtered = [...this.auctions];

        if (this.selectedCategory) {
            filtered = filtered.filter(auction => auction.category === this.selectedCategory);
        }

        if (this.selectedStatus) {
                    if (this.selectedStatus === 'ending-soon') {
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000;
            filtered = filtered.filter(auction => {
                if (!auction.endTime) return false; // Skip direct sales for ending-soon filter
                const endTime = new Date(auction.endTime);
                return endTime.getTime() - now.getTime() <= oneDay && auction.status === 'active';
            });
        } else {
                filtered = filtered.filter(auction => auction.status === this.selectedStatus);
            }
        }

        if (this.selectedPriceRange) {
            const [min, max] = this.selectedPriceRange.split('-').map(Number);
            filtered = filtered.filter(auction => {
                if (max) {
                    return auction.currentPrice >= min && auction.currentPrice <= max;
                } else {
                    return auction.currentPrice >= min;
                }
            });
        }

        switch (this.sortBy) {
            case 'ending-soon':
                filtered.sort((a, b) => {
                    if (!a.endTime || !b.endTime) return 0; // Skip direct sales in ending-soon sort
                    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
                });
                break;
            case 'price-low':
                filtered.sort((a, b) => a.currentPrice - b.currentPrice);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.currentPrice - a.currentPrice);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'most-bids':
                filtered.sort((a, b) => (b.bids?.length || 0) - (a.bids?.length || 0));
                break;
        }

        this.filteredAuctions = filtered;
    }

    getStatusClass(auction: Auction): string {
        if (auction.status === 'ended') return 'badge-ended';
        if (!auction.endTime) return 'badge-active'; // Direct sales are always active

        const now = new Date();
        const endTime = new Date(auction.endTime);
        const oneDay = 24 * 60 * 60 * 1000;

        if (endTime.getTime() - now.getTime() <= oneDay) {
            return 'badge-ending-soon';
        }

        return 'badge-active';
    }

    getStatusText(auction: Auction): string {
        if (auction.status === 'ended') return 'ENDED';
        if (!auction.endTime) return 'ACTIVE'; // Direct sales are always active

        const now = new Date();
        const endTime = new Date(auction.endTime);
        const oneDay = 24 * 60 * 60 * 1000;

        if (endTime.getTime() - now.getTime() <= oneDay) {
            return 'ENDING SOON';
        }

        return 'ACTIVE';
    }

    clearFilters() {
        this.selectedCategory = '';
        this.selectedStatus = '';
        this.selectedPriceRange = '';
        this.sortBy = 'ending-soon';
        this.filterAuctions();
    }

    formatPrice(amountEUR: number): string {
        return this.currencyService.formatPriceRange(amountEUR);
    }
} 