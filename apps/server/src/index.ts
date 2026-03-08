import { Config, Effect } from "effect";

import { app } from "./app.js";
import { AppRuntime } from "./runtime.js";
import { aiModelSelection } from "./ai.js";

const launch = Effect.gen(function* () {
  void aiModelSelection;
  const port = yield* Config.integer("PORT").pipe(Config.withDefault(3000))
  yield* Effect.sync(() =>
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    }),
  )
})

await Effect.runPromise(
  launch.pipe(Effect.provide(AppRuntime)),
)
