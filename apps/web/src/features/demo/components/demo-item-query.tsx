"use client";

import { useQuery } from "@tanstack/react-query";

import { demoItemQueryOptions } from "../queries";

export default function DemoItemQueryPanel() {
  const { data, error, isPending } = useQuery(demoItemQueryOptions);

  if (isPending) {
    return <p>Loading demo item...</p>;
  }

  if (error) {
    return <p className="text-red-500">Client query error: {error.message}</p>;
  }

  if (!data) {
    return <p className="text-red-500">Client query returned no data.</p>;
  }

  if (data.error) {
    return <p className="text-red-500">Client route error: {data.error.message}</p>;
  }

  return <p className="font-medium">Client route item: {data.data.name}</p>;
}
