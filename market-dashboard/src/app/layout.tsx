import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const geometricSans = Plus_Jakarta_Sans({ 
  variable: "--font-sans", 
  subsets: ["latin"],
});

const domaineDisplay = localFont({
  src: "../fonts/DomaineDisplay.otf",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Invisible Hand | Quantitative Intelligence",
  description: "Institutional-grade quantitative architecture.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${domaineDisplay.variable} ${geometricSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative selection:bg-emerald-500/25 selection:text-emerald-200">
        
        <svg
          className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.035]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#040806]">
          <div className="absolute -top-[12%] -left-[5%] w-[48vw] h-[48vw] rounded-full bg-emerald-400/12 blur-[140px] animate-blob1" />
          <div className="absolute top-[30%] -right-[8%] w-[55vw] h-[55vw] rounded-full bg-emerald-900/25 blur-[160px] animate-blob2" />
          <div 
            className="absolute -bottom-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-teal-300/10 blur-[150px] animate-blob1" 
            style={{ animationDelay: '3.5s' }} 
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
        
      </body>
    </html>
  );
}