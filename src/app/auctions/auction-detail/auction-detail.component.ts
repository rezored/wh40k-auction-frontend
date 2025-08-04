import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction, Bid } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auctionService: AuctionService,
    public authService: AuthService
  ) {}

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
        if (this.auction) {
          this.auction.bids = this.auction.bids || [];
          this.auction.bids.unshift(bid);
          this.auction.currentPrice = this.bidAmount;
          this.bidAmount = 0;
        }
      },
      error: (error) => {
        console.error('Error placing bid:', error);
        alert('Failed to place bid. Please try again.');
      }
    });
  }

  canBid(): boolean {
    return this.authService.isLoggedIn() && 
           this.auction?.status === 'active' && 
           this.auction?.seller.id !== this.authService.user()?.id;
  }

  isEndingSoon(): boolean {
    if (!this.auction) return false;
    const now = new Date();
    const endTime = new Date(this.auction.endTime);
    const oneDay = 24 * 60 * 60 * 1000;
    return endTime.getTime() - now.getTime() <= oneDay;
  }

  getTimeRemaining(): string {
    if (!this.auction) return '';
    
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

  trackBid(index: number, bid: Bid): string {
    return bid.id;
  }

  loadMockAuction(id: string) {
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
      seller: { id: '1', username: 'WarhammerCollector' },
      bids: [
        { id: '1', amount: 275, bidder: { id: '2', username: 'AdeptusFan' }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: '2', amount: 250, bidder: { id: '3', username: 'SpaceMarineLover' }, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { id: '3', amount: 200, bidder: { id: '4', username: 'MiniatureCollector' }, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      ],
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };
  }
} 