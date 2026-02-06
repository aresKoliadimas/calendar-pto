import { Injectable } from '@angular/core';
import { TuiMonth } from '@taiga-ui/cdk';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  public rebuildMonths(year: number): TuiMonth[] {
    return Array.from({ length: 12 }, (_, monthIndex) => new TuiMonth(year, monthIndex));
  }

  public parseIsoDateToDayMonth(iso: string): { month: number; day: number } {
    const [yearStr, monthStr, dayStr]: string[] = iso.split('-');

    return {
      month: Number(monthStr) - 1,
      day: Number(dayStr),
    };
  }
}
