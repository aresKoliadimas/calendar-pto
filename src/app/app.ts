import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiDay, TuiMonth } from '@taiga-ui/cdk';
import { TuiInputDateTime } from '@taiga-ui/kit';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ALLOWANCE, CURRENT_YEAR, ONE_DOT, START_YEAR } from './constants/constants';
import { TuiButton, TuiMarkerHandler } from '@taiga-ui/core';
import { CalendarService, StorageService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [CommonModule, TuiInputDateTime, ReactiveFormsModule, FormsModule, TuiButton],
  providers: [StorageService, CalendarService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  public readonly startYear = START_YEAR;
  public year: number = CURRENT_YEAR;
  public months: TuiMonth[] = [];
  public allowance: number = ALLOWANCE;
  public remaining: number = ALLOWANCE;
  public taken: TuiDay[] = [];

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _storageService: StorageService,
    private readonly _calendarService: CalendarService,
  ) {
    const loadedYearState: { allowance: number; taken: TuiDay[] } | void =
      this._storageService.loadYearState(this.year);

    this.allowance = loadedYearState?.allowance || ALLOWANCE;
    this.taken = loadedYearState?.taken || [];
    this.months = this._calendarService.rebuildMonths(this.year);
    this.remaining = this.allowance - this.taken.length;

    this._cdr.markForCheck();
  }

  public onPrevYear(): void {
    if (this.year === START_YEAR) return;

    const previousYear: number = this.year - 1;

    this.year = previousYear;

    if (this._storageService.hasYearState(previousYear)) {
      const state: { allowance: number; taken: TuiDay[] } | void =
        this._storageService.loadYearState(previousYear);

      if (state) {
        this.allowance = state.allowance;
        this.taken = state.taken;
      }
    } else {
      this.allowance = ALLOWANCE;
      this.taken = [];
    }

    this.remaining = this.allowance - this.taken.length;
    this.months = this._calendarService.rebuildMonths(previousYear);

    this._cdr.markForCheck();
  }

  public onNextYear(): void {
    if (this.year === START_YEAR + 10) return;

    const nextYear: number = this.year + 1;

    this.year = nextYear;

    if (!this._storageService.hasYearState(nextYear)) {
      this._storageService.saveYearState(nextYear, ALLOWANCE, []);
    }

    const state: { allowance: number; taken: TuiDay[] } | void =
      this._storageService.loadYearState(nextYear);

    if (state) {
      this.allowance = state.allowance;
      this.taken = state.taken;
    } else {
      this.allowance = ALLOWANCE;
      this.taken = [];
      this._storageService.saveYearState(nextYear, this.allowance, this.taken);
    }

    this.remaining = this.allowance - this.taken.length;
    this.months = this._calendarService.rebuildMonths(this.year);

    this._cdr.markForCheck();
  }

  public readonly markerHandler: TuiMarkerHandler = (day: TuiDay) =>
    day.day % 2 === 0 ? [] : ONE_DOT;

  public onDayClick(day: TuiDay): void {
    if (day.isWeekend || this.remaining === 0) return;

    this.taken = this.taken.find((item) => item.daySame(day))
      ? this.taken.filter((item) => !item.daySame(day))
      : this.taken.concat(day);

    this.remaining = this.allowance - this.taken.length;

    this._storageService.saveYearState(this.year, this.allowance, this.taken);

    this._cdr.markForCheck();
  }
}
