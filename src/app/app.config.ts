import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';

import { routes } from './app.routes';

function authInterceptor(req: any, next: any) {
  const token = localStorage.getItem('token');
  console.log('=== AuthInterceptor Debug ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Token found:', token ? 'Yes' : 'No');
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'None');
  
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Authorization header added:', clonedReq.headers.get('Authorization'));
    console.log('All headers:', clonedReq.headers.keys());
    return next(clonedReq);
  } else {
    console.log('No token found, request proceeding without Authorization header');
    return next(req);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZonelessChangeDetection()
  ]
};
