import { SiteFooter } from "@/components/SiteFooter";
import { FinancialsDetailsClient } from "@/components/company/FinancialsDetailsClient";
import type { CompanyPageModel } from "@/lib/data/company-template";

export function FinancialsDetailsView({ model }: { model: CompanyPageModel }) {
  return (
    <>
      <FinancialsDetailsClient stock={model.stock} />
      <SiteFooter className="company-footer" />
    </>
  );
}
