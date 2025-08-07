import { Routes } from '@angular/router';
import { MyBidsComponent } from './my-bids/my-bids.component';

export const BIDS_ROUTES: Routes = [
    { path: '', redirectTo: 'my-bids', pathMatch: 'full' },
    { path: 'my-bids', component: MyBidsComponent }
]; 