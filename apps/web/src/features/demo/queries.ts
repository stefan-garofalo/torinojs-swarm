import { queryOptions } from "@tanstack/react-query"

import { getDemoApiClient, type DemoApiClient } from "@/modules/api/eden"

export const demoItemId = "demo-1" as const

type DemoItemRoute = ReturnType<DemoApiClient["api"]["demo"]["items"]>
type DemoItemResponse = Awaited<ReturnType<DemoItemRoute["get"]>>
type DemoItemError = Exclude<DemoItemResponse["error"], null>

const getDemoItemErrorMessage = (error: DemoItemError) => {
  const { value } = error

  if ("message" in value && typeof value.message === "string") {
    return value.message
  }

  return `Request failed with status ${error.status}`
}

export const fetchDemoItemWithApi = async (api: DemoApiClient) => {
  const response = await api.api.demo.items({ id: demoItemId }).get()

  if (!response.error) {
    return response
  }

  return {
    ...response,
    error: {
      ...response.error,
      message: getDemoItemErrorMessage(response.error),
    },
  }
}

export const fetchDemoItem = async () => fetchDemoItemWithApi(getDemoApiClient())

export type DemoItemResult = Awaited<ReturnType<typeof fetchDemoItemWithApi>>

export const demoItemQueryOptions = queryOptions({
  queryKey: ["demo-item", demoItemId],
  queryFn: fetchDemoItem,
})

export const fetchDemoDbStatusWithApi = async (api: DemoApiClient) => api.api.demo.db.get()

export const fetchDemoDbStatus = async () => fetchDemoDbStatusWithApi(getDemoApiClient())

export type DemoDbResult = Awaited<ReturnType<typeof fetchDemoDbStatusWithApi>>

export const demoDbQueryOptions = queryOptions({
  queryKey: ["demo-db-status"],
  queryFn: fetchDemoDbStatus,
})
