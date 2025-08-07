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
  endTime: Date | null;
  imageUrl: string;
  category: string;
  condition: string;
  saleType: 'auction' | 'direct';
  minOffer?: number;
  offerExpiryDays?: number;
  owner: {
    id: string;
    username: string;
  };
  bids: Bid[];
  offers: Offer[];
  status: 'active' | 'ended' | 'cancelled' | 'sold';
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

export interface Offer {
  id: string;
  amount: number;
  message?: string;
  buyer: {
    id: string;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  auction?: Auction;
}

export interface CreateAuctionRequest {
  title: string;
  description: string;
  startingPrice: number;
  endTime: Date | null;
  category: string;
  condition: string;
  saleType: 'auction' | 'direct';
  minOffer?: number;
  offerExpiryDays?: number;
  imageUrl?: string;
}

export interface CreateOfferRequest {
  amount: number;
  message?: string;
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
      endTime: auction.endTime ? auction.endTime.toISOString() : null,
      minOffer: auction.minOffer?.toString(),
      offerExpiryDays: auction.offerExpiryDays?.toString()
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

  makeOffer(auctionId: string, offer: CreateOfferRequest): Observable<Offer> {
    return this.http.post<Offer>(
      this.configService.offerEndpoints.makeOffer(auctionId), 
      { 
        amount: offer.amount.toString(),
        message: offer.message 
      },
      { headers: this.getAuthHeaders() }
    );
  }

  respondToOffer(offerId: string, response: 'accept' | 'reject'): Observable<Offer> {
    return this.http.put<Offer>(
      this.configService.offerEndpoints.respondToOffer(offerId), 
      { response },
      { headers: this.getAuthHeaders() }
    );
  }

  getMyBids(): Observable<Bid[]> {
    return this.http.get<Bid[]>(
      this.configService.bidEndpoints.myBids,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(
      this.configService.offerEndpoints.myOffers,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(
      this.configService.auctionEndpoints.myAuctions,
      { headers: this.getAuthHeaders() }
    );
  }

  getReceivedOffers(auctionId: string): Observable<Offer[]> {
    return this.http.get<Offer[]>(
      this.configService.offerEndpoints.receivedOffers(auctionId),
      { headers: this.getAuthHeaders() }
    );
  }
} 