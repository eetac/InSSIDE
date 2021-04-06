import { TestBed } from '@angular/core/testing';

import { DomManipulationService } from './dom-manipulation.service';

describe('DomManipulationService', () => {
  let service: DomManipulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DomManipulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
