export type MessageRole = "user" | "agent" | "system";

export type SupportedToken = "ETH" | "USDC" | "cbBTC" | "DAI" | "WBTC";

export type TransactionPreview = {
  action: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedOutput: string;
  route: string;
  gasFee: string;
  stealthAddress: string;
  policyCheck: {
    passed: boolean;
    dailyLimit: string;
    spent: string;
    remaining: string;
  };
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: {
    transaction?: TransactionPreview;
    status?: "pending" | "approved" | "executed" | "failed";
    txHash?: string;
    fileverseDocId?: string;
  };
};
