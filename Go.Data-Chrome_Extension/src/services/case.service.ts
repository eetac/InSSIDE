import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  constructor(private http: HttpClient) {

  }
  /**
   * Given hospital, caseId gets the license from server, if the case license
   * has been authorized to this hospital, than a license and the case is retrieved from the server.
   * @returns Returns license from the server.
   * @krunal
   * @param hospital - string
   * @param hashId - string
   */
  getLicense(hospital: string, hashId: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/getLicense`, { hospital, hashId })
    .pipe(map(data => {
      // Returns a Java Object mapped!
      return data;
    }));
  }
  /**
   * Given hospital, caseId and hospital of the destination hospital. Transfers/Shares the license
   * permission to destination hospital.
   * @returns Returns a data or error both containing messages from server.
   * @krunal
   * @param hospital - string
   * @param hashId - string
   * @param hospitalToTransfer - string
   */
  transferLicense(hospital: string, hashId: string, hospitalToTransfer: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/transferLicense`, { hospital, hospitalToTransfer, hashId })
    .pipe(map(data => {
      // Returns a Java Object mapped!
      return data;
    }));
  }

}
