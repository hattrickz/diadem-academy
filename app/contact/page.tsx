import type { Metadata } from "next";
import ContactInfo from "@/components/sections/ContactInfo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact Diadem Consult Academy at ${siteConfig.location.full}. Open ${siteConfig.hours.days}, ${siteConfig.hours.time}.`,
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-800">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800/95 to-skyblue-700/60" />
        <div className="container-px relative mx-auto max-w-4xl py-20 text-center">
          <span className="eyebrow text-skyblue-300">Contact Us</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-navy-100/85 leading-relaxed">
            Whether you have a question about a program or want to plan a
            visit, our team is ready to help.
          </p>
        </div>
      </section>
      <ContactInfo />
    </>
  );
}
