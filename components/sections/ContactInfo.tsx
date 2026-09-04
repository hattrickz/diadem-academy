import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { siteConfig, telHref, whatsappHref } from "@/lib/site-config";

export default function ContactInfo() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl grid gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="eyebrow">Get In Touch</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800">
            Visit the Academy or Contact Us
          </h2>
          <p className="mt-4 text-navy-700/80 leading-relaxed max-w-lg">
            We are a physical academy — the fastest way to get guidance is to
            speak with us directly, by phone, WhatsApp, or in person.
          </p>

          <ul className="mt-9 space-y-6">
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-bold text-navy-800">Our Location</p>
                <p className="text-sm text-navy-700/80">{siteConfig.location.full}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
                <Phone size={20} />
              </div>
              <div>
                <p className="font-bold text-navy-800">Call Us</p>
                {siteConfig.contact.phones.map((p) => (
                  <a key={p} href={telHref(p)} className="block text-sm text-navy-700/80 hover:text-skyblue-600">
                    {p}
                  </a>
                ))}
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-navy-800">WhatsApp</p>
                <a href={whatsappHref()} className="text-sm text-navy-700/80 hover:text-skyblue-600">
                  {siteConfig.contact.whatsapp}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-bold text-navy-800">Opening Hours</p>
                <p className="text-sm text-navy-700/80">
                  {siteConfig.hours.days}, {siteConfig.hours.time}
                </p>
              </div>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="h-full min-h-[380px] w-full overflow-hidden rounded-xl2 shadow-premium ring-1 ring-navy-100">
            <iframe
              title="Diadem Consult Academy location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                siteConfig.location.mapsQuery
              )}&output=embed`}
              className="h-full w-full min-h-[380px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
