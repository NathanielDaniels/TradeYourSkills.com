const validators = require("./validators");

describe("validators zod schemas", () => {
  test("skillCreateSchema accepts valid and rejects invalid", () => {
    const good = {
      name: "Guitar",
      description: "I teach beginner guitar lessons",
      category: "Music",
      experience: 3,
    };
    expect(() => validators.skillCreateSchema.parse(good)).not.toThrow();

    const missingName = { ...good, name: "" };
    expect(() => validators.skillCreateSchema.parse(missingName)).toThrow();

    const tooLongName = { ...good, name: "a".repeat(51) };
    expect(() => validators.skillCreateSchema.parse(tooLongName)).toThrow();

    const badExperience = { ...good, experience: 10 };
    expect(() => validators.skillCreateSchema.parse(badExperience)).toThrow();
  });

  test("skillUpdateSchema accepts partial updates", () => {
    // partial should accept only a subset
    expect(() =>
      validators.skillUpdateSchema.parse({ description: "Short" })
    ).not.toThrow();
  });

  test("skillDeleteSchema requires id", () => {
    expect(() =>
      validators.skillDeleteSchema.parse({ id: "123" })
    ).not.toThrow();
    expect(() => validators.skillDeleteSchema.parse({ id: "" })).toThrow();
  });

  test("listingCreateSchema validates required fields and lengths", () => {
    const good = {
      title: "Offer: Photography",
      description: "I can take portrait photos for events.",
      skillId: "s1",
    };
    expect(() => validators.listingCreateSchema.parse(good)).not.toThrow();

    const shortDesc = { ...good, description: "too short" }; // <10 chars
    expect(() => validators.listingCreateSchema.parse(shortDesc)).toThrow();

    const longTitle = { ...good, title: "t".repeat(101) };
    expect(() => validators.listingCreateSchema.parse(longTitle)).toThrow();
  });

  test("swapRequestCreateSchema enforces message length and required fields", () => {
    const good = {
      message: "I would like to swap skills for your listing, please consider.",
      recipientId: "u1",
      requestedListingId: "l1",
    };
    expect(() => validators.swapRequestCreateSchema.parse(good)).not.toThrow();

    const short = { ...good, message: "short" };
    expect(() => validators.swapRequestCreateSchema.parse(short)).toThrow();
  });

  test("swapRequestResponseSchema accepts allowed statuses", () => {
    expect(() =>
      validators.swapRequestResponseSchema.parse({
        status: "accepted",
        responseMessage: "ok",
      })
    ).not.toThrow();
    expect(() =>
      validators.swapRequestResponseSchema.parse({
        status: "declined",
        responseMessage: null,
      })
    ).not.toThrow();
    // invalid enum — expect a throw for unknown status
    expect(() =>
      validators.swapRequestResponseSchema.parse({ status: "other" })
    ).toThrow();
  });

  test("listingStatusSchema enforces id and isActive boolean", () => {
    expect(() =>
      validators.listingStatusSchema.parse({ id: "1", isActive: true })
    ).not.toThrow();
    expect(() =>
      validators.listingStatusSchema.parse({ id: "", isActive: true })
    ).toThrow();
  });
});
