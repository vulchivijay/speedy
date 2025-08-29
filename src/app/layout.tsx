import type { Metadata } from "next";
import MainHeader from "./components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internet Speed Test | Next.js + TypeScript",
  description: "A simple internet speed test app built with Next.js and TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MainHeader />
        {children}
        <footer className="absolute inset-x-0 bottom-0 z-50 text-center p-4 border-t border-gray-200 mt-4">
          <p>Made with ❤️ by <a href="#">Vulchi Vijaya Kumar</a></p>
        </footer>
      </body>
    </html>
  );
}
