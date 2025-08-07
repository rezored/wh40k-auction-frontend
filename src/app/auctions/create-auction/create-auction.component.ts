import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuctionService, CreateAuctionRequest } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-create-auction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-auction.component.html',
  styleUrls: ['./create-auction.component.scss']
})
export class CreateAuctionComponent {
  auction: CreateAuctionRequest = {
    title: '',
    description: '',
    startingPrice: 0,
    endTime: new Date(),
    category: '',
    condition: '',
    saleType: 'auction'
  };
  
  saleType: 'auction' | 'direct' = 'auction';
  minOffer: number = 0;
  offerExpiryDays: string = '';
  endDateString = '';
  submitting = false;

  constructor(
    private auctionService: AuctionService,
    private authService: AuthService,
    private router: Router,
    public currencyService: CurrencyService,
    private toastService: ToastService
  ) {}

  onSubmit() {
    if (!this.authService.isUserLoggedIn()) {
      this.toastService.warning('Please log in to create an auction');
      return;
    }

    this.submitting = true;
    
    // Set sale type and related fields
    this.auction.saleType = this.saleType;
    
    if (this.saleType === 'auction') {
      this.auction.endTime = new Date(this.endDateString);
    } else {
      // For direct sales, set end time to null or far future
      this.auction.endTime = null;
      this.auction.minOffer = this.minOffer;
      this.auction.offerExpiryDays = this.offerExpiryDays ? parseInt(this.offerExpiryDays) : undefined;
    }

    this.auctionService.createAuction(this.auction).subscribe({
      next: (createdAuction) => {
        this.submitting = false;
        this.toastService.success(`${this.saleType === 'auction' ? 'Auction' : 'Direct sale'} created successfully!`);
        this.router.navigate(['/auctions', createdAuction.id]);
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error creating auction:', error);
        this.toastService.error('Failed to create auction. Please try again.');
      }
    });
  }
} 