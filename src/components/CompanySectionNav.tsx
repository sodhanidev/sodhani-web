"use client";

import { useEffect, useRef, useState } from "react";

export type CompanySectionLink = {
  id: string;
  label: string;
};

export function CompanySectionNav({ links }: { links: CompanySectionLink[] }) {
  const [activeId, setActiveId] = useState(links[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targets = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => Boolean(element));
    let frame = 0;
    let timeout = 0;

    if (!targets.length) {
      return;
    }

    const updateActiveSection = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
        const marker = navBottom + 56;
        const current =
          targets.findLast((target) => target.getBoundingClientRect().top <= marker)?.id ?? targets[0]?.id ?? "";

        setActiveId((previous) => (previous === current ? previous : current));
      });
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);
    timeout = window.setTimeout(updateActiveSection, 0);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
      window.clearTimeout(timeout);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [links]);

  useEffect(() => {
    const activeLink = navRef.current?.querySelector<HTMLAnchorElement>('[aria-current="location"]');
    const scroller = navRef.current?.querySelector<HTMLElement>(".company-section-scroll");

    if (!activeLink || !scroller) {
      return;
    }

    const left = activeLink.offsetLeft - scroller.clientWidth / 2 + activeLink.clientWidth / 2;

    scroller.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth"
    });
  }, [activeId]);

  if (!links.length) {
    return null;
  }

  return (
    <nav className="company-section-nav" ref={navRef} aria-label="Company page sections">
      <div className="company-section-scroll">
        {links.map((link) => (
          <a
            aria-current={activeId === link.id ? "location" : undefined}
            className="company-section-link"
            href={`#${link.id}`}
            key={link.id}
            onClick={() => setActiveId(link.id)}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
