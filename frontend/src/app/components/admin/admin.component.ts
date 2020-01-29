import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  userName: string;
  userPassword: string;

  constructor(public _router: ActivatedRoute, public _api: ApiService, public _data: DataService, public _auth: AuthService) { }

  ngOnInit() {
  }

  accessUser() {
    this._auth.getUserAdmin(
    this.userName,
    this.userPassword
    )
  }

}
