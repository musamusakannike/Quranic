declare module "moment-hijri" {
  import type * as moment from "moment";

  declare module "moment" {
    interface Moment {
      iYear(): number;
      iYear(year: number): Moment;
      iMonth(): number;
      iMonth(month: number): Moment;
      iDate(): number;
      iDate(date: number): Moment;
      iDaysInMonth(): number;
    }
  }

  export = moment;
}
