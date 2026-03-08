import { Layer } from "effect"
import { DemoService } from "./features/demo/service.js"

export const AppRuntime = Layer.mergeAll(DemoService.Default)
