"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, FileText, Megaphone, ShieldCheck, type LucideIcon } from "lucide-react";
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

const INITIAL_DOCUMENT_COUNT = 12;

type DocumentGridItem = {
  doc: DocLink;
  Icon: LucideIcon;
  key: keyof Stock["documents"];
  label: string;
};

export function DocumentsTabs({ documents, id }: { documents: Stock["documents"]; id?: string }) {
  const [showAll, setShowAll] = useState(false);
  const docs = documentGroups.flatMap((group) =>
    documents[group.key].map((doc): DocumentGridItem => ({ ...group, doc }))
  );

  if (!docs.length) {
    return null;
  }

  const hasMoreDocuments = docs.length > INITIAL_DOCUMENT_COUNT;
  const visibleDocs = showAll || !hasMoreDocuments ? docs : docs.slice(0, INITIAL_DOCUMENT_COUNT);

  return (
    <section className={css(styles, `documents-stream${id ? " section-anchor" : ""}`)} id={id}>
      <div className={css(styles, "documents-heading")}>
        <h2>
          Documents
          <ChevronRight size={24} strokeWidth={2.3} aria-hidden="true" />
        </h2>
      </div>

      <div className={css(styles, "documents-grid")}>
        {visibleDocs.map(({ doc, Icon, key, label }, index) => (
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

      {hasMoreDocuments ? (
        <button
          className={css(styles, "documents-show-all")}
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
        >
          <span>{showAll ? "Show less" : "Show all"}</span>
          <ChevronDown className={css(styles, "documents-show-all-icon")} size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </section>
  );
}
