"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/lib/site-config";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100">
      <div className="container-px mx-auto flex h-20 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt={`${siteConfig.name} logo`}
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="leading-tight">
            <span className="block font-extrabold text-navy-800 text-lg tracking-tight">
              Diadem Consult
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-skyblue-600">
              Academy
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-navy-700 hover:text-skyblue-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href={telHref(siteConfig.contact.phones[0])} className="btn-outline !px-4 !py-2.5 text-sm">
            <Phone size={16} /> Call Us
          </a>
          <a href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")} className="btn-whatsapp !px-4 !py-2.5 text-sm">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-navy-100 bg-white"
          >
            <nav className="flex flex-col gap-1 px-6 py-4">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-semibold text-navy-800 hover:bg-navy-50"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <a href={telHref(siteConfig.contact.phones[0])} className="btn-outline w-full">
                  <Phone size={18} /> Call {siteConfig.contact.phones[0]}
                </a>
                <a
                  href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")}
                  className="btn-whatsapp w-full"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
