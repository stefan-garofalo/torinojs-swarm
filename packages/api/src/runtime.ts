import { Layer } from "effect"

import { DemoService } from "./features/demo/service.js"
import { GameService } from "./features/game/service.js"

export const AppRuntime = Layer.mergeAll(DemoService.Default, GameService.Default)
