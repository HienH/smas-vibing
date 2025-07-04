/**
 * @fileoverview Root layout - Main app layout with providers and global styles.
 *
 * Includes SessionProvider for NextAuth and global styling for the SMAS app.
 */
import type { Metadata } from "next";
import { Knewave, Geist, Geist_Mono, Luckiest_Guy } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { APP_CONFIG } from "@/lib/constants";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic } from '@fortawesome/free-solid-svg-icons';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-knewave',
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

/**
 * @description Root layout component with providers and global configuration.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} The root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${knewave.variable} antialiased bg-gradient-to-b from-green-50 to-white`}
      >
        <SessionProvider>
          <div className="w-full flex justify-center px-4 mt-10">
            <div className="flex items-center gap-3 whitespace-nowrap  max-w-full">
              <h1 className="font-knewave text-3xl md:text-4xl   lg:text-5xl   text-green-700 leading-tight whitespace-nowrap">
                SEND ME A SONG
              </h1>
              <FontAwesomeIcon
                icon={faMusic}
                className=" text-green-700 w-12 h-12 animate-bounce"
              />
            </div>
          </div>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
