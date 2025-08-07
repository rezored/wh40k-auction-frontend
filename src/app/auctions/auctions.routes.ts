import { Routes } from '@angular/router';
import { AuctionsComponent } from './auctions.component';
import { AuctionDetailComponent } from './auction-detail/auction-detail.component';
import { CreateAuctionComponent } from './create-auction/create-auction.component';

export const AUCTIONS_ROUTES: Routes = [
    { path: '', component: AuctionsComponent },
    { path: 'create', component: CreateAuctionComponent },
    { path: ':id', component: AuctionDetailComponent }
]; 