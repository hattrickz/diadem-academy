// Central configuration for Diadem Consult Academy.
// Update organization-wide details here — contact info, socials, hours —
// so every component reads from a single source of truth.

export const siteConfig = {
  name: "Diadem Consult Academy",
  shortName: "Diadem Consult",
  tagline: "Quietly Brilliant",
  domain: "diademconsult.com.ng",
  url: "https://diademconsult.com.ng",

  description:
    "Diadem Consult Academy is a physical academy in Fadeyi, Lagos, offering in-person JAMB, WAEC, NECO and GCE preparation, admission guidance, and Post-UTME support delivered by experienced tutors.",

  contact: {
    phones: ["07046344793", "+2348058515301"],
    whatsapp: "+2348151314383",
    // No public mailbox has been supplied yet — leave blank until provided.
    email: "",
  },

  location: {
    line1: "Agip Bus Stop, 8/10 Shiro Street",
    line2: "Fadeyi, Lagos",
    full: "Agip Bus Stop, 8/10 Shiro Street, Fadeyi, Lagos",
    mapsQuery: "8-10 Shiro Street, Fadeyi, Lagos, Nigeria",
  },

  hours: {
    days: "Monday – Saturday",
    time: "9:00 AM – 6:00 PM",
  },

  // Social links are intentionally empty until the organization provides them.
  // Keeping this as a typed, centralized array means the footer/header can
  // simply filter on `href` being non-empty and add new entries later
  // without touching component code.
  socials: [] as { label: string; href: string }[],

  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Programs", href: "/programs" },
    { label: "Contact", href: "/contact" },
  ],
};

export function whatsappHref(message?: string) {
  const digits = siteConfig.contact.whatsapp.replace(/[^\d]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mapsHref() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    siteConfig.location.mapsQuery
  )}`;
}
