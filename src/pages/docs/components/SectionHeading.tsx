export function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="docs-section text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 pt-10 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0"
    >
      {children}
    </h2>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-8 mb-3">{children}</h3>
  );
}
