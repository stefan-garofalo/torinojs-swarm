# SSR API Runtime

- `apps/web` server rendering now instantiates `@reaping/api` in-process for Eden via a server-only module. This is faster than loopback HTTP, but it also means the web deployment must carry the same server runtime env contract needed by `@reaping/env/server`, `@reaping/auth`, and `@reaping/db`.
- `@reaping/api` is the shared contract/factory boundary. `apps/server` is the HTTP/runtime adapter; `apps/web` should consume `@reaping/api` for types and create the server-only app locally instead of importing `server/src/*`.
