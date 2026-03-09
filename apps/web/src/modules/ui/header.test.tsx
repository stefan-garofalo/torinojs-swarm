import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

beforeEach(() => {
  mock.restore();
});

describe("header", () => {
  test("exposes the design-system nav without a theme toggle", async () => {
    mock.module("next/link", () => ({
      default: ({ children, href }: { children: ReactNode; href: string }) => (
        <a href={href}>{children}</a>
      ),
    }));
    mock.module("@/modules/auth/components/user-menu", () => ({
      default: () => <div>user-menu</div>,
    }));

    const { default: Header } = await import("@/modules/ui/header");
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain("Design System");
    expect(html).not.toContain("Toggle theme");
  });
});
