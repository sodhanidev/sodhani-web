"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, FileText, Megaphone, ShieldCheck, type LucideIcon } from "lucide-react";
import { css } from "@/lib/css-module";
import styles from "./company/company.module.css";

import { compactHost } from "@/lib/data/format";
import type { DocLink, Stock } from "@/lib/data/types";

const documentGroups = [
  { key: "annualReports", label: "Annual Report", toggleLabel: "Annual", Icon: CalendarDays },
  { key: "announcements", label: "Announcement", toggleLabel: "Announcements", Icon: Megaphone },
  { key: "creditRatings", label: "Credit Rating", toggleLabel: "Ratings", Icon: ShieldCheck },
  { key: "concalls", label: "Concall", toggleLabel: "Concalls", Icon: FileText }
] satisfies {
  key: keyof Stock["documents"];
  label: string;
  toggleLabel: string;
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
  const availableGroups = documentGroups.filter((group) => documents[group.key].length > 0);
  const defaultGroup = availableGroups[0];
  const [showAll, setShowAll] = useState(false);
  const [activeKey, setActiveKey] = useState<keyof Stock["documents"]>(defaultGroup?.key ?? "annualReports");
  const activeGroup = availableGroups.find((group) => group.key === activeKey) ?? defaultGroup;
  const docs = activeGroup
    ? documents[activeGroup.key].map((doc): DocumentGridItem => ({ ...activeGroup, doc }))
    : [];

  if (!availableGroups.length || !activeGroup) {
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

        {availableGroups.length > 1 ? (
          <div className={css(styles, "financial-period-toggle documents-filter-toggle")} aria-label="Document type">
            {availableGroups.map((group) => (
              <button
                className={css(styles, group.key === activeGroup.key ? "active" : "")}
                type="button"
                aria-pressed={group.key === activeGroup.key}
                key={group.key}
                onClick={() => {
                  setActiveKey(group.key);
                  setShowAll(false);
                }}
              >
                {group.toggleLabel}
              </button>
            ))}
          </div>
        ) : null}
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
