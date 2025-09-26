import { PropsWithChildren } from 'react';

export type SidePaneSection = {
  title: string;
  description?: string;
  content: React.ReactNode;
};

export type SidePaneProps = PropsWithChildren<{ sections?: SidePaneSection[] }>;

export function SidePane({ sections, children }: SidePaneProps) {
  if (sections && sections.length > 0) {
    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <header>
              <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
              {section.description ? (
                <p className="text-xs text-slate-500">{section.description}</p>
              ) : null}
            </header>
            <div className="text-sm text-slate-700">{section.content}</div>
          </section>
        ))}
      </div>
    );
  }

  return <div className="space-y-6 text-sm text-slate-700">{children}</div>;
}
