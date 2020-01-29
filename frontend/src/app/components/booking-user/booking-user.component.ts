import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { $ } from 'protractor';

@Component({
  selector: 'app-booking-user',
  templateUrl: './booking-user.component.html',
  styleUrls: ['./booking-user.component.scss']
})
export class BookingUserComponent implements OnInit {

  id: string;
  fullName: string;
  email: string;
  phone: number;
  arrival: string;
  departure: string;
  villa: string;
  guests: string;
  comments: string;

  // flag alert para mostrar aviso de que falta info obligatoria
  flagAlert: boolean = false;

  // Flag para mostrar el formulario de new
  activateNew: boolean = true;
  // Flag para activar el formulario de edit
  activateEdit: boolean = false;
  // Obtenemos el id de la reserva para que pueda ser editado
  idData: object;
  // Guardar los datos que se reciben para editarlos
  data: object[];
  // Obtenemos del local storage el nombre del user para mostrarlo en la navbar
  userName: string;

  // Para generar un selected de Guests
  chooseGuests: string[] = ["1", "2", "3", "4", "5", "6", "More than 6"]
  // Para generar un selected de las villas
  villas: string[] = ["Biclén", "Daniela"]

  constructor(public _activatedRouter: ActivatedRoute, public _router: Router, public _api: ApiService, public _data: DataService, public _auth: AuthService) { }

  ngOnInit() {
    this._data.allBookings();
    // Obtenemos el nombre de usuario para publicarlo en el navbar
    this.userName = localStorage.getItem("user");
  }

  // Crear una nueva reserva
  addBooking() {
    if (this.fullName == null || this.email == null || this.phone == null || this.arrival == null || this.departure == null || this.villa == null || this.guests == null) {
      // flagAlert sirve para aparecer un alert y con setTimeout lo borramos
      this.flagAlert = true;
      setTimeout(() => { this.flagAlert = false }, 5000)
    } else {
    this._data.newBooking(
      this.fullName,
      this.email,
      this.phone,
      this.arrival,
      this.departure,
      this.villa,
      this.guests,
      this.comments
    )
      // Sirve para recargar el component
      window.location.reload(false);
    }
  }

  getBooking(i: string) {
    // i es el argumento que cogemos para pasar el _id de la reserva y así obtener sus datos
    this._data.oneBooking(i);
    // Cambiamos el valor a true para mostrar el formulario
    this.activateEdit = true;
    // Cambiamos el flag a false para esconder el formulario de new reservation
    this.activateNew = false;
    // Pasamos el valor de i a idData para poder manipularlo
    //this.oneCheckbox(i);
  }

  // Llamada GET para mostrar una única reserva
  /*oneCheckbox(id: string) {
    this._api.get(environment.endpointUrl + "/booking/" + id, { 'Authorization': `bearer ${localStorage.getItem("authUser")}` }).subscribe((apiResult) => {
      this.idData = apiResult;
      console.log(this.idData);
    })
  }*/

  // Flag: Sirve para cerrar el formulario de edición
  closeEdit() {
    this.activateEdit = false;
    this.activateNew = true;
  }

  // Podemos eliminar la reserva a través del id que se pasa como argumento
  delBooking(id: string) {
    if(confirm(`If you delete this reservation, all the contact data will be lost. 
    Are you sure?`)) {
      this._data.deleteBooking(id);
    }
  }

  editBooking() {
    // Confirmamos si el dato no existe o esta vacío, por lo tanto no permitimos que se mande la info a la database
    if (this._data.oneData['bookingFullName'] == null || 
      this._data.oneData['bookingFullName'] == '' ||
      this._data.oneData['bookingMail'] == null || 
      this._data.oneData['bookingMail'] == '' || 
      this._data.oneData['bookingPhone'] == null || 
      this._data.oneData['bookingPhone'] == '' || 
      this._data.oneData['bookingArrival'] == null || 
      this._data.oneData['bookingArrival'] == '' ||
      this._data.oneData['bookingDeparture'] == null ||
      this._data.oneData['bookingDeparture'] == '' ||
      this._data.oneData['bookingVilla'] == null || 
      this._data.oneData['bookingVilla'] == '' || 
      this._data.oneData['bookingGuests'] == null ||
      this._data.oneData['bookingGuests'] == ''
      ) {
      // flagAlert sirve para aparecer un alert y con setTimeout lo borramos
      this.flagAlert = true;
      setTimeout(() => { this.flagAlert = false }, 5000)
    } else {
    this._data.updateBooking(
      this._data.oneData['_id'],
      this._data.oneData['bookingFullName'],
      this._data.oneData['bookingMail'],
      this._data.oneData['bookingPhone'],
      this._data.oneData['bookingArrival'],
      this._data.oneData['bookingDeparture'],
      this._data.oneData['bookingVilla'],
      this._data.oneData['bookingGuests'],
      this._data.oneData['bookingComments'],
      this._data.oneData['bookingPayment'],
      this._data.oneData['bookingApproved'],
      this._data.oneData['bookingStored']
    )
      // Sirve para recargar el component
      window.location.reload(false);
    }
  }

  closeUser() {
    localStorage.removeItem("authUser");
    localStorage.removeItem("user");
    this._router.navigateByUrl('/admin');
  }

  closeSession() {
      window.onbeforeunload = function () {
        localStorage.clear();
        return '';
    }
  }

}
