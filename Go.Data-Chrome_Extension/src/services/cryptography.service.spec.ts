/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CryptographyService } from './cryptography.service';

describe('Service: Cryptography', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptographyService]
    });
  });

  it('should ...', inject([CryptographyService], (service: CryptographyService) => {
    expect(service).toBeTruthy();
  }));
});
