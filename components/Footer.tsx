import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { siteConfig, telHref, whatsappHref, mapsHref } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="bg-navy-800 text-white">
      <div className="container-px mx-auto max-w-7xl py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt={`${siteConfig.name} logo`}
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="font-extrabold leading-tight">Diadem Consult</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-skyblue-300">
                Academy
              </p>
            </div>
          </div>
          <p className="text-sm text-navy-100/80 leading-relaxed">
            {siteConfig.tagline} &mdash; a physical academy in Fadeyi, Lagos
            helping students prepare for JAMB, WAEC, NECO, GCE and university
            admission.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-skyblue-300 mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-navy-100/90">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-skyblue-300 mb-4">
            Visit / Contact
          </h3>
          <ul className="space-y-3 text-sm text-navy-100/90">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 text-skyblue-300 mt-0.5" />
              <a href={mapsHref()} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {siteConfig.location.full}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-skyblue-300" />
              <span className="flex flex-col">
                {siteConfig.contact.phones.map((p) => (
                  <a key={p} href={telHref(p)} className="hover:text-white">
                    {p}
                  </a>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle size={18} className="shrink-0 text-skyblue-300" />
              <a href={whatsappHref()} className="hover:text-white">
                WhatsApp: {siteConfig.contact.whatsapp}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-skyblue-300 mb-4">
            Opening Hours
          </h3>
          <div className="flex items-start gap-3 text-sm text-navy-100/90">
            <Clock size={18} className="shrink-0 text-skyblue-300 mt-0.5" />
            <div>
              <p className="font-semibold text-white">{siteConfig.hours.days}</p>
              <p>{siteConfig.hours.time}</p>
            </div>
          </div>
          {/* Social links intentionally omitted until provided by the organization. */}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-px mx-auto max-w-7xl py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-navy-100/70">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>{siteConfig.domain}</p>
        </div>
      </div>
    </footer>
  );
}
