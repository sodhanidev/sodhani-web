import { CalendarDays, ChevronRight, FileText, Megaphone, ShieldCheck, type LucideIcon } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company/company.module.css";

import { compactHost } from "@/lib/data/format";
import type { DocLink, Stock } from "@/lib/data/types";

const documentGroups = [
  { key: "announcements", label: "Announcement", Icon: Megaphone },
  { key: "annualReports", label: "Annual Report", Icon: CalendarDays },
  { key: "creditRatings", label: "Credit Rating", Icon: ShieldCheck },
  { key: "concalls", label: "Concall", Icon: FileText }
] satisfies {
  key: keyof Stock["documents"];
  label: string;
  Icon: LucideIcon;
}[];

type DocumentGridItem = {
  doc: DocLink;
  Icon: LucideIcon;
  key: keyof Stock["documents"];
  label: string;
};

export function DocumentsTabs({ documents, id }: { documents: Stock["documents"]; id?: string }) {
  const docs = documentGroups.flatMap((group) =>
    documents[group.key].map((doc): DocumentGridItem => ({ ...group, doc }))
  );

  if (!docs.length) {
    return null;
  }

  return (
    <section className={css(styles, `documents-stream${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "documents-heading")}>
        <h2>
          Documents
          <ChevronRight size={24} strokeWidth={2.3} aria-hidden="true" />
        </h2>
      </div>

      <div className={css(styles, "documents-grid")}>
        {docs.map(({ doc, Icon, key, label }, index) => (
          <a
            className={css(styles, "document-news-item")}
            href={doc.url}
            key={`${key}-${doc.url}-${index}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className={css(styles, "document-meta")}>
              <span className={css(styles, `document-badge ${key}`)} aria-hidden="true">
                <Icon size={11} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
              <span aria-hidden="true">·</span>
              <span>{compactHost(doc.url)}</span>
            </span>
            <span className={css(styles, "document-title")}>{doc.title}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
