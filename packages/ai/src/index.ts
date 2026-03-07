import { gateway, type GatewayModelId } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { env } from "@torinojs-swarm/env/server";

export type AiProvider = "gateway" | "openai";

export type AiModel = ReturnType<typeof openai> | ReturnType<typeof gateway>;

export type AiModelSelection =
  | {
      readonly provider: "gateway";
      readonly modelId: GatewayModelId;
    }
  | {
      readonly provider: "openai";
      readonly modelId: string;
    };

export const getAiModel = (): AiModel => {
  if (env.AI_PROVIDER === "openai") {
    const provider = createOpenAI({
      apiKey: env.AI_OPENAI_API_KEY,
      baseURL: env.AI_OPENAI_BASE_URL,
    });

    return provider(env.AI_OPENAI_MODEL);
  }

  return gateway(env.AI_GATEWAY_MODEL);
}

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
