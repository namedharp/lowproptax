import type { Metadata } from "next";
import "./globals.css";
import { MarketingShell } from "@/components/ui/MarketingShell";

export const metadata: Metadata = {
  title: {
    default: "LowPropTax - Lower Your Property Taxes",
    template: "%s | LowPropTax",
  },
  description:
    "Professional property tax appeal services. Save thousands on your property taxes with our full-service appeals, DIY tools, and investor portfolio management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <MarketingShell>{children}</MarketingShell>
      </body>
    </html>
  );
}
