import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AapdaMitra — Real-Time Disaster Coordination",
  description:
    "Live disaster alerts, citizen incident reports, and nearest-available resource dispatch on one map.",
};

// Sets data-theme before hydration so there's no flash of the wrong palette.
const themeInitScript = `
  try {
    var t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
