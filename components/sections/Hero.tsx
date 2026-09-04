"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { siteConfig, whatsappHref, mapsHref } from "@/lib/site-config";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-800">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800/95 to-skyblue-700/70" />
      <div className="container-px relative mx-auto grid max-w-7xl gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow text-skyblue-300">Physical Academy &middot; Fadeyi, Lagos</span>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] text-white">
            Quietly Brilliant Guidance for{" "}
            <span className="text-skyblue-300">JAMB, WAEC &amp; Admission</span> Success
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg text-navy-100/85 leading-relaxed">
            Diadem Consult Academy is a real, in-person academy where students
            prepare for JAMB, WAEC, NECO and GCE, and get expert guidance on
            Post-UTME forms and university admission &mdash; taught face to
            face by experienced tutors.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <a
              href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")}
              className="btn-whatsapp"
            >
              <MessageCircle size={18} /> Chat With Us on WhatsApp
            </a>
            <a href={mapsHref()} target="_blank" rel="noopener noreferrer" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800">
              <MapPin size={18} /> Get Directions
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-navy-100/80">
            <span>{siteConfig.hours.days}</span>
            <span className="hidden sm:inline h-1 w-1 rounded-full bg-skyblue-300" />
            <span>{siteConfig.hours.time}</span>
            <span className="hidden sm:inline h-1 w-1 rounded-full bg-skyblue-300" />
            <span>{siteConfig.location.line2}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-xl2 shadow-premium ring-1 ring-white/10">
            <Image
              src="/images/classroom-live-1.jpg"
              alt="Diadem Consult Academy students in a live in-person class"
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden md:block absolute -bottom-8 -left-8 w-48 rounded-xl2 bg-white p-4 shadow-premium">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src="/images/teacher-explaining.jpg"
                alt="Diadem Consult Academy tutor explaining a lesson"
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative border-t border-white/10 bg-navy-900/40">
        <div className="container-px mx-auto max-w-7xl py-4 flex items-center justify-center gap-2 text-center text-sm text-navy-100/80">
          <ArrowRight size={16} className="text-skyblue-300" />
          <span>Post-UTME &amp; screening form guidance now available &mdash; talk to us today.</span>
        </div>
      </div>
    </section>
  );
}
