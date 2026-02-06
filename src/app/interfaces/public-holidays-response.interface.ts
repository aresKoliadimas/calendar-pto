export type PublicHolidaysResponse = PublicHolidayResponse[];

export interface PublicHolidayResponse {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: null;
  launchYear: null;
  types: string[];
}
