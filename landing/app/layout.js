import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import siteData from "@/data/siteData";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteData.siteUrl),
  title: `${siteData.brand.name} | Fresh Protein Meals & Shakes in Mangalore`,
  description:
    "Fresh protein meals, protein shakes and milk at our stall opposite the gym in Mangalore. Call to pre-order and pick up in minutes.",
  openGraph: {
    title: `${siteData.brand.name} | Fresh Protein Meals & Shakes in Mangalore`,
    description: "Fresh protein meals, shakes and milk. Call to pre-order, pick up in minutes.",
    type: "website",
    locale: "en_IN",
    siteName: siteData.brand.name,
  },
};

export const viewport = { themeColor: "#71BC75" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
