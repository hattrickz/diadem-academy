import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="section-y bg-navy-50/60 min-h-[70vh] flex items-center">
      <div className="container-px mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt={`${siteConfig.name} logo`}
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <span className="font-extrabold text-navy-800">Diadem Consult</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-800">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-navy-700/75 max-w-sm">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl2 bg-white p-7 md:p-9 shadow-premium ring-1 ring-navy-100">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-navy-700/80">{footer}</div>}
      </div>
    </section>
  );
}
