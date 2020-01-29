import { Injectable, OnChanges } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { elementEventFullName } from '@angular/compiler/src/view_compiler/view_compiler';

@Injectable({
  providedIn: 'root'
})

export class DataService {

  sub: any;

  // Recibimos y/o enviamos la info a la base de datos a través del _api
  // data la utilizamos para solicitar todas las reservas
  data: object;
  // oneData la utilizamos para solicitar la info de la reserva solicitada
  oneData: object = {};
  // editData la utilizamos para editar la info de una reserva determinada
  editData: any[];
  // dataNewBooking la utilizamos para enviar una nueva reserva
  dataNewBooking: object;
  // dataAccessUser la utilizamos para enviar el acceso como user admin
  dataAccesUser: object;
  // dataDeleteBooking la utilizamos para recibir la respuesta cuando borramos una reserva
  dataDeleteBooking: object;

  // flagAlert para crear alerta cuando se envía correctamente una reserva
  flagAlert: boolean = false;

  constructor(public _api: ApiService, public _router: Router, public _auth: AuthService) { }

// Llamada GET para mostrar las reservas realizadas
  allBookings() {
    // La variable data se pone como array vacio para que no se duplique si se carga de nuevo el componente
    this.data = [];
    this._api.get(environment.endpointUrl+"/booking", { 'Authorization': `bearer ${localStorage.getItem("authUser")}` })
    .subscribe((apiResult) => {
      this.data = apiResult;
      // console.log(this.data);
    });
  }

// Llamada GET para mostrar una única reserva
oneBooking(id: string) {
  //this.oneData = [];
  this._api.get(environment.endpointUrl+"/booking/"+id, { 'Authorization': `bearer ${localStorage.getItem("authUser")}` }).subscribe((apiResult) => {
    this.oneData = apiResult;
    // console.log(this.oneData);
    // Insertamos valor a oneData, para que al cargar el component no aparezca como undefined, provocando un error al hacer el ng build --prod
    if (this.oneData['bookingFullName'] === undefined || this.oneData['bookingFullName'] === null) {this.oneData['bookingFullName'] = " "}
    if (this.oneData['bookingMail'] === undefined || this.oneData['bookingMail'] === null) { this.oneData['bookingMail'] = " " }
    if (this.oneData['bookingPhone'] === undefined || this.oneData['bookingPhone'] === null) { this.oneData['bookingPhone'] = " " }
    if (this.oneData['bookingArrival'] === undefined || this.oneData['bookingArrival'] === null) { this.oneData['bookingArrival'] = " " }
    if (this.oneData['bookingDeparture'] === undefined || this.oneData['bookingDeparture'] === null) { this.oneData['bookingDeparture'] = " " }
    if (this.oneData['bookingVilla'] === undefined || this.oneData['bookingVilla'] === null) { this.oneData['bookingVilla'] = " " }
    if (this.oneData['bookingGuests'] === undefined || this.oneData['bookingGuests'] === null) { this.oneData['bookingGuests'] = " " }
    if (this.oneData['bookingComments'] === undefined || this.oneData['bookingComments'] === null) { this.oneData['bookingComments'] = " " }
    if (this.oneData['bookingPayment'] === undefined || this.oneData['bookingPayment'] === null) { this.oneData['bookingPayment'] = " " }
    if (this.oneData['bookingApproved'] === undefined || this.oneData['bookingApproved'] === null) { this.oneData['bookingApproved'] = " " }
    if (this.oneData['bookingStored'] === undefined || this.oneData['bookingStored'] === null) { this.oneData['bookingStored'] = " " }
  })
}


// Llamada POST para enviar la nueva reserva a la base de datos
  newBooking(
    fullName: string,
    email: string,
    phone: number,
    arrival: string,
    departure: string,
    villa: string,
    guests: string,
    comments: string
  ): void {
    this._api.post(environment.endpointUrl+"/newbooking", {
      "bookingFullName": fullName,
      "bookingMail": email,
      "bookingPhone": phone,
      "bookingArrival": arrival,
      "bookingDeparture": departure,
      "bookingVilla": villa,
      "bookingGuests": guests,
      "bookingComments": comments
    })
    .subscribe(
      // Success
      (apiResult: object) => {
        // Debería estar documentada la respuesta recibida del backend
        this.dataNewBooking = apiResult;
        // console.log(this.dataNewBooking);
        this.flagAlert = true;
        setTimeout(() => {this.flagAlert = false}, 6000);
        this._router.navigateByUrl('/');
      },
      // Error
      (error: string) => {console.log(error)}
    );
  }

  // Llamada PUT para editar una reserva en la base de datos
  updateBooking(
    _id: string,
    fullName: string,
    email: string,
    phone: number,
    arrival: string,
    departure: string,
    villa: string,
    guests: string,
    comments: string,
    payment: boolean,
    approved: boolean,
    stored: boolean
  ): void {
    // Se vacía el array cada vez que se carga para que en el frontend no se duplique
    this.editData = [];
    this._api.put(environment.endpointUrl+"/editbooking", {
      "_id": _id,
      "bookingFullName": fullName,
      "bookingMail": email,
      "bookingPhone": phone,
      "bookingArrival": arrival,
      "bookingDeparture": departure,
      "bookingVilla": villa,
      "bookingGuests": guests,
      "bookingComments": comments,
      "bookingPayment": payment,
      "bookingApproved": approved,
      "bookingStored": stored
    }, {'Authorization': `bearer ${localStorage.getItem("authUser")}`})
    .subscribe(
      //Success
      (apiResult: object) => {
        // console.log(apiResult);
        // Se sube como array para evitar el Error trying to diff '[object Object]'.
        this.editData.push(apiResult);
      },
      // Error
      (error: string) => {console.log(error)}
    )
  }

  // Llamada DELETE para eliminar una reserva junto a sus datos de contacto
  deleteBooking(id: string) {
    this.sub = this._api.delete(environment.endpointUrl+"/booking/" + id, {"Authorization": `bearer ${localStorage.getItem("authUser")}`})
    .subscribe(
      // Success
      (apiResult: object) => {
        this.dataDeleteBooking = apiResult;
        // console.log(this.dataDeleteBooking);
        // Sirve para recargar la página con la misma url
        window.location.reload();
      },
      // Error
      (error: string) => {console.log(error)}
    );
  }

}