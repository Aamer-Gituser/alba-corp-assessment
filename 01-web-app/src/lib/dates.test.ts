import { describe, expect, it } from "vitest";

import {
  ARCHIVE_START,
  clampToArchive,
  isValidDateString,
  isWithinArchive,
  plateNumber,
  precedingWindow,
  shiftDate,
} from "./dates";

describe("isValidDateString", () => {
  it("accepts a real date", () => {
    expect(isValidDateString("1995-06-16")).toBe(true);
  });

  it("rejects a date that does not exist", () => {
    expect(isValidDateString("2026-02-31")).toBe(false);
  });

  it("rejects the wrong shape", () => {
    expect(isValidDateString("16-06-1995")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

describe("isWithinArchive", () => {
  it("rejects the day before the first plate", () => {
    expect(isWithinArchive("1995-06-15")).toBe(false);
  });

  it("accepts the first plate", () => {
    expect(isWithinArchive(ARCHIVE_START)).toBe(true);
  });

  it("rejects a future date", () => {
    expect(isWithinArchive("2099-01-01")).toBe(false);
  });
});

describe("shiftDate", () => {
  it("crosses a month boundary", () => {
    expect(shiftDate("1995-06-30", 1)).toBe("1995-07-01");
  });

  it("crosses a leap day", () => {
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29");
  });
});

describe("clampToArchive", () => {
  it("pulls a pre-archive date up to the first plate", () => {
    expect(clampToArchive("1990-01-01")).toBe(ARCHIVE_START);
  });
});

describe("plateNumber", () => {
  it("numbers the first plate as 1", () => {
    expect(plateNumber(ARCHIVE_START)).toBe(1);
  });

  it("numbers the next day as 2", () => {
    expect(plateNumber("1995-06-17")).toBe(2);
  });
});

describe("precedingWindow", () => {
  it("ends the day before the focal date", () => {
    expect(precedingWindow("2020-01-10", 5)).toEqual({
      start: "2020-01-05",
      end: "2020-01-09",
    });
  });

  it("never starts before the archive", () => {
    expect(precedingWindow("1995-06-18", 30).start).toBe(ARCHIVE_START);
  });
});
