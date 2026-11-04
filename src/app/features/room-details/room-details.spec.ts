import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDetails } from './room-details';

describe('RoomDetails', () => {
  let component: RoomDetails;
  let fixture: ComponentFixture<RoomDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
