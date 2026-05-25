"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

import { compactHost } from "@/lib/data/format";
import type { Stock } from "@/lib/data/types";

const tabs = [
  ["announcements", "Announcements"],
  ["annualReports", "Annual Reports"],
  ["creditRatings", "Credit Ratings"],
  ["concalls", "Concalls"]
] as const;

export function DocumentsTabs({ documents }: { documents: Stock["documents"] }) {
  const [active, setActive] = useState<(typeof tabs)[number][0]>("announcements");
  const docs = documents[active];

  return (
    <section className="panel">
      <div className="section-title-row">
        <h2>Documents</h2>
        <div className="tabs" aria-label="Document tabs">
          {tabs.map(([key, label]) => (
            <button
              className={key === active ? "active" : ""}
              key={key}
              type="button"
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="doc-list">
        {docs.length ? (
          docs.map((doc) => (
            <a className="doc-link" href={doc.url} key={`${active}-${doc.url}`} rel="noopener noreferrer" target="_blank">
              <span>
                <FileText size={16} aria-hidden="true" /> {doc.title}
              </span>
              <span className="host-chip">{compactHost(doc.url)}</span>
            </a>
          ))
        ) : (
          <div className="empty-state">No documents available</div>
        )}
      </div>
    </section>
  );
}
