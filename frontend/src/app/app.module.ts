import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http';

// Component
import { AppComponent } from './app.component';
import { BookingClientComponent } from './components/booking-client/booking-client.component';
import { AdminComponent } from './components/admin/admin.component';
import { BookingUserComponent } from './components/booking-user/booking-user.component';

// Services
import { DataService } from './services/data.service';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';

// Routing
import { Routes, RouterModule } from '@angular/router';

// Rutas
const misRutas: Routes = [
  {'path': 'booking', 'component': BookingClientComponent},
  {'path': 'admin', 'component': AdminComponent},
  {'path': 'adminbooking', 'component': BookingUserComponent, 'canActivate': [AuthGuard]},
  {'path': ' ', 'component': BookingClientComponent},
  {'path': '**', 'component': BookingClientComponent}
]

@NgModule({
  declarations: [
    AppComponent,
    BookingClientComponent,
    AdminComponent,
    BookingUserComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(misRutas)
  ],
  providers: [DataService, ApiService, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
