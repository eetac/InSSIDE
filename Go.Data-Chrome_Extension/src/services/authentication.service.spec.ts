/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';

// @ts-ignore
describe('Service: Authentication', () => {
  // @ts-ignore
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticationService]
    });
  });

  // @ts-ignore
  it('should ...', inject([AuthenticationService], (service: AuthenticationService) => {
    // @ts-ignore
    expect(service).toBeTruthy();
  }));
});
