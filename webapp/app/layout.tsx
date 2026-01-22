import type { Metadata } from "next";
import "./globals.css";
import { PromptConfigProvider } from "./contexts/PromptConfigContext";
import { ChatHistoryProvider } from "./contexts/ChatHistoryContext";
import { MemoryProvider } from "./contexts/MemoryContext";

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
        <PromptConfigProvider>
          <ChatHistoryProvider>
            <MemoryProvider>{children}</MemoryProvider>
          </ChatHistoryProvider>
        </PromptConfigProvider>
      </body>
    </html>
  );
}
