// Read-only list of profile fields. A null/empty value shows "Not provided"
// rather than a blank, so nothing looks broken or made up.
export default function ProfileFields({
    items,
}: {
    items: { label: string; value: string | null | undefined }[];
}) {
    return (
        <dl className="space-y-4 text-sm">
            {items.map(({ label, value }) => (
                <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-navy-700/70">
                        {label}
                    </dt>
                    <dd className="mt-1 font-medium text-navy-800 [overflow-wrap:anywhere]">
                        {value?.trim() ? (
                            value
                        ) : (
                            <span className="font-normal text-navy-700/70">Not provided</span>
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}