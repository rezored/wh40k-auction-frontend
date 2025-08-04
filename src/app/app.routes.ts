import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AuctionsComponent } from './auctions/auctions.component';
import { AuctionDetailComponent } from './auctions/auction-detail/auction-detail.component';
import { CreateAuctionComponent } from './auctions/create-auction/create-auction.component';
import { MyBidsComponent } from './bids/my-bids/my-bids.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
    { path: '', redirectTo: '/auctions', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'auctions', component: AuctionsComponent },
    { path: 'auctions/:id', component: AuctionDetailComponent },
    { path: 'create-auction', component: CreateAuctionComponent },
    { path: 'my-bids', component: MyBidsComponent },
    { path: 'profile', component: ProfileComponent },
];
