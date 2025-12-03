import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickTutor - Instant Tutoring",
  description: "Get instant tutoring help, like Grab but for tutors",
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

