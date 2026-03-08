# Frontend Transport

- Treaty v2 is the supported Eden client in this repo. Dynamic params use the function-call shape with an object payload: `api.api.demo.items({ id: itemId }).get()`. The old bracket access pattern belonged to the deprecated `edenTreaty` client and should not be reintroduced.
- Query panels must branch on `isPending` and `error` before checking `data`. Using `!data` as a loading check hides real request failures and makes Eden transport errors look like endless loading.
