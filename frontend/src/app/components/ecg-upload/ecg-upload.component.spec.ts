import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcgUploadComponent } from './ecg-upload.component';

describe('UploadComponent', () => {
  let component: EcgUploadComponent;
  let fixture: ComponentFixture<EcgUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcgUploadComponent],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcgUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
