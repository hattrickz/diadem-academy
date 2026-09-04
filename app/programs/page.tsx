import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import ProgramsList from "@/components/sections/ProgramsList";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Programs & Admission Support",
  description:
    "JAMB, WAEC, NECO and GCE tutorial classes, plus Post-UTME and admission guidance for universities, polytechnics and colleges of nursing — delivered in person at Diadem Consult Academy, Fadeyi, Lagos.",
};

export default function ProgramsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-800">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-800/95 to-skyblue-700/60" />
        <div className="container-px relative mx-auto grid max-w-7xl gap-10 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow text-skyblue-300">Programs</span>
            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Exam Prep &amp; Admission Guidance, In Person
            </h1>
            <p className="mt-5 text-navy-100/85 leading-relaxed max-w-lg">
              From JAMB and WAEC classes to Post-UTME and screening-form
              guidance for universities, polytechnics and colleges of nursing
              &mdash; every program is taught and supported face to face at
              our Fadeyi academy.
            </p>
          </div>
          <Reveal>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl2 shadow-premium">
              <Image
                src="/images/classroom-live-5.jpg"
                alt="A live class in session at Diadem Consult Academy"
                fill
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <ProgramsList />

      <section className="section-y bg-white">
        <div className="container-px mx-auto max-w-4xl">
          <Reveal className="text-center">
            <span className="eyebrow">Before You Apply</span>
            <h2 className="mt-3 text-3xl font-extrabold text-navy-800">
              How Our Admission Guidance Works
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Choose Your Institution", text: "Tell us the university, polytechnic or college you're interested in." },
              { step: "2", title: "Confirm Eligibility", text: "We review your results and requirements against the institution's current criteria." },
              { step: "3", title: "Guided Application", text: "We walk with you through the Post-UTME / screening form before any payment is made." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={0.1 * i}>
                <div className="rounded-xl2 bg-navy-50/60 p-7 ring-1 ring-navy-100 h-full">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-white font-bold">
                    {s.step}
                  </span>
                  <h3 className="mt-4 font-bold text-navy-800">{s.title}</h3>
                  <p className="mt-2 text-sm text-navy-700/80 leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
