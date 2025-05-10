import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface Worktime {
  WorkDate: string;
  Names: string;
  WorkType: 1 | 2 | 3 | 4;
}

export interface ScheduleViewModel {
  arrangeOfDay: (day: dayjs.Dayjs) => Set<1 | 2 | 3 | 4> | null;
}

export function newFromScheduleApiNoTimezone(
  schedule: Array<Worktime>
): ScheduleViewModel {
  class _ScheduleViewModel implements ScheduleViewModel {
    static #keyFormat = "YYYY-MM-DD";

    #firstDay: dayjs.Dayjs;
    #lastDay: dayjs.Dayjs;
    #schedule: Map<string, Set<1 | 2 | 3 | 4>>;

    constructor() {
      this.#schedule = new Map();
      this.#firstDay = dayjs();
      this.#lastDay = dayjs().subtract(1, "day");
      for (const s of schedule) {
        const day = dayjs(s.WorkDate, "YYYY-MM-DDTHH:mm:ss", true);
        const key = day.format(_ScheduleViewModel.#keyFormat);
        if (!this.#schedule.has(key)) {
          this.#schedule.set(key, new Set());
        }
        if (s.Names.includes("yes")) {
          this.#schedule.get(key)?.add(s.WorkType);
        }

        if (day.isBefore(this.#firstDay)) {
          this.#firstDay = day;
        }
        if (day.isAfter(this.#lastDay)) {
          this.#lastDay = day;
        }
      }
    }

    arrangeOfDay(day: dayjs.Dayjs): Set<1 | 2 | 3 | 4> | null {
      if (day.isBefore(this.#firstDay) || day.isAfter(this.#lastDay)) {
        return null;
      }

      const e = this.#schedule.get(day.format(_ScheduleViewModel.#keyFormat));
      return e || new Set();
    }
  }

  return new _ScheduleViewModel();
}
