import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import DesignSystemPage from "@/app/design-system/page";

describe("design system route", () => {
  test("renders the required foundation sections", () => {
    const html = renderToStaticMarkup(<DesignSystemPage />);

    expect(html).toContain("Palette");
    expect(html).toContain("Typography");
    expect(html).toContain("Controls");
    expect(html).toContain("Surfaces");
    expect(html).toContain("Motion");
    expect(html).toContain("Responsive");
  });
});
