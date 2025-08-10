import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ConfigService } from './config.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  endTime: string | Date | null; // Allow both string and Date for flexibility
  imageUrl: string;
  category: string;
  categoryGroup?: string;
  scale?: string;
  era?: string;
  tags?: string[];
  condition: string;
  saleType: 'auction' | 'direct';
  minOffer?: number;
  offerExpiryDays?: number;
  owner?: {
    id: string;
    username: string;
  };
  bids: Bid[];
  offers: Offer[];
  status: 'active' | 'ended' | 'cancelled' | 'sold';
  createdAt: string | Date; // Allow both string and Date for flexibility
}

export interface Bid {
  id: string;
  amount: number;
  bidder?: {
    id: string;
    username: string;
  };
  createdAt: string | Date; // Allow both string and Date for flexibility
  auction?: Auction;
}

export interface Offer {
  id: string;
  amount: number;
  message?: string;
  buyer?: {
    id: string;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string | Date; // Allow both string and Date for flexibility
  expiresAt?: string | Date; // Allow both string and Date for flexibility
  auction?: Auction;
}

export interface CreateAuctionRequest {
  title: string;
  description: string;
  startingPrice: number;
  endTime: Date | string | null;
  category: string;
  categoryGroup?: string;
  scale?: string;
  era?: string;
  tags?: string[];
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

export interface UpdateAuctionRequest {
  title?: string;
  description?: string;
  startingPrice?: number;
  endTime?: Date | string | null;
  category?: string;
  categoryGroup?: string;
  scale?: string;
  era?: string;
  tags?: string[];
  condition?: string;
  saleType?: 'auction' | 'direct';
  minOffer?: number;
  offerExpiryDays?: number;
  imageUrl?: string;
}

export interface AuctionFilters {
  categoryGroup?: string;
  category?: string;
  scale?: string;
  era?: string;
  condition?: string;
  status?: string;
  priceRange?: string;
  showOwn?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuctionsResponse {
  auctions: Auction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private router: Router,
    private authService: AuthService
  ) { }



  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    // For debugging - check if token exists and user is logged in
    const isLoggedIn = this.authService.isUserLoggedIn();

    if (!token || !isLoggedIn) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAuctions(filters?: AuctionFilters): Observable<PaginatedAuctionsResponse> {
    let params = new URLSearchParams();

    if (filters) {
      if (filters.categoryGroup) params.append('categoryGroup', filters.categoryGroup);
      if (filters.category) params.append('category', filters.category);
      if (filters.scale) params.append('scale', filters.scale);
      if (filters.era) params.append('era', filters.era);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.status) params.append('status', filters.status);
      if (filters.priceRange) params.append('priceRange', filters.priceRange);
      if (filters.showOwn) params.append('showOwn', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const url = `${this.configService.auctionEndpoints.list}${params.toString() ? '?' + params.toString() : ''}`;

    // Use auth headers for all requests
    const headers = this.getAuthHeaders();

    // Debug: Check if we have authentication for showOwn requests
    if (filters?.showOwn) {
      const token = this.authService.getToken();
      const isLoggedIn = this.authService.isUserLoggedIn();
      console.log('ShowOwn request - Token exists:', !!token, 'User logged in:', isLoggedIn);
    }

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        return this.convertPaginatedResponse(response);
      }),
      catchError((error: any) => {
        if (error.status === 401) {
          // For showOwn requests, don't automatically logout and redirect
          // Let the component handle the error gracefully
          if (filters?.showOwn) {
            // Just return the error without clearing tokens or redirecting
            return throwError(() => error);
          } else {
            // For other requests, clear invalid tokens and redirect
            this.authService.logout();
            this.router.navigate(['/auth/login'], {
              queryParams: { returnUrl: this.router.url }
            });
          }
        }
        return throwError(() => error);
      })
    );
  }

  getAuction(id: string): Observable<Auction> {
    return this.http.get<any>(this.configService.auctionEndpoints.detail(id)).pipe(
      map(response => this.convertAuctionDates(response))
    );
  }

  getAuctionById(id: string): Observable<Auction> {
    return this.http.get<any>(`${this.configService.auctionEndpoints.list}/${id}`).pipe(
      map(response => this.convertAuctionDates(response))
    );
  }

  updateAuction(id: string, auction: UpdateAuctionRequest): Observable<Auction> {
    const updateData = {
      ...auction,
      endTime: auction.endTime ? this.convertDateToISOString(auction.endTime) : null
    };

    return this.http.put<any>(
      `${this.configService.auctionEndpoints.list}/${id}`,
      updateData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => this.convertAuctionDates(response))
    );
  }

  deleteAuction(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.configService.auctionEndpoints.list}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  createAuction(auction: CreateAuctionRequest): Observable<Auction> {
    // Convert numeric fields to strings for backend compatibility
    const auctionData = {
      ...auction,
      startingPrice: auction.startingPrice.toString(),
      endTime: auction.endTime ? this.convertDateToISOString(auction.endTime) : null,
      minOffer: auction.minOffer?.toString(),
      offerExpiryDays: auction.offerExpiryDays?.toString()
    };

    return this.http.post<any>(
      this.configService.auctionEndpoints.create,
      auctionData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => this.convertAuctionDates(response))
    );
  }

  private convertDateToISOString(dateValue: Date | string): string {
    if (typeof dateValue === 'string') {
      // If it's a date string (from date input), convert to Date object and set time to end of day
      const date = new Date(dateValue);
      date.setHours(23, 59, 59, 999); // Set to end of day
      return date.toISOString();
    } else if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    return '';
  }

  private convertAuctionDates(auction: any): Auction {
    return {
      ...auction,
      endTime: auction.endTime ? new Date(auction.endTime) : null,
      createdAt: new Date(auction.createdAt),
      bids: auction.bids?.map((bid: any) => ({
        ...bid,
        createdAt: new Date(bid.createdAt)
      })) || [],
      offers: auction.offers?.map((offer: any) => ({
        ...offer,
        createdAt: new Date(offer.createdAt),
        expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : undefined
      })) || []
    };
  }

  private convertPaginatedResponse(response: any): PaginatedAuctionsResponse {
    return {
      ...response,
      auctions: response.auctions?.map((auction: any) => this.convertAuctionDates(auction)) || []
    };
  }

  placeBid(auctionId: string, amount: number): Observable<Bid> {
    return this.http.post<any>(
      this.configService.bidEndpoints.placeBid(auctionId),
      { amount: amount.toString() },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        ...response,
        createdAt: new Date(response.createdAt)
      }))
    );
  }

  makeOffer(auctionId: string, offer: CreateOfferRequest): Observable<Offer> {
    return this.http.post<any>(
      this.configService.offerEndpoints.makeOffer(auctionId),
      {
        amount: offer.amount.toString(),
        message: offer.message
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        ...response,
        createdAt: new Date(response.createdAt),
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined
      }))
    );
  }

  respondToOffer(offerId: string, response: 'accept' | 'reject'): Observable<Offer> {
    return this.http.put<any>(
      this.configService.offerEndpoints.respondToOffer(offerId),
      { response },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(offerResponse => ({
        ...offerResponse,
        createdAt: new Date(offerResponse.createdAt),
        expiresAt: offerResponse.expiresAt ? new Date(offerResponse.expiresAt) : undefined
      }))
    );
  }

  getMyBids(): Observable<Bid[]> {
    return this.http.get<any[]>(
      this.configService.bidEndpoints.myBids,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(bids => bids.map(bid => ({
        ...bid,
        createdAt: new Date(bid.createdAt)
      })))
    );
  }

  getMyOffers(): Observable<Offer[]> {
    return this.http.get<any[]>(
      this.configService.offerEndpoints.myOffers,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(offers => offers.map(offer => ({
        ...offer,
        createdAt: new Date(offer.createdAt),
        expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : undefined
      })))
    );
  }

  getMyAuctions(): Observable<Auction[]> {
    return this.http.get<any[]>(
      this.configService.auctionEndpoints.myAuctions,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(auctions => auctions.map(auction => this.convertAuctionDates(auction)))
    );
  }

  getReceivedOffers(auctionId: string): Observable<Offer[]> {
    return this.http.get<any[]>(
      this.configService.offerEndpoints.receivedOffers(auctionId),
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(offers => offers.map(offer => ({
        ...offer,
        createdAt: new Date(offer.createdAt),
        expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : undefined
      })))
    );
  }
} 