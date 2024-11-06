/**
 * Utility class for all time related operations.
 */
export class Time {
  private constructor(private readonly ms: number) {}

  static now(): Time {
    return this.millis(Date.now());
  }

  static yesterday(): Time {
    return Time.daysAgo(1);
  }

  static fromString(string: string): Time {
    return Time.millis(new Date(string).getTime());
  }

  static tomorrow(): Time {
    return Time.now().plusDays(1);
  }

  static millisOrNull(inp: number | undefined | null): Time | undefined {
    if (inp !== undefined && inp !== null) {
      return Time.millis(inp);
    }
  }

  static millis(amount: number): Time {
    return new Time(amount);
  }

  static seconds(amount: number): Time {
    return this.millis(amount * MILLIS_IN_UNIT[TimeUnit.SECONDS]);
  }

  static minutes(amount: number): Time {
    return this.millis(amount * MILLIS_IN_UNIT[TimeUnit.MINUTES]);
  }

  static hours(amount: number): Time {
    return this.millis(amount * MILLIS_IN_UNIT[TimeUnit.HOURS]);
  }

  static days(amount: number): Time {
    return this.millis(amount * MILLIS_IN_UNIT[TimeUnit.DAYS]);
  }

  static weeks(amount: number): Time {
    return this.millis(amount * MILLIS_IN_UNIT[TimeUnit.WEEKS]);
  }

  static currentMillis(): number {
    return Time.now().toMillis();
  }

  static millisAgo(amount: number): Time {
    return Time.now().minusMillis(amount);
  }

  static secondsAgo(amount: number): Time {
    return Time.now().minusSeconds(amount);
  }

  static minutesAgo(amount: number): Time {
    return Time.now().minusMinutes(amount);
  }

  static hoursAgo(amount: number): Time {
    return Time.now().minusHours(amount);
  }

  static daysAgo(amount: number): Time {
    return Time.now().minusDays(amount);
  }

  static weeksAgo(amount: number): Time {
    return Time.now().minusWeeks(amount);
  }

  static millisFromNow(amount: number): Time {
    return Time.now().plusMillis(amount);
  }

  static secondsFromNow(amount: number): Time {
    return Time.now().plusSeconds(amount);
  }

  static minutesFromNow(amount: number): Time {
    return Time.now().plusMinutes(amount);
  }

  static hoursFromNow(amount: number): Time {
    return Time.now().plusHours(amount);
  }

  static daysFromNow(amount: number): Time {
    return Time.now().plusDays(amount);
  }

  static weeksFromNow(amount: number): Time {
    return Time.now().plusWeeks(amount);
  }

  public diffFromNow(): Time {
    return Time.now().diff(this);
  }

  public toMillis(): number {
    return this.ms;
  }

  public toSeconds(): number {
    return this.ms / MILLIS_IN_UNIT[TimeUnit.SECONDS];
  }

  public toMinutes(): number {
    return this.ms / MILLIS_IN_UNIT[TimeUnit.MINUTES];
  }

  public toHours(): number {
    return this.ms / MILLIS_IN_UNIT[TimeUnit.HOURS];
  }

  public toDays(): number {
    return this.ms / MILLIS_IN_UNIT[TimeUnit.DAYS];
  }

  public toWeeks(): number {
    return this.ms / MILLIS_IN_UNIT[TimeUnit.WEEKS];
  }

  public plusMillis(amount: number): Time {
    return new Time(this.ms + amount);
  }

  public minusMillis(amount: number): Time {
    return new Time(this.ms - amount);
  }

  private plusOfUnit(amount: number, unit: TimeUnit): Time {
    return this.plusMillis(amount * MILLIS_IN_UNIT[unit]);
  }

  private minusOfUnit(amount: number, unit: TimeUnit): Time {
    return this.minusMillis(amount * MILLIS_IN_UNIT[unit]);
  }

  public plus(time: Time): Time {
    return this.plusMillis(time.ms);
  }

  public minus(time: Time): Time {
    return this.minusMillis(time.ms);
  }

  public diff(time: Time): Time {
    return Time.millis(Math.abs(this.ms - time.ms));
  }

  public plusSeconds(amount: number): Time {
    return this.plusOfUnit(amount, TimeUnit.SECONDS);
  }

  public minusSeconds(amount: number): Time {
    return this.minusOfUnit(amount, TimeUnit.SECONDS);
  }

  public plusMinutes(amount: number): Time {
    return this.plusOfUnit(amount, TimeUnit.MINUTES);
  }

  public minusMinutes(amount: number): Time {
    return this.minusOfUnit(amount, TimeUnit.MINUTES);
  }

  public plusHours(amount: number): Time {
    return this.plusOfUnit(amount, TimeUnit.HOURS);
  }

  public minusHours(amount: number): Time {
    return this.minusOfUnit(amount, TimeUnit.HOURS);
  }

  public plusDays(amount: number): Time {
    return this.plusOfUnit(amount, TimeUnit.DAYS);
  }

  public minusDays(amount: number): Time {
    return this.minusOfUnit(amount, TimeUnit.DAYS);
  }

  public plusWeeks(amount: number): Time {
    return this.plusOfUnit(amount, TimeUnit.WEEKS);
  }

  public minusWeeks(amount: number): Time {
    return this.minusOfUnit(amount, TimeUnit.WEEKS);
  }

  public sleep(): Promise<void> {
    if (this.ms < 0) {
      throw new Error(`Can not sleep for negative time (${this.ms}ms)`);
    }
    return new Promise((resolve) =>
      setTimeout(() => resolve(undefined), this.ms)
    );
  }

  public setTime(hours: number, min?: number, sec?: number): Time {
    const date = this.toDate();
    date.setUTCHours(hours, min, sec);
    return Time.millis(date.getTime());
  }

  public toDate(): Date {
    return new Date(this.ms);
  }

  public toIsoString(): string {
    return this.toDate().toISOString();
  }

  public toIsoDateTimeString(): string {
    return `${this.toIsoDateString()} ${this.toIsoTimeString()}`;
  }

  public toIsoDateString(): string {
    return this.toIsoString().split("T")[0];
  }

  public toIsoTimeString(): string {
    return this.toIsoString().split("T")[1].split(".")[0];
  }

  public toIsoTimeStringWithoutSeconds(): string {
    const [hours, minutes] = this.toIsoTimeString().split(":");
    return `${hours}:${minutes}`;
  }

  public toLocaleDateTimeString(): string {
    const date = this.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  public toString = (): string => {
    return this.formatAsDuration();
  };

  public toMonthAndDayString(): string {
    function getDayWithSuffix(day: number): string {
      if (day === 1 || day === 21 || day === 31) {
        return `${day}st`;
      } else if (day === 2 || day === 22) {
        return `${day}nd`;
      } else if (day === 3 || day === 23) {
        return `${day}rd`;
      } else {
        return `${day}th`;
      }
    }
    const isoDateString = this.toIsoDateString();
    const date = new Date(isoDateString);
    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const dayWithSuffix = getDayWithSuffix(day);
    return `${this.toDayName()}, ${month} ${dayWithSuffix}`;
  }

  public toDayName() {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return daysOfWeek[this.toDate().getUTCDay()];
  }

  public formatAsDuration() {
    let left = this.ms;
    const daydf = Math.floor(Time.millis(left).toDays());
    left = left - Time.days(daydf).toMillis();
    const hourdf = Math.floor(Time.millis(left).toHours());
    left = left - Time.hours(hourdf).toMillis();
    const mindf = Math.floor(Time.millis(left).toMinutes());
    left = left - Time.minutes(mindf).toMillis();
    const secsdf = Math.floor(Time.millis(left).toSeconds());
    left = left - Time.seconds(secsdf).toMillis();
    let str = "";
    if (daydf) {
      str += `${daydf}d `;
    }
    if (hourdf || str.length) {
      str += `${hourdf}h `;
    }
    if (mindf || str.length) {
      str += `${mindf}m `;
    }
    if (secsdf || str.length) {
      str += `${secsdf}s `;
    }
    return str + `${left}ms`;
  }

  public formatRoundedLargestUnit(): string {
    const elapsed = this.ms;

    if (elapsed < MILLIS_IN_UNIT[TimeUnit.MINUTES]) {
      return (
        Math.round(elapsed / MILLIS_IN_UNIT[TimeUnit.SECONDS]) + " seconds"
      );
    } else if (elapsed < MILLIS_IN_UNIT[TimeUnit.HOURS]) {
      return (
        Math.round(elapsed / MILLIS_IN_UNIT[TimeUnit.MINUTES]) + " minutes"
      );
    } else if (elapsed < MILLIS_IN_UNIT[TimeUnit.DAYS]) {
      return Math.round(elapsed / MILLIS_IN_UNIT[TimeUnit.HOURS]) + " hours";
    } else if (elapsed < MILLIS_IN_UNIT[TimeUnit.DAYS] * 30) {
      return Math.round(elapsed / MILLIS_IN_UNIT[TimeUnit.DAYS]) + " days";
    } else if (elapsed < MILLIS_IN_UNIT[TimeUnit.DAYS] * 365) {
      return (
        Math.round(elapsed / (MILLIS_IN_UNIT[TimeUnit.DAYS] * 30)) + " months"
      );
    } else {
      return (
        Math.round(elapsed / (MILLIS_IN_UNIT[TimeUnit.DAYS] * 365)) + " years"
      );
    }
  }

  public gt(other: Time): boolean {
    return this.ms > other.ms;
  }

  public lt(other: Time): boolean {
    return this.ms < other.ms;
  }

  public gte(other: Time): boolean {
    return this.ms >= other.ms;
  }

  public lte(other: Time): boolean {
    return this.ms <= other.ms;
  }

  public eq(other: Time): boolean {
    return this.ms === other.ms;
  }
}

enum TimeUnit {
  MILLIS = "MILLIS",
  SECONDS = "SECONDS",
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
  WEEKS = "WEEKS",
}

const MILLIS_IN_UNIT: Record<TimeUnit, number> = {
  MILLIS: 1,
  SECONDS: 1000,
  MINUTES: 60000,
  HOURS: 3600000,
  DAYS: 86400000,
  WEEKS: 604800000,
};
