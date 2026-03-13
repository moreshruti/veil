import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FlowPulse } from "@/components/ui/FlowPulse";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <FlowPulse />
      <Navbar />
      <main className="flex-1 pt-14">{children}</main>
      <Footer />
    </div>
  );
}
