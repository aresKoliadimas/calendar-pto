import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PublicHolidaysResponse } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class PublicHolidaysService {
  constructor(private readonly _httpClient: HttpClient) {}

  public getPublicHolidays$(year: number): Observable<PublicHolidaysResponse> {
    const url = `https://date.nager.at/api/v3/publicholidays/${year}/GR`;

    return this._httpClient.get<PublicHolidaysResponse>(url);
  }
}
