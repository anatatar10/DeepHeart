import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.auth.getUser();
    const expectedRoles: string[] = route.data['roles'];

    if (user && expectedRoles.includes(user.role)) {
      return true;
    }

    this.router.navigate(['/auth']);
    return false;
  }
}
