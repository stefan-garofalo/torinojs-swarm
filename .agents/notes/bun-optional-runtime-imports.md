# Bun Optional Runtime Imports

In this repo's Bun test/runtime flow, a direct `await import("@pkg")` inside a module can still be eagerly resolved during test loading, even when the code path should stay dormant. For optional runtime-only dependencies, hide the import behind an extra indirection module/function (for example `new Function("specifier", "return import(specifier)")`) or tests may fail before your test backend override runs.
