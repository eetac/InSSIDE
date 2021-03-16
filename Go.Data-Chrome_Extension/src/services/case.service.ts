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
   * Given email, caseId gets the license from server, if the case license
   * has been authorized to this email, than a license and the case is retrieved from the server.
   * @returns Returns license from the server.
   * @krunal
   * @param email - string
   * @param caseId - string
   */
  getLicense(email: string, caseId: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/getLicense`, { email, caseId })
    .pipe(map(data => {
      // Returns a Java Object mapped!
      return data;
    }));
  }
  /**
   * Given email, caseId and email of the destination hospital. Transfers/Shares the license
   * permission to destination hospital.
   * @returns Returns a data or error both containing messages from server.
   * @krunal
   * @param email - string
   * @param caseId - string
   * @param emailToTransfer - string
   */
  transferLicense(email: string, caseId: string, emailToTransfer: string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/transferLicense`, { email, emailToTransfer, caseId })
    .pipe(map(data => {
      // Returns a Java Object mapped!
      return data;
    }));
  }

}
