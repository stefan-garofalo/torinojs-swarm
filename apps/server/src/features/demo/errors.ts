import { Schema } from "effect"

export class DemoItemNotFoundError extends Schema.TaggedError<DemoItemNotFoundError>()(
  "DemoItemNotFound",
  {
    itemId: Schema.String,
    message: Schema.String,
  },
) {}

export class DemoDatabaseUnavailableError extends Schema.TaggedError<DemoDatabaseUnavailableError>()(
  "DemoDatabaseUnavailable",
  {
    message: Schema.String,
  },
) {}
