/** Shared form error display — message banner + per-field error list. */
export default function FormErrors({
  message,
  errors,
}: {
  message?: string;
  errors?: Record<string, string[]>;
}) {
  return (
    <>
      {message && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3">
          <p className="text-xs text-red-500 font-mono">{message}</p>
        </div>
      )}
      {errors && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 space-y-1">
          {Object.entries(errors).map(([field, msgs]) => (
            <p key={field} className="text-xs text-red-500 font-mono">
              {field}: {msgs.join(", ")}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
