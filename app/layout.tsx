import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lowproptax.com"),
  title: {
    default: "Appeal Intelligence | LowPropTax",
    template: "%s | LowPropTax",
  },
  description:
    "Evidence-grounded property tax appeal research for LowPropTax analysts.",
  openGraph: {
    title: "LowPropTax Appeal Intelligence",
    description:
      "Turn prior appeals and public records into reviewable case strategy.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
