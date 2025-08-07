import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  endTime: Date;
  imageUrl: string;
  category: string;
  condition: string;
  owner: {
    id: string;
    username: string;
  };
  bids: Bid[];
  status: 'active' | 'ended' | 'cancelled';
  createdAt: Date;
}

export interface Bid {
  id: string;
  amount: number;
  bidder: {
    id: string;
    username: string;
  };
  createdAt: Date;
  auction?: Auction;
}

export interface CreateAuctionRequest {
  title: string;
  description: string;
  startingPrice: number;
  endTime: Date;
  category: string;
  condition: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(this.configService.auctionEndpoints.list);
  }

  getAuction(id: string): Observable<Auction> {
    return this.http.get<Auction>(this.configService.auctionEndpoints.detail(id));
  }

  createAuction(auction: CreateAuctionRequest): Observable<Auction> {
    // Convert numeric fields to strings for backend compatibility
    const auctionData = {
      ...auction,
      startingPrice: auction.startingPrice.toString(),
      endTime: auction.endTime.toISOString()
    };
    
    return this.http.post<Auction>(
      this.configService.auctionEndpoints.create, 
      auctionData,
      { headers: this.getAuthHeaders() }
    );
  }

  placeBid(auctionId: string, amount: number): Observable<Bid> {
    return this.http.post<Bid>(
      this.configService.bidEndpoints.placeBid(auctionId), 
      { amount: amount.toString() },
      { headers: this.getAuthHeaders() }
    );
  }

  getMyBids(): Observable<Bid[]> {
    return this.http.get<Bid[]>(
      this.configService.bidEndpoints.myBids,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(
      this.configService.auctionEndpoints.myAuctions,
      { headers: this.getAuthHeaders() }
    );
  }
} 