import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import ProgramsList from "@/components/sections/ProgramsList";
import WhyUs from "@/components/sections/WhyUs";
import CTA from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <ProgramsList />
      <WhyUs />
      <CTA />
    </>
  );
}
