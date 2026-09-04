import { MessageCircle, MapPin } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { whatsappHref, mapsHref, siteConfig } from "@/lib/site-config";

export default function CTA() {
  return (
    <section className="section-y bg-navy-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-navy-900 via-navy-800 to-skyblue-700/60" />
      <div className="container-px relative mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to Start? Visit or Reach Out Today.
          </h2>
          <p className="mt-4 text-navy-100/85 leading-relaxed max-w-2xl mx-auto">
            Come in for a walk-through of our programs, or send us a message
            first — our team will guide you on the right class or admission
            route for you.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappHref("Hello Diadem Consult Academy, I'd like to enquire about your programs.")}
              className="btn-whatsapp"
            >
              <MessageCircle size={18} /> Message Us on WhatsApp
            </a>
            <a
              href={mapsHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline !border-white !text-white hover:!bg-white hover:!text-navy-800"
            >
              <MapPin size={18} /> {siteConfig.location.line2}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
