import { NextResponse } from "next/server";

export async function GET() {
  const integrations = {
    heyelsa: {
      configured: !!(process.env.HEYELSA_X402_ENDPOINT && process.env.HEYELSA_API_KEY),
      endpoint: process.env.HEYELSA_X402_ENDPOINT ? "set" : "not set",
    },
    bitgo: {
      configured: !!process.env.BITGO_ACCESS_TOKEN,
      environment: "test",
    },
    walletconnect: {
      configured: !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    },
    alchemy: {
      configured: !!process.env.NEXT_PUBLIC_ALCHEMY_ID,
    },
    contracts: {
      deployed: false, // Update after deployment
      network: "base-sepolia",
    },
  };

  const allConfigured = Object.values(integrations).every(
    (i) => !("configured" in i && i.configured === false)
  );

  return NextResponse.json({
    status: allConfigured ? "ready" : "partial",
    integrations,
    timestamp: new Date().toISOString(),
  });
}
