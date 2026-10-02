import type { LucideIcon } from "lucide-react";

// Honest empty state: says plainly that there is nothing here yet. It never
// shows placeholder or invented data.
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center rounded-xl2 border-2 border-dashed border-navy-100 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-skyblue-50 text-skyblue-600">
                <Icon size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-navy-800">{title}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-700/75">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}