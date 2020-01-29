import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking-client',
  templateUrl: './booking-client.component.html',
  styleUrls: ['./booking-client.component.scss']
})
export class BookingClientComponent implements OnInit {

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

  // Para generar un selected de Guests
  chooseGuests: string[] = ["1", "2", "3", "4", "5", "6", "More than 6"]
  // Para generar un selected de las villas
  villas: string[] = ["Biclén", "Daniela"]

  constructor(public _router: ActivatedRoute, public _api: ApiService, public _data: DataService) { }

  ngOnInit() {
      this._data.allBookings();
  }

  // Crear una nueva reserva
  addBooking() {
    if (this.fullName == null || this.email == null || this.phone == null || this.arrival == null || this.departure == null || this.villa == null || this.guests == null) {
      // flagAlert sirve para aparecer un alert y con setTimeout lo borramos
      this.flagAlert = true;
      setTimeout(() => {this.flagAlert = false}, 5000)
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
    }
  }

}
