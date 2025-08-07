import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/auctions', pathMatch: 'full' },
    { 
        path: 'auth', 
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    { 
        path: 'auctions', 
        loadChildren: () => import('./auctions/auctions.routes').then(m => m.AUCTIONS_ROUTES)
    },
    { 
        path: 'bids', 
        loadChildren: () => import('./bids/bids.routes').then(m => m.BIDS_ROUTES)
    },
    { 
        path: 'profile', 
        loadChildren: () => import('./profile/profile.routes').then(m => m.PROFILE_ROUTES)
    }
];
