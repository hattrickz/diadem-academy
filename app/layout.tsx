import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyContactBar from "@/components/StickyContactBar";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Physical Tutorial & Admission Consulting, Fadeyi Lagos`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Diadem Consult Academy",
    "JAMB tutorial Lagos",
    "WAEC lessons Fadeyi",
    "Post-UTME consulting Lagos",
    "admission guidance Nigeria",
    "tutorial center Fadeyi Lagos",
  ],
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    telephone: siteConfig.contact.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.location.line1,
      addressLocality: "Fadeyi, Lagos",
      addressCountry: "NG",
    },
    openingHours: "Mo-Sa 09:00-18:00",
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <StickyContactBar />
      </body>
    </html>
  );
}
