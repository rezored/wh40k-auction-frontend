import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction } from '../services/auction.service';

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

  constructor(private auctionService: AuctionService) {}

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
        this.loadMockData();
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
        filtered.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
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
    
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (endTime.getTime() - now.getTime() <= oneDay) {
      return 'ENDING SOON';
    }
    
    return 'ACTIVE';
  }

  loadMockData() {
    this.auctions = [
      {
        id: '1',
        title: 'Space Marine Captain - Limited Edition',
        description: 'Rare limited edition Space Marine Captain miniature from the 2023 collector\'s series. Painted to display quality with custom base.',
        startingPrice: 150,
        currentPrice: 275,
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=Space+Marine',
        category: 'miniatures',
        condition: 'excellent',
        seller: { id: '1', username: 'WarhammerCollector' },
        bids: [{ id: '1', amount: 275, bidder: { id: '2', username: 'AdeptusFan' }, createdAt: new Date() }],
        status: 'active',
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Codex: Space Marines 9th Edition',
        description: 'Mint condition Codex: Space Marines for 9th edition. Includes all supplements and never used.',
        startingPrice: 45,
        currentPrice: 67,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://via.placeholder.com/300x200/16213e/ffffff?text=Codex',
        category: 'books',
        condition: 'mint',
        seller: { id: '3', username: 'Bookworm' },
        bids: [],
        status: 'active',
        createdAt: new Date()
      },
      {
        id: '3',
        title: 'Imperial Terrain Set - Complete',
        description: 'Complete Imperial terrain set including buildings, walls, and decorative elements. Perfect for tabletop gaming.',
        startingPrice: 200,
        currentPrice: 350,
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://via.placeholder.com/300x200/0f3460/ffffff?text=Terrain',
        category: 'terrain',
        condition: 'good',
        seller: { id: '4', username: 'TerrainMaster' },
        bids: [{ id: '2', amount: 350, bidder: { id: '5', username: 'GamerPro' }, createdAt: new Date() }],
        status: 'active',
        createdAt: new Date()
      }
    ];
    this.filterAuctions();
  }
} 