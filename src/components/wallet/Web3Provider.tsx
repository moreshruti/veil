"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/lib/web3/config";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          customTheme={{
            "--ck-font-family": "var(--font-geist-mono), ui-monospace, monospace",
            "--ck-border-radius": "0px",
            "--ck-overlay-background": "rgba(0, 0, 0, 0.8)",
            "--ck-body-background": "var(--c2)",
            "--ck-body-background-secondary": "var(--c3)",
            "--ck-body-background-tertiary": "var(--c1)",
            "--ck-body-color": "var(--c12)",
            "--ck-body-color-muted": "var(--c7)",
            "--ck-primary-button-background": "var(--c12)",
            "--ck-primary-button-color": "var(--c1)",
            "--ck-primary-button-border-radius": "0px",
            "--ck-secondary-button-background": "var(--c3)",
            "--ck-secondary-button-color": "var(--c10)",
            "--ck-secondary-button-border-radius": "0px",
            "--ck-focus-color": "var(--accent)",
            "--ck-modal-box-shadow": "0 4px 24px rgba(0, 0, 0, 0.5)",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
