export interface StoredYearState {
  allowance: number;
  taken: StoredPtoDay[];
}

export interface StoredPtoDay {
  month: number;
  day: number;
}
