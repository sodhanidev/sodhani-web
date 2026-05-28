import type { Stock } from "@/lib/data/types";

type InvestorGroups = Stock["investors"]["quarterly"];

const categoryLabels: Record<string, string> = {
  promoters: "Promoters",
  foreign_institutions: "Foreign Institutions",
  domestic_institutions: "Domestic Institutions",
  government: "Government",
  public: "Public"
};

function hasGroups(groups: InvestorGroups) {
  return Object.values(groups).some((holders) => Object.keys(holders).length > 0);
}

function getPeriods(holders: Record<string, Record<string, string>>) {
  const periods: string[] = [];

  Object.values(holders).forEach((values) => {
    Object.keys(values).forEach((period) => {
      if (!periods.includes(period)) {
        periods.push(period);
      }
    });
  });

  return periods;
}

function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category.replace(/_/gu, " ");
}

function InvestorCategoryTable({
  category,
  defaultOpen,
  holders
}: {
  category: string;
  defaultOpen?: boolean;
  holders: Record<string, Record<string, string>>;
}) {
  const holderRows = Object.entries(holders);

  if (!holderRows.length) {
    return null;
  }

  const periods = getPeriods(holders);

  return (
    <details className="investor-group" open={defaultOpen}>
      <summary>
        <span>{getCategoryLabel(category)}</span>
        <span className="investor-count">{holderRows.length} holders</span>
      </summary>
      <div className="table-wrap investor-table-wrap">
        <table className="fin-table investor-table">
          <thead>
            <tr>
              <th>Holder</th>
              {periods.map((period) => (
                <th key={period}>{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holderRows.map(([holder, values]) => (
              <tr key={holder}>
                <td>{holder}</td>
                {periods.map((period) => (
                  <td className="numeric" key={`${holder}-${period}`}>
                    {values[period] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function InvestorPeriodBlock({
  title,
  groups
}: {
  title: string;
  groups: InvestorGroups;
}) {
  const categories = Object.entries(groups).filter(([, holders]) => Object.keys(holders).length > 0);

  if (!categories.length) {
    return null;
  }

  return (
    <div className="investor-period-block">
      <h3>{title}</h3>
      <div className="investor-groups">
        {categories.map(([category, holders], index) => (
          <InvestorCategoryTable
            category={category}
            defaultOpen={index === 0}
            holders={holders}
            key={category}
          />
        ))}
      </div>
    </div>
  );
}

export function InvestorHoldings({ id, investors }: { id?: string; investors: Stock["investors"] }) {
  const hasQuarterly = hasGroups(investors.quarterly);
  const hasYearly = hasGroups(investors.yearly);

  if (!hasQuarterly && !hasYearly) {
    return null;
  }

  return (
    <section className={`panel${id ? " section-anchor" : ""}`} id={id}>
      <div className="section-title-row">
        <h2>Investor Holdings</h2>
      </div>
      <div className="investor-holdings">
        {hasQuarterly ? <InvestorPeriodBlock groups={investors.quarterly} title="Quarterly" /> : null}
        {hasYearly ? <InvestorPeriodBlock groups={investors.yearly} title="Yearly" /> : null}
      </div>
    </section>
  );
}
