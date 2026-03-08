import { queryOptions } from "@tanstack/react-query";

import { getDemoApiClient } from "@/modules/api/eden";

export const demoItemId = "demo-1" as const;

const getDemoApi = () => getDemoApiClient();

export const fetchDemoItem = async () => {
  const api = getDemoApi();

  return api.api.demo.items[demoItemId].get();
};

export type DemoItemResult = Awaited<ReturnType<typeof fetchDemoItem>>;

export const demoItemQueryOptions = queryOptions({
  queryKey: ["demo-item", demoItemId],
  queryFn: fetchDemoItem,
});

export const fetchDemoDbStatus = async () => {
  const api = getDemoApi();

  return api.api.demo.db.get();
};

export type DemoDbResult = Awaited<ReturnType<typeof fetchDemoDbStatus>>;

export const demoDbQueryOptions = queryOptions({
  queryKey: ["demo-db-status"],
  queryFn: fetchDemoDbStatus,
});
