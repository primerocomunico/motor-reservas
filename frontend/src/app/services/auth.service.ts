import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { elementEventFullName } from '@angular/compiler/src/view_compiler/view_compiler';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(public _api: ApiService, public _router: Router) { }

  // Variable que almacenará los datos de la llamda GET
  data: object[] = [];

  // Obtiene los datos de la api del nuevo usuario para utilizarlos como object
  dataNewUser: object;
  // Obtiene los datos de la api del usuario registrado para utilizarlos como object
  dataLoginUser: object;

  // Variables que sirven para alerts y comprobar el login/logout
  flagAlert: boolean = false;
  flagAlertWrong: boolean = false;
  errorLogin: string;
  isLogged: string;

  login() {
    this.isLogged = localStorage.getItem("authUser");
    this._router.navigateByUrl('/adminbooking');
  }
  logout() {
    this.isLogged = undefined;
  }

  // Llamada POST para que acceda un user registrado
  getUserAdmin(
    userName: string,
    userPassword: string
  ): void {
    this._api.post(environment.endpointUrl+"/login", {
      "userName": userName,
      "userPassword": userPassword
    })
      .subscribe(
        // Success
        (apiResult: object) => {
          this.dataLoginUser = apiResult;
          // console.log(this.dataLoginUser);
          // Se compara la clave del objeto, si la clave "message" tiene valor, entonces el acceso es denegado
          // El objeto de la respuesta de la api debe contener la clave "token" para que se pueda acceder
          if (this.dataLoginUser["message"] != undefined) {
            this.logout();
            this._router.navigateByUrl('/admin');
            // flagAlert para el aviso de que el username o password are wrong
            this.flagAlert = true;
            setTimeout(() => { this.flagAlert = false }, 5000)
          } else {
            localStorage.setItem("authUser", this.dataLoginUser["token"]);
            localStorage.setItem("user", this.dataLoginUser["user"]);
            this.login();
          }
        },
        (error: string) => { console.log(error) }
      )
  }
}
