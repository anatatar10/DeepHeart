// src/app/interceptors/auth.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from localStorage
    const authToken = localStorage.getItem('auth_token');

    // Check if this is an API request that needs authentication
    if (authToken && req.url.includes('/api/')) {
      console.log('🔐 AuthInterceptor - Adding auth token to request:', req.url);

      // Clone the request and add the Authorization header
      const authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      return next.handle(authReq);
    }

    // For non-API requests or when no token, proceed without modification
    return next.handle(req);
  }
}
