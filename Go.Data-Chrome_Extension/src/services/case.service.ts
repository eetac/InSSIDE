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
   * @param caseId - string
   */
  getLicense(hospital: string, caseId: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/getLicense`, { hospital, caseId })
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
   * @param caseId - string
   * @param hospitalToTransfer - string
   */
  transferLicense(hospital: string, caseId: string, hospitalToTransfer: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/transferLicense`, { hospital, hospitalToTransfer, caseId })
    .pipe(map(data => {
      // Returns a Java Object mapped!
      return data;
    }));
  }

}
