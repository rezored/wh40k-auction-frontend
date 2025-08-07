import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = environment;

  constructor() {}

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  get appName(): string {
    return this.config.appName;
  }

  get version(): string {
    return this.config.version;
  }

  get authEndpoints() {
    return {
      login: `${this.apiUrl}/auth/login`,
      register: `${this.apiUrl}/auth/register`,
      logout: `${this.apiUrl}/auth/logout`
    };
  }

  get auctionEndpoints() {
    return {
      list: `${this.apiUrl}/auctions`,
      detail: (id: string) => `${this.apiUrl}/auctions/${id}`,
      create: `${this.apiUrl}/auctions`,
      myAuctions: `${this.apiUrl}/auctions/my-auctions`
    };
  }

  get bidEndpoints() {
    return {
      placeBid: (auctionId: string) => `${this.apiUrl}/auctions/${auctionId}/bids`,
      myBids: `${this.apiUrl}/bids/my-bids`
    };
  }

  getHeaders(token?: string) {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
} 