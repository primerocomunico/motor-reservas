import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private _router: Router) { }

  /*canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return true;
  }*/

  // Coge el valor del localstorage para ver si tenemos el token guardado
  canActivate() {
    if (localStorage.getItem("authUser") != undefined) {
      return true;
    } else {
      this._router.navigateByUrl('/admin');
      return false;
    }
  }
  
}
