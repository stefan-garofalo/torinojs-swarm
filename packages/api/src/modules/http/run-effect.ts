import { Effect } from "effect";

import { DemoService } from "../../features/demo/service.js";
import { GameService } from "../../features/game/service.js";
import { AppRuntime } from "../../runtime.js";

export function runAppEffect<A, E>(effect: Effect.Effect<A, E, DemoService | GameService>) {
  return Effect.runPromise(
    effect.pipe(
      Effect.either,
      Effect.provide(AppRuntime),
    ),
  );
}
