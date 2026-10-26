import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Jenny Admin", template: "%s · Jenny Admin" },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.ico" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `(function(){try{var t=localStorage.getItem('jenny-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
