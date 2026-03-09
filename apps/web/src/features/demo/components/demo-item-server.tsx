import { getDemoServerApiClient } from "@/modules/api/eden.server"

import { fetchDemoItemWithApi } from "../queries"

export async function DemoItemServerPanel() {
  const data = await fetchDemoItemWithApi(getDemoServerApiClient())

  if (data.error) {
    return <p className="text-red-500">Server route error: {JSON.stringify(data.error)}</p>
  }

  return <p className="font-medium">Server route item: {data.data.name}</p>
}
