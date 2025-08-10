import { Routes } from '@angular/router';
import { AuctionsComponent } from './auctions.component';
import { AuctionDetailComponent } from './auction-detail/auction-detail.component';
import { CreateAuctionComponent } from './create-auction/create-auction.component';
import { EditAuctionComponent } from './edit-auction/edit-auction.component';
import { MyAuctionsComponent } from './my-auctions/my-auctions.component';

export const AUCTIONS_ROUTES: Routes = [
    { path: '', component: AuctionsComponent },
    { path: 'create', component: CreateAuctionComponent },
    { path: 'my-auctions', component: MyAuctionsComponent },
    { path: ':id', component: AuctionDetailComponent },
    { path: ':id/edit', component: EditAuctionComponent }
]; 