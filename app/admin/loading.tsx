export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#111827]" />
        ))}
      </div>
      <div className="h-96 rounded-3xl bg-[#111827]" />
    </div>
  );
}
