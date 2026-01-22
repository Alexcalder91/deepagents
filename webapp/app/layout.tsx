import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepAgents Chat",
  description: "AI chat interface powered by the DeepAgents framework",
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
