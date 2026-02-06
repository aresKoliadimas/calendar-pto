import { Injectable } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { StoredPtoDay, StoredYearState } from '../interfaces/stored-year-state.interface';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storageKey(year: number): string {
    return `calendar-pto:${year}`;
  }

  public hasYearState(year: number): boolean {
    return localStorage.getItem(this._storageKey(year)) !== null;
  }

  public saveYearState(year: number, allowance: number, taken: TuiDay[]): void {
    const payload: StoredYearState = {
      allowance,
      taken: taken.map(({ day, month }: TuiDay) => ({ day, month })),
    };

    localStorage.setItem(this._storageKey(year), JSON.stringify(payload));
  }

  public loadYearState(year: number): { allowance: number; taken: TuiDay[] } | void {
    const raw: string | null = localStorage.getItem(this._storageKey(year));

    if (!raw) return;

    try {
      const { allowance, taken }: StoredYearState = JSON.parse(raw);

      return {
        allowance,
        taken: taken.map(({ day, month }: StoredPtoDay) => new TuiDay(year, month, day)),
      };
    } catch {}
  }
}
