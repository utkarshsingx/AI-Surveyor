import type { TokenUsage } from "@/lib/ai";

export function logTokenUsage(
  context: string,
  documentName: string,
  usage: TokenUsage
): void {
  const ts = new Date().toISOString();
  const line = [
    ts,
    "[TokenUsage]",
    context,
    `document=${documentName}`,
    `provider=${usage.provider}`,
    usage.model ? `model=${usage.model}` : "",
    `promptTokens=${usage.promptTokens}`,
    `completionTokens=${usage.completionTokens}`,
    `totalTokens=${usage.totalTokens}`,
    usage.isEstimate ? "estimate=true" : "estimate=false",
  ]
    .filter(Boolean)
    .join(" ");
  console.log(line);
}
