import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiDay, TuiMonth } from '@taiga-ui/cdk';
import {
  TuiFieldErrorPipe,
  TuiInputDateTime,
  TuiInputNumberDirective,
  TuiInputRange,
  tuiValidationErrorsProvider,
} from '@taiga-ui/kit';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALLOWANCE, CURRENT_YEAR, ONE_DOT, START_YEAR } from './constants/constants';
import { TuiButton, TuiError, TuiMarkerHandler, TuiTextfieldComponent } from '@taiga-ui/core';
import { CalendarService, PublicHolidaysService, StorageService } from './services';
import { catchError, EMPTY, finalize, Subscription, tap } from 'rxjs';
import { PublicHolidayResponse, PublicHolidaysResponse } from './interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TuiInputDateTime,
    ReactiveFormsModule,
    FormsModule,
    TuiButton,
    TuiTextfieldComponent,
    TuiInputRange,
    TuiInputNumberDirective,
    TuiError,
    TuiFieldErrorPipe,
  ],
  providers: [
    StorageService,
    CalendarService,
    tuiValidationErrorsProvider({
      required: 'Required field',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  public readonly startYear = START_YEAR;
  public readonly allowanceControl = new FormControl<number | null>(ALLOWANCE, Validators.required);
  public isLoading: boolean = true;
  public year: number = CURRENT_YEAR;
  public months: TuiMonth[] = [];
  public allowance: number = ALLOWANCE;
  public remaining: number = ALLOWANCE;
  public taken: TuiDay[] = [];

  private _publicHolidays: { name: string; day: TuiDay }[] = [];
  private _publicHolidaysSubscription: Subscription | null = null;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _storageService: StorageService,
    private readonly _calendarService: CalendarService,
    private readonly _publicHolidaysService: PublicHolidaysService,
  ) {
    const loadedYearState: { allowance: number; taken: TuiDay[] } | void =
      this._storageService.loadYearState(this.year);

    this.allowance = loadedYearState?.allowance || ALLOWANCE;
    this.taken = loadedYearState?.taken || [];
    this.months = this._calendarService.rebuildMonths(this.year);
    this.remaining = this.allowance - this.taken.length;

    this._cdr.markForCheck();
  }

  public ngOnInit(): void {
    this._publicHolidaysSubscription = this._publicHolidaysService
      .getPublicHolidays$(this.year)
      .pipe(
        tap((holidays: PublicHolidaysResponse) => {
          this._publicHolidays = holidays.map((holiday: PublicHolidayResponse) => {
            const parsedPublicHoliday: { month: number; day: number } =
              this._calendarService.parseIsoDateToDayMonth(holiday.date);

            return {
              name: holiday.localName,
              day: new TuiDay(this.year, parsedPublicHoliday.month, parsedPublicHoliday.day),
            };
          });
        }),
        catchError(() => {
          console.error('Failed to load public holidays');

          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;

          this._cdr.markForCheck();
        }),
      )
      .subscribe();

    this.allowanceControl.valueChanges
      .pipe(
        tap((value: number | null) => {
          this.allowance = value || ALLOWANCE;
          this.remaining = this.allowance - this.taken.length;
          this._storageService.saveYearState(this.year, this.allowance, this.taken);

          this._cdr.markForCheck();
        }),
      )
      .subscribe();
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

  public readonly markerHandler: TuiMarkerHandler = (day: TuiDay) => {
    const isPublicHoliday: boolean = this._publicHolidays.some(
      ({ day: holiday }: { name: string; day: TuiDay }) => holiday.daySame(day),
    );

    return isPublicHoliday ? ONE_DOT : [];
  };

  public onDayClick(day: TuiDay): void {
    if (day.isWeekend || this.remaining === 0) return;

    this.taken = this.taken.find((item) => item.daySame(day))
      ? this.taken.filter((item) => !item.daySame(day))
      : this.taken.concat(day);

    this.remaining = this.allowance - this.taken.length;

    this._storageService.saveYearState(this.year, this.allowance, this.taken);

    this._cdr.markForCheck();
  }

  public ngOnDestroy(): void {
    this._publicHolidaysSubscription?.unsubscribe();
  }
}
