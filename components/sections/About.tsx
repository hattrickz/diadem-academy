import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { GraduationCap, Users, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const points = [
  {
    icon: GraduationCap,
    title: "In-Person Tutorial Classes",
    text: "Structured, face-to-face lessons for JAMB, WAEC, NECO and GCE, delivered by tutors who understand the exams inside out.",
  },
  {
    icon: Users,
    title: "Admission & Post-UTME Guidance",
    text: "One-on-one guidance on choosing institutions, confirming eligibility, and completing Post-UTME and screening forms correctly.",
  },
  {
    icon: MapPin,
    title: "A Real Academy You Can Visit",
    text: `Located at ${siteConfig.location.full} — come in, meet our tutors, and see the classrooms for yourself.`,
  },
];

export default function About() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl grid gap-14 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl2 shadow-premium">
            <Image
              src="/images/classroom-live-2.jpg"
              alt="Students attending an in-person class at Diadem Consult Academy"
              fill
              sizes="(max-width: 1024px) 90vw, 560px"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <span className="eyebrow">Who We Are</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800 leading-tight">
              A Physical Academy Built to Get You Into the Right School
            </h2>
            <p className="mt-5 text-navy-700/90 leading-relaxed">
              Diadem Consult Academy strengthens academic performance and
              admission clarity for students preparing for JAMB, WAEC, NECO
              and GCE. Our tutors and consultants work with you in person,
              tackling the gaps that hold students back &mdash; poor exam
              guidance, inconsistent teaching, and confusion around admission
              requirements.
            </p>
          </Reveal>

          <div className="mt-9 space-y-6">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={0.1 * (i + 1)}>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
                    <p.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">{p.title}</h3>
                    <p className="mt-1 text-sm text-navy-700/80 leading-relaxed">
                      {p.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
