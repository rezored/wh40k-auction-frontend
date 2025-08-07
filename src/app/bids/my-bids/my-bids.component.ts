import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuctionService, Bid } from '../../services/auction.service';
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
    loading = true;

    constructor(
        private auctionService: AuctionService,
        public authService: AuthService,
        public currencyService: CurrencyService
    ) { }

    ngOnInit() {
        if (!this.authService.isUserLoggedIn()) {
            console.log('Not logged in');
            return;
        }
        this.loadBids();
    }

    loadBids() {
        this.loading = true;
        this.auctionService.getMyBids().subscribe({
            next: (bids) => {
                console.log('Received bids from backend:', bids);
                this.bids = bids;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading bids:', error);
                this.loading = false;
                // this.loadMockBids();
            }
        });
    }

    getBidStatusClass(bid: Bid): string {
        if (!bid.auction) return 'badge-secondary';

        console.log('getBidStatusClass called for bid:', {
            bidAmount: bid.amount,
            currentPrice: bid.auction.currentPrice,
            auctionOwner: bid.auction.owner?.username,
            currentUser: this.authService.user()?.username,
            auctionBids: bid.auction.bids?.length || 0
        });

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

    isWinningBid(bid: Bid): boolean {
        // If no auction data, can't determine
        if (!bid.auction) return false;
        
        // If the backend doesn't provide complete bid data, use current price as fallback
        if (!bid.auction.bids || bid.auction.bids.length === 0) {
            console.log('No bids array, using current price comparison');
            return bid.amount >= bid.auction.currentPrice;
        }
        
        // Find the highest bid amount
        const highestBid = Math.max(...bid.auction.bids.map((b: Bid) => b.amount));
        
        // Check if this bid is the highest AND it's not your own auction
        const isOwnAuction = bid.auction.owner?.id === this.authService.user()?.id;
        
        // If it's your own auction, you can't "win" it
        if (isOwnAuction) {
            return false;
        }
        
        // Check if this specific bid amount equals the highest bid amount
        const isHighest = bid.amount === highestBid;
        
        console.log('Bid debug:', {
            bidAmount: bid.amount,
            highestBid: highestBid,
            isHighest: isHighest,
            isOwnAuction: isOwnAuction,
            currentPrice: bid.auction.currentPrice,
            auctionBids: bid.auction.bids.map(b => ({ amount: b.amount, bidder: b.bidder.username }))
        });
        
        return isHighest;
    }

    loadMockBids() {
        this.bids = [
            {
                id: '1',
                amount: 275,
                bidder: { id: '1', username: 'AdeptusFan' },
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                auction: {
                    id: '1',
                    title: 'Space Marine Captain - Limited Edition',
                    currentPrice: 275,
                    status: 'active',
                    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                } as any
            },
            {
                id: '2',
                amount: 150,
                bidder: { id: '1', username: 'AdeptusFan' },
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
                auction: {
                    id: '2',
                    title: 'Codex: Space Marines 9th Edition',
                    currentPrice: 200,
                    status: 'active',
                    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                } as any
            }
        ];
    }

    formatPrice(amountEUR: number): string {
        return this.currencyService.formatPriceRange(amountEUR);
    }
} 