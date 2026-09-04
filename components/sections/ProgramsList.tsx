import Reveal from "@/components/ui/Reveal";
import {
  BookOpen,
  ClipboardCheck,
  Building2,
  Users2,
  Landmark,
  Stethoscope,
} from "lucide-react";

const programs = [
  {
    icon: BookOpen,
    title: "JAMB / UTME Preparation",
    text: "In-person, subject-by-subject coaching to help students sit JAMB with confidence, with practice tests and past questions reviewed in class.",
  },
  {
    icon: BookOpen,
    title: "WAEC, NECO & GCE Classes",
    text: "Comprehensive tutorials across core and elective subjects for students sitting WAEC, NECO or the GCE (WASSCE for private candidates).",
  },
  {
    icon: ClipboardCheck,
    title: "Post-UTME & Screening Form Guidance",
    text: "One-on-one support choosing the right institution, confirming eligibility and correctly completing Post-UTME and screening forms before payment.",
  },
  {
    icon: Landmark,
    title: "University Admission Consulting",
    text: "Guidance on subject combinations, cut-off marks and admission requirements across Nigerian universities.",
  },
  {
    icon: Building2,
    title: "Polytechnic (ND / HND) Admission",
    text: "Support with ND and HND applications — full-time, part-time and ODeL routes — across federal and state polytechnics.",
  },
  {
    icon: Stethoscope,
    title: "Colleges of Nursing Sciences",
    text: "Guidance for students applying to colleges of nursing and other health-science institutions.",
  },
];

export default function ProgramsList() {
  return (
    <section className="section-y bg-navy-50/60">
      <div className="container-px mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">What We Offer</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800">
            Programs &amp; Admission Support
          </h2>
          <p className="mt-4 text-navy-700/80 leading-relaxed">
            Every program below is delivered in person at our Fadeyi academy,
            with tutors and consultants available to guide you step by step.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <Reveal key={p.title} delay={0.06 * i}>
              <div className="h-full rounded-xl2 bg-white p-7 shadow-sm ring-1 ring-navy-100 hover:shadow-premium transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
                  <p.icon size={22} />
                </div>
                <h3 className="mt-5 font-bold text-navy-800">{p.title}</h3>
                <p className="mt-2 text-sm text-navy-700/80 leading-relaxed">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3} className="mt-10 flex items-start gap-3 rounded-xl2 bg-navy-800 p-6 text-sm text-navy-100">
          <Users2 size={20} className="shrink-0 text-skyblue-300 mt-0.5" />
          <p>
            <strong className="text-white">No guesswork.</strong> Speak with
            our consultants before choosing a school or making any payment —
            we&apos;ll confirm eligibility and the correct process with you
            first.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
