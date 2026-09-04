import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const gallery = [
  { src: "/images/classroom-live-3.jpg", alt: "Tutor teaching a mathematics class at Diadem Consult Academy" },
  { src: "/images/students-attentive.jpg", alt: "Students paying close attention during class" },
  { src: "/images/classroom-live-4.jpg", alt: "Diadem Consult Academy classroom session" },
  { src: "/images/counseling-session.jpg", alt: "One-on-one guidance session with a consultant" },
];

export default function WhyUs() {
  return (
    <section className="section-y bg-white">
      <div className="container-px mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Inside the Academy</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy-800">
            Real Classrooms. Real Tutors. Real Progress.
          </h2>
          <p className="mt-4 text-navy-700/80 leading-relaxed">
            A look at students and tutors learning together, in person, at
            Diadem Consult Academy.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.map((g, i) => (
            <Reveal key={g.src} delay={0.08 * i}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 shadow-sm ring-1 ring-navy-100">
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 768px) 45vw, 260px"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
