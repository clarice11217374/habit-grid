import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clarice Life Commit",
  description: "Track your life commits with a GitHub-style contribution grid",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `
    (function () {
      try {
        var theme = localStorage.getItem('life-commit-theme') || 'light';
        document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
      } catch (error) {
        document.documentElement.dataset.theme = 'light';
      }
    })();
  `;

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
