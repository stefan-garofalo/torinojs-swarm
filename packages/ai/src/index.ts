import { type GatewayModelId } from "ai";
import { env } from "@torinojs-swarm/env/server";

export type AiProvider = "gateway" | "openai";

export type AiModelSelection =
  | {
      readonly provider: "gateway";
      readonly modelId: GatewayModelId;
    }
  | {
      readonly provider: "openai";
      readonly modelId: string;
    };

export const getAiModelSelection = (): AiModelSelection => {
  if (env.AI_PROVIDER === "openai") {
    return {
      provider: "openai",
      modelId: env.AI_OPENAI_MODEL,
    };
  }

  return {
    provider: "gateway",
    modelId: env.AI_GATEWAY_MODEL,
  };
};
