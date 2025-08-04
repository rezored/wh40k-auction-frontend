import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuctionService, CreateAuctionRequest } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';

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
    condition: ''
  };
  
  endDateString = '';
  submitting = false;

  constructor(
    private auctionService: AuctionService,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.authService.isLoggedIn()) {
      alert('Please log in to create an auction');
      return;
    }

    this.submitting = true;
    
    this.auction.endTime = new Date(this.endDateString);

    this.auctionService.createAuction(this.auction).subscribe({
      next: (createdAuction) => {
        this.submitting = false;
        alert('Auction created successfully!');
        this.router.navigate(['/auctions', createdAuction.id]);
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error creating auction:', error);
        alert('Failed to create auction. Please try again.');
      }
    });
  }
} 