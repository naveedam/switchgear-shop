import { describe, expect, it } from "vitest";
import { brandPath, cleanName, productPath, slugify } from "./slug";

describe("slug", () => {
  it("slugifies", () => expect(slugify("MCCB 250A / 4P – 36kA")).toBe("mccb-250a-4p-36ka"));
  it("collapses repeated words", () => expect(cleanName("Havells Havells MCB")).toBe("Havells MCB"));
  it("builds product paths", () =>
    expect(productPath({ id: "0b6e2c1a-1111-4222-8333-944445555666", name: "L&T DU 63A MCB" }))
      .toBe("/products/l-t-du-63a-mcb-0b6e2c1a-1111-4222-8333-944445555666"));
  it("builds brand paths", () => {
    expect(brandPath("Schneider Electric")).toBe("/brands/schneider-electric");
    expect(brandPath("L&T", "low-voltage-switchgear")).toBe("/brands/l-t/low-voltage-switchgear");
  });
});
