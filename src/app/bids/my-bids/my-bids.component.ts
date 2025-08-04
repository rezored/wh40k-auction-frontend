import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuctionService, Bid } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';

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
    public authService: AuthService
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.loadBids();
  }

  loadBids() {
    this.loading = true;
    this.auctionService.getMyBids().subscribe({
      next: (bids) => {
        this.bids = bids;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bids:', error);
        this.loading = false;
        this.loadMockBids();
      }
    });
  }

  getBidStatusClass(bid: Bid): string {
    if (!bid.auction) return 'badge-secondary';
    
    const isWinning = this.isWinningBid(bid);
    const isEnded = bid.auction.status === 'ended';
    
    if (isEnded) {
      return isWinning ? 'badge-winning' : 'badge-outbid';
    }
    
    return isWinning ? 'badge-winning' : 'badge-active';
  }

  getBidStatusText(bid: Bid): string {
    if (!bid.auction) return 'Unknown';
    
    const isWinning = this.isWinningBid(bid);
    const isEnded = bid.auction.status === 'ended';
    
    if (isEnded) {
      return isWinning ? 'Won' : 'Lost';
    }
    
    return isWinning ? 'Winning' : 'Outbid';
  }

  isWinningBid(bid: Bid): boolean {
    if (!bid.auction?.bids) return false;
    const highestBid = Math.max(...bid.auction.bids.map((b: Bid) => b.amount));
    return bid.amount === highestBid;
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
} 