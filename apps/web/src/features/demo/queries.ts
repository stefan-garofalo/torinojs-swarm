import { queryOptions } from "@tanstack/react-query";

import { getDemoApiClient } from "@/modules/api/eden";

export const demoItemId = "demo-1" as const;

const getDemoApi = () => getDemoApiClient();

type DemoItemRoute = ReturnType<ReturnType<typeof getDemoApiClient>["api"]["demo"]["items"]>;
type DemoItemResponse = Awaited<ReturnType<DemoItemRoute["get"]>>;
type DemoItemError = Exclude<DemoItemResponse["error"], null>;

const getDemoItemErrorMessage = (error: DemoItemError) => {
  const { value } = error;

  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  return `Request failed with status ${error.status}`;
};

export const fetchDemoItem = async () => {
  const api = getDemoApi();
  const response = await api.api.demo.items({ id: demoItemId }).get();

  if (!response.error) {
    return response;
  }

  return {
    ...response,
    error: {
      ...response.error,
      message: getDemoItemErrorMessage(response.error),
    },
  };
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
