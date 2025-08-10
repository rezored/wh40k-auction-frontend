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
  bidCount?: number | string;
  bids: Bid[];
  offers: Offer[];
  status: 'active' | 'ended' | 'cancelled' | 'sold';
  createdAt: string | Date; // Allow both string and Date for flexibility
}

export interface Bid {
  id: string;
  amount: number | string; // Allow both number and string since backend might send string
  bidder?: {
    id: string;
    username: string;
  };
  createdAt: string | Date; // Allow both string and Date for flexibility
  auction?: Auction;
  isWinningBid?: boolean; // Add this property that the backend provides
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
  auctionImage?: string;
  auctionTitle?: string;
  auctionId?: string;
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
  excludeSold?: boolean; // Exclude sold auctions from main listings
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
      bidCount: auction.bidCount ? parseInt(auction.bidCount as string) : 0,
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
    return this.http.get<any>(
      this.configService.auctionEndpoints.myAuctions,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Raw response from getMyAuctions:', response);

        // Handle different response structures
        let auctions: any[];

        if (Array.isArray(response)) {
          // Direct array response
          console.log('Response is direct array, length:', response.length);
          auctions = response;
        } else if (response && response.auctions && Array.isArray(response.auctions)) {
          // Paginated response structure
          console.log('Response has auctions property, length:', response.auctions.length);
          auctions = response.auctions;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Data wrapper response
          console.log('Response has data property, length:', response.data.length);
          auctions = response.data;
        } else {
          // Fallback to empty array if response structure is unexpected
          console.warn('Unexpected response structure for getMyAuctions:', response);
          auctions = [];
        }

        // Debug: Log each auction's structure
        auctions.forEach((auction, index) => {
          console.log(`Auction ${index + 1} structure:`, {
            id: auction.id,
            title: auction.title,
            saleType: auction.saleType,
            hasOffers: !!auction.offers,
            offersLength: auction.offers?.length || 0,
            hasBids: !!auction.bids,
            bidsLength: auction.bids?.length || 0,
            allKeys: Object.keys(auction)
          });
        });

        return auctions.map(auction => this.convertAuctionDates(auction));
      })
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

  // Auction Winner and Shipping Methods
  getAuctionWinner(auctionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.configService.auctionEndpoints.list}/${auctionId}/winner`,
      { headers: this.getAuthHeaders() }
    );
  }

  getWinnerShippingAddress(auctionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.configService.auctionEndpoints.list}/${auctionId}/winner-address`,
      { headers: this.getAuthHeaders() }
    );
  }

  notifyWinner(auctionId: string, message?: string): Observable<any> {
    return this.http.post<any>(
      `${this.configService.auctionEndpoints.list}/${auctionId}/notify-winner`,
      { message },
      { headers: this.getAuthHeaders() }
    );
  }

  // Offer acceptance with address notification
  acceptOfferWithAddress(offerId: string, shippingAddress: any): Observable<any> {
    return this.http.post<any>(
      `${this.configService.offerEndpoints.respondToOffer(offerId)}/accept-with-address`,
      {
        response: 'accept',
        shippingAddress
      },
      { headers: this.getAuthHeaders() }
    );
  }

  // Get shipping information for auction/offer
  getShippingInfo(auctionId: string, userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.configService.auctionEndpoints.list}/${auctionId}/shipping/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }
} 