import { Injectable } from '@angular/core';
import { TuiMonth } from '@taiga-ui/cdk';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  public rebuildMonths(year: number): TuiMonth[] {
    return Array.from({ length: 12 }, (_, monthIndex) => new TuiMonth(year, monthIndex));
  }
}
