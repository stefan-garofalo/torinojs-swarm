import { describe, expect, test } from "bun:test";

describe("dark-only theme contract", () => {
  test("layout and providers enforce the dark-only shell", async () => {
    const layoutSource = await Bun.file(new URL("../../app/layout.tsx", import.meta.url)).text();
    const providersSource = await Bun.file(
      new URL("../app/providers.tsx", import.meta.url),
    ).text();

    expect(layoutSource).toContain('className="dark"');
    expect(providersSource).not.toContain("ThemeProvider");
  });
});
