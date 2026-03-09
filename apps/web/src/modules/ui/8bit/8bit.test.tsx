import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "@/modules/ui/8bit/button";

describe("8bit primitives", () => {
  test("render through the local module path without runtime errors", () => {
    const markup = renderToStaticMarkup(<Button>Engage</Button>);

    expect(markup).toContain("pixel-frame");
    expect(markup).toContain("Engage");
    expect(markup).toContain("data-slot=\"button\"");
  });
});
