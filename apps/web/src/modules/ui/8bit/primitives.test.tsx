import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge } from "@/modules/ui/8bit/badge";
import { Button } from "@/modules/ui/8bit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/8bit/card";
import { Input } from "@/modules/ui/8bit/input";
import { Label } from "@/modules/ui/8bit/label";

describe("8bit primitives", () => {
  test("render through repo-local module paths", () => {
    const markup = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <CardTitle>Foundation</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="wallet">Wallet</Label>
          <Input id="wallet" placeholder="380 credits" />
          <Button>Enter chamber</Button>
          <Badge>online</Badge>
        </CardContent>
      </Card>,
    );

    expect(markup).toContain("Foundation");
    expect(markup).toContain("Enter chamber");
    expect(markup).toContain("online");
    expect(markup).toContain("pixel-frame");
  });
});
