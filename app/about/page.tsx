import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import CTA from "@/components/sections/CTA";
import { GraduationCap, HeartHandshake, ClipboardCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Diadem Consult Academy, a physical tutorial and admission-consulting academy in Fadeyi, Lagos.",
};

const values = [
  {
    icon: GraduationCap,
    title: "Mission",
    text: "To strengthen academic performance and admission clarity for students preparing for JAMB, WAEC, NECO and GCE, through structured, in-person teaching.",
  },
  {
    icon: HeartHandshake,
    title: "Vision",
    text: "To be a trusted, quietly brilliant academy that Lagos families turn to for exam preparation and honest admission guidance.",
  },
  {
    icon: ClipboardCheck,
    title: "Approach",
    text: "Combining experienced tutors, focused classes, and one-on-one consulting so no student has to navigate admissions guesswork alone.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-800">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800/95 to-skyblue-700/60" />
        <div className="container-px relative mx-auto max-w-5xl py-20 text-center">
          <span className="eyebrow text-skyblue-300">About Us</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
            Diadem Consult Academy
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-navy-100/85 leading-relaxed">
            A physical academy in Fadeyi, Lagos, dedicated to strengthening
            academic performance, admission clarity and institutional guidance
            for students across Nigeria.
          </p>
        </div>
      </section>

      <section className="section-y bg-white">
        <div className="container-px mx-auto max-w-7xl grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl2 shadow-premium">
              <Image
                src="/images/team-colleagues.jpg"
                alt="Diadem Consult Academy tutors and consultants"
                fill
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800 leading-tight">
              Guidance the Old-Fashioned Way &mdash; In Person
            </h2>
            <p className="mt-5 text-navy-700/90 leading-relaxed">
              Diadem Consult Academy brings tutors, course advisors and
              administrative leadership together under one roof at Fadeyi,
              Lagos. Rather than leaving students to figure out JAMB, WAEC,
              NECO, GCE preparation and admission paperwork on their own, we
              sit with them, class by class and form by form.
            </p>
            <p className="mt-4 text-navy-700/90 leading-relaxed">
              The academy is built to improve access, quality and structure
              in learning for senior secondary students and prospective
              undergraduates &mdash; delivered face to face, not behind a
              screen.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-navy-50/60">
        <div className="container-px mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">What Drives Us</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800">
              Mission, Vision &amp; Approach
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={0.1 * i}>
                <div className="h-full rounded-xl2 bg-white p-8 shadow-sm ring-1 ring-navy-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-white">
                    <v.icon size={22} />
                  </div>
                  <h3 className="mt-5 font-bold text-navy-800">{v.title}</h3>
                  <p className="mt-2 text-sm text-navy-700/80 leading-relaxed">
                    {v.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-white">
        <div className="container-px mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { src: "/images/tutor-male-1.jpg", alt: "Diadem Consult Academy tutor" },
            { src: "/images/tutor-female-1.jpg", alt: "Diadem Consult Academy consultant" },
            { src: "/images/students-desks.jpg", alt: "Students seated at desks during class" },
            { src: "/images/student-campus.jpg", alt: "A Diadem Consult Academy student" },
          ].map((img, i) => (
            <Reveal key={img.src} delay={0.08 * i}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 shadow-sm ring-1 ring-navy-100">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 45vw, 280px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CTA />
    </>
  );
}
