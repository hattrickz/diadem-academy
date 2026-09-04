"use client";

import { Phone, MessageCircle } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/lib/site-config";

export default function StickyContactBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex md:hidden border-t border-navy-100 bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
      <a
        href={telHref(siteConfig.contact.phones[0])}
        className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-navy-800 border-r border-navy-100"
      >
        <Phone size={18} /> Call
      </a>
      <a
        href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")}
        className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[#128C7E] bg-[#DCF8C6]"
      >
        <MessageCircle size={18} /> WhatsApp
      </a>
    </div>
  );
}
