# Frontend Transport

- Eden dynamic params use bracket property access in this stack: `api.api.demo.items[itemId].get()`. Calling `items(itemId)` does not work with the generated treaty shape.
- Query panels must branch on `isPending` and `error` before checking `data`. Using `!data` as a loading check hides real request failures and makes Eden transport errors look like endless loading.

