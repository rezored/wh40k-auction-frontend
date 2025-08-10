import { Routes } from '@angular/router';
import { AuctionsComponent } from './auctions.component';
import { AuctionDetailComponent } from './auction-detail/auction-detail.component';
import { CreateAuctionComponent } from './create-auction/create-auction.component';
import { EditAuctionComponent } from './edit-auction/edit-auction.component';

export const AUCTIONS_ROUTES: Routes = [
    { path: '', component: AuctionsComponent },
    { path: 'create', component: CreateAuctionComponent },
    { path: ':id', component: AuctionDetailComponent },
    { path: ':id/edit', component: EditAuctionComponent }
]; 