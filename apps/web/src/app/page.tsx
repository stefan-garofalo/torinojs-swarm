import DemoItemQueryPanel from "@/features/demo/components/demo-item-query";
import { DemoItemServerPanel } from "@/features/demo/components/demo-item-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-12">
      <h1 className="text-2xl font-semibold">torinojs-swarm demo</h1>
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-medium">Server-rendered Eden contract</h2>
        <DemoItemServerPanel />
      </section>
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-medium">Client query contract read</h2>
        <DemoItemQueryPanel />
      </section>
    </div>
  );
}
