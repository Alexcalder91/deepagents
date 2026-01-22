import type { Metadata } from "next";
import "./globals.css";
import { PromptConfigProvider } from "./contexts/PromptConfigContext";

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
      <body>
        <PromptConfigProvider>{children}</PromptConfigProvider>
      </body>
    </html>
  );
}
