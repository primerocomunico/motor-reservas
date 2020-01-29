import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingClientComponent } from './booking-client.component';

describe('BookingClientComponent', () => {
  let component: BookingClientComponent;
  let fixture: ComponentFixture<BookingClientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookingClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
