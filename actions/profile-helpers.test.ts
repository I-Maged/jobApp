import { describe, expect, it } from "vitest";
import { csvToArr, parseYears } from "@/actions/profile";

describe("csvToArr", () => {
  it("splits, trims and drops empty entries", () => {
    expect(csvToArr("TypeScript, React ,,  Node.js ")).toEqual([
      "TypeScript",
      "React",
      "Node.js",
    ]);
  });

  it("handles a single value", () => {
    expect(csvToArr("TypeScript")).toEqual(["TypeScript"]);
  });

  it("returns an empty array for empty input", () => {
    expect(csvToArr("")).toEqual([]);
    expect(csvToArr("   ")).toEqual([]);
  });
});

describe("parseYears", () => {
  it("parses a valid non-negative integer", () => {
    expect(parseYears("5")).toBe(5);
    expect(parseYears("0")).toBe(0);
    expect(parseYears("25")).toBe(25);
  });

  it("returns null for empty input", () => {
    expect(parseYears("")).toBeNull();
    expect(parseYears("   ")).toBeNull();
  });

  it("returns null for negative and non-numeric input", () => {
    expect(parseYears("-3")).toBeNull();
    expect(parseYears("abc")).toBeNull();
  });
});
