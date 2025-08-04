import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  seller: {
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
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(`${this.apiUrl}/auctions`);
  }

  getAuction(id: string): Observable<Auction> {
    return this.http.get<Auction>(`${this.apiUrl}/auctions/${id}`);
  }

  createAuction(auction: CreateAuctionRequest): Observable<Auction> {
    return this.http.post<Auction>(`${this.apiUrl}/auctions`, auction);
  }

  placeBid(auctionId: string, amount: number): Observable<Bid> {
    return this.http.post<Bid>(`${this.apiUrl}/auctions/${auctionId}/bids`, { amount });
  }

  getMyBids(): Observable<Bid[]> {
    return this.http.get<Bid[]>(`${this.apiUrl}/bids/my-bids`);
  }

  getMyAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(`${this.apiUrl}/auctions/my-auctions`);
  }
} 