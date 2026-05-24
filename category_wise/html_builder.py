import argparse
import math
import shutil
from dataclasses import dataclass
from html import escape
from pathlib import Path
from string import Template

import pandas as pd


PAGE_SIZE = 25

INDUSTRY_COLUMNS = [
    "sector_code",
    "sector_name",
    "group_code",
    "group_name",
    "industry_code",
    "industry_name",
    "leaf_code",
    "leaf_name",
    "description",
]

COMPANY_COLUMNS = [
    "S.No.",
    "Company Code",
    "Name",
    "CMPRs.",
    "P/E",
    "Mar CapRs.Cr.",
    "Div Yld%",
    "NP QtrRs.Cr.",
    "Qtr Profit Var%",
    "Sales QtrRs.Cr.",
    "Qtr Sales Var%",
    "ROCE%",
]

SCRAPE_META_COLUMNS = [
    "_scrape_page",
    "_scrape_url",
    "_scraped_at",
]

HIERARCHY_LEVELS = [
    ("sector_code", "sector_name"),
    ("group_code", "group_name"),
    ("industry_code", "industry_name"),
    ("leaf_code", "leaf_name"),
]

FEATURED_SECTORS = [
    ("IN01", "Commodities"),
    ("IN06", "Healthcare"),
    ("IN11", "Utilities"),
]

COLUMN_CLASSES = {
    "S.No.": "col-rownum",
    "Name": "col-name",
    "CMPRs.": "col-core",
    "P/E": "col-optional",
    "Mar CapRs.Cr.": "col-core",
    "Div Yld%": "col-extended",
    "NP QtrRs.Cr.": "col-extended",
    "Qtr Profit Var%": "col-optional",
    "Sales QtrRs.Cr.": "col-core",
    "Qtr Sales Var%": "col-optional",
    "ROCE%": "col-extended",
}


@dataclass(frozen=True)
class Node:
    code: str
    name: str
    path: tuple[str, ...]
    names: tuple[str, ...]
    depth: int

    def market_path_parts(self, page_number: int = 1) -> tuple[str, ...]:
        base = ("market", *self.path)

        if page_number <= 1:
            return base

        return (*base, "page", str(page_number))

    @property
    def page_title(self) -> str:
        return f"{self.name} Companies"


def read_industry_codes(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path, header=None, names=INDUSTRY_COLUMNS)

    for code_col in [
        "sector_code",
        "group_code",
        "industry_code",
        "leaf_code",
    ]:
        df[code_col] = df[code_col].astype(str).str.strip()

    return df


def row_path(row: pd.Series):
    return [
        (str(row[code_col]), str(row[name_col]))
        for code_col, name_col in HIERARCHY_LEVELS
    ]


def build_nodes(industry_df: pd.DataFrame) -> dict[str, Node]:
    nodes = {}

    for _, row in industry_df.iterrows():
        path = row_path(row)

        for depth in range(1, len(path) + 1):
            code = path[depth - 1][0]

            nodes[code] = Node(
                code=code,
                name=path[depth - 1][1],
                path=tuple(code for code, _ in path[:depth]),
                names=tuple(name for _, name in path[:depth]),
                depth=depth,
            )

    return nodes


def companies_for_node(companies_df: pd.DataFrame, node: Node) -> pd.DataFrame:
    level_code_col = HIERARCHY_LEVELS[node.depth - 1][0]

    return companies_df[
        companies_df[level_code_col] == node.code
    ].copy()

def direct_children(
    industry_df: pd.DataFrame,
    node: Node,
    nodes: dict[str, Node],
):
    child_codes = []

    next_depth = node.depth + 1

    if next_depth > len(HIERARCHY_LEVELS):
        return []

    child_col = HIERARCHY_LEVELS[next_depth - 1][0]
    parent_col = HIERARCHY_LEVELS[node.depth - 1][0]

    filtered_df = industry_df[
        industry_df[parent_col] == node.code
    ]

    for _, row in filtered_df.iterrows():

        child_code = row.get(child_col)

        # skip missing values
        if pd.isna(child_code):
            continue

        child_code = str(child_code).strip()

        # skip empty strings
        if not child_code:
            continue

        # skip unknown nodes
        if child_code not in nodes:
            continue

        if child_code not in child_codes:
            child_codes.append(child_code)

    return [nodes[code] for code in child_codes]


def normalize_site_root(site_root: str | None):
    if site_root is None:
        return None

    normalized = site_root.strip()

    if not normalized:
        return ""

    if normalized in {".", "./"}:
        return "./"

    return normalized.rstrip("/") + "/"


def page_site_root(
    node: Node,
    page_number: int,
    site_root: str | None,
):
    explicit_root = normalize_site_root(site_root)

    if explicit_root is not None:
        return explicit_root

    depth = len(node.market_path_parts(page_number))

    return "../" * depth


def join_href(site_root: str, *parts: str):
    cleaned_parts = [
        part.strip("/")
        for part in parts
        if part
    ]

    if not cleaned_parts:
        return site_root or "./"

    return f"{site_root}{'/'.join(cleaned_parts)}/"


def page_href(
    site_root: str,
    node: Node,
    page_number: int = 1,
):
    return join_href(
        site_root,
        *node.market_path_parts(page_number)
    )


def html_link(href: str, text: str, class_name: str = ""):
    class_attr = (
        f' class="{escape(class_name)}"'
        if class_name
        else ""
    )

    return (
        f'<a href="{escape(href)}"{class_attr}>'
        f'{escape(text)}</a>'
    )


def render_nav_links(site_root: str):
    return "\n".join(
        html_link(
            join_href(site_root, "market", code),
            label,
        )
        for code, label in FEATURED_SECTORS
    )


def render_breadcrumb(
    node: Node,
    nodes: dict[str, Node],
    site_root: str,
):
    parts = [
        f'<li>{html_link(join_href(site_root, "market"), "Industries")}</li>'
    ]

    for index, code in enumerate(node.path):
        crumb = nodes[code]

        is_current = index == len(node.path) - 1

        if is_current:
            parts.append(
                f'<li class="current">{escape(crumb.name)}</li>'
            )
        else:
            parts.append(
                f'<li>{html_link(page_href(site_root, crumb), crumb.name)}</li>'
            )

    return "\n".join(parts)


def render_child_filter(
    children,
    counts,
    site_root,
):
    if not children:
        return ""

    links = "\n".join(
        "<li>"
        + html_link(
            page_href(site_root, child),
            f"{child.name} ({counts.get(child.code, 0)})",
        )
        + "</li>"
        for child in children
    )

    return (
        '<details class="child-filter">'
        '<summary>Browse subcategories</summary>'
        f'<ul class="child-filter-menu">{links}</ul>'
        '</details>'
    )


def visible_company_columns(companies_df):
    visible_columns = [
        column
        for column in COMPANY_COLUMNS
        if (
            column in companies_df.columns
            and column != "Company Code"
        )
    ]

    if visible_columns:
        return visible_columns

    return [
        column
        for column in companies_df.columns
        if (
            column not in INDUSTRY_COLUMNS
            and column not in SCRAPE_META_COLUMNS
        )
    ]


def clean_header(column: str):
    return (
        column.replace("CMPRs.", "CMP Rs.")
        .replace("Mar CapRs.Cr.", "Mar Cap Rs.Cr.")
        .replace("NP QtrRs.Cr.", "NP Qtr Rs.Cr.")
        .replace("Sales QtrRs.Cr.", "Sales Qtr Rs.Cr.")
    )


def render_table(
    companies_df,
    page_number,
    page_size=PAGE_SIZE,
):
    visible_columns = visible_company_columns(companies_df)

    header = "".join(
        f'<th class="{COLUMN_CLASSES.get(column, "col-extended")}">'
        f'{escape(clean_header(column))}</th>'
        for column in visible_columns
    )

    rows = []

    start_index = ((page_number - 1) * page_size) + 1

    for display_index, (_, row) in enumerate(
        companies_df.iterrows(),
        start=start_index,
    ):
        cells = []

        for column in visible_columns:
            value = (
                ""
                if pd.isna(row.get(column, ""))
                else str(row.get(column, ""))
            )

            if column == "S.No.":
                value = f"{display_index}."

            class_name = COLUMN_CLASSES.get(
                column,
                "col-extended",
            )

            if column == "Name":
                company_code = row.get("Company Code", "")

                href = (
                    f"https://www.screener.in/company/{company_code}/"
                    if company_code
                    else "#"
                )

                cells.append(
                    f'<td class="{class_name}">'
                    f'<a href="{escape(href)}" target="_blank">'
                    f'{escape(value)}</a></td>'
                )
            else:
                cells.append(
                    f'<td class="{class_name}">{escape(value)}</td>'
                )

        rows.append("<tr>" + "".join(cells) + "</tr>")

    return (
        '<div class="table-block">'
        '<div class="responsive-holder">'
        '<table class="data-table">'
        f'<thead><tr>{header}</tr></thead>'
        f'<tbody>{"".join(rows)}</tbody>'
        '</table>'
        '</div>'
        '</div>'
    )


def render_empty_state(children):
    return (
        '<section class="empty-state">'
        '<h2>No companies available</h2>'
        '<p>No companies found for this category.</p>'
        '</section>'
    )


def pagination_numbers(
    current_page,
    total_pages,
    window=2,
):
    start = max(1, current_page - window)
    end = min(total_pages, current_page + window)

    pages = {
        1,
        total_pages,
        *range(start, end + 1),
    }

    return sorted(
        page
        for page in pages
        if 1 <= page <= total_pages
    )


def render_pagination(
    node,
    total,
    current_page,
    total_pages,
    site_root,
):
    if total_pages <= 1:
        return ""

    page_links = []

    if current_page > 1:
        page_links.append(
            html_link(
                page_href(
                    site_root,
                    node,
                    current_page - 1,
                ),
                "Previous",
            )
        )
    else:
        page_links.append('<span class="disabled">Previous</span>')

    previous_number = None

    for page_number in pagination_numbers(
        current_page,
        total_pages,
    ):
        if (
            previous_number is not None
            and page_number - previous_number > 1
        ):
            page_links.append('<span class="disabled">...</span>')

        class_name = (
            "active"
            if page_number == current_page
            else ""
        )

        page_links.append(
            html_link(
                page_href(site_root, node, page_number),
                str(page_number),
                class_name,
            )
        )

        previous_number = page_number

    if current_page < total_pages:
        page_links.append(
            html_link(
                page_href(
                    site_root,
                    node,
                    current_page + 1,
                ),
                "Next",
            )
        )
    else:
        page_links.append('<span class="disabled">Next</span>')

    return (
        '<nav class="pagination">'
        f'{"".join(page_links)}'
        '</nav>'
    )


def render_page(
    template,
    node,
    nodes,
    children,
    child_counts,
    page_df,
    total_count,
    current_page,
    total_pages,
    site_root_value,
):
    site_root = page_site_root(
        node,
        current_page,
        site_root_value,
    )

    table_section = (
        render_empty_state(children)
        if total_count == 0
        else render_table(page_df, current_page)
    )

    return template.safe_substitute(
        title=escape(node.page_title),
        meta_description=escape(
            f"Browse {total_count} companies in {node.name}"
        ),
        asset_href=escape(
            join_href(site_root, "assets", "market.css").rstrip("/")
        ),
        market_index_href=escape(
            join_href(site_root, "market")
        ),
        nav_links=render_nav_links(site_root),
        breadcrumb=render_breadcrumb(
            node,
            nodes,
            site_root,
        ),
        heading=escape(node.page_title),
        breadcrumb_text=escape(
            " / ".join(node.names)
        ),
        child_filter=render_child_filter(
            children,
            child_counts,
            site_root,
        ),
        page_info=escape(
            f"{total_count} companies"
        ),
        table_section=table_section,
        pagination=render_pagination(
            node,
            total_count,
            current_page,
            total_pages,
            site_root,
        ),
    )


def copy_assets(template_path: Path, output_dir: Path):
    asset_source = (
        template_path.parent
        / "assets"
        / "market.css"
    )

    asset_target = (
        output_dir
        / "assets"
        / "market.css"
    )

    asset_target.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copyfile(asset_source, asset_target)


def build_site(
    industry_df,
    companies_df,
    output_dir,
    template_path,
    site_root,
):
    output_dir = Path(output_dir)
    template_path = Path(template_path)

    template = Template(
        template_path.read_text(encoding="utf-8")
    )

    nodes = build_nodes(industry_df)

    copy_assets(template_path, output_dir)

    total_pages_written = 0

    for node in nodes.values():

        node_companies = companies_for_node(
            companies_df,
            node,
        )

        children = direct_children(
            industry_df,
            node,
            nodes,
        )

        child_counts = {
            child.code: len(
                companies_for_node(
                    companies_df,
                    child,
                )
            )
            for child in children
        }

        total_count = len(node_companies)

        total_pages = max(
            1,
            math.ceil(total_count / PAGE_SIZE),
        )

        for current_page in range(
            1,
            total_pages + 1,
        ):
            start = (current_page - 1) * PAGE_SIZE
            end = start + PAGE_SIZE

            page_df = node_companies.iloc[start:end].copy()

            html = render_page(
                template,
                node,
                nodes,
                children,
                child_counts,
                page_df,
                total_count,
                current_page,
                total_pages,
                site_root,
            )

            page_dir_parts = node.market_path_parts(
                current_page
            )

            page_dir = output_dir.joinpath(
                *page_dir_parts
            )

            page_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            page_dir.joinpath("index.html").write_text(
                html,
                encoding="utf-8",
            )

            total_pages_written += 1

    print(
        f"Generated {total_pages_written} HTML pages under {output_dir}"
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build static market pages from companies.csv"
    )

    parser.add_argument(
        "--industry-csv",
        default="industry_codes.csv",
    )

    parser.add_argument(
        "--companies",
        default="companies.csv",
    )

    parser.add_argument(
        "--output-dir",
        default="site",
    )

    parser.add_argument(
        "--template",
        default="templates/market_page.html",
    )

    parser.add_argument(
        "--site-root",
        help="Optional root prefix",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    industry_df = read_industry_codes(
        args.industry_csv
    )

    companies_df = pd.read_csv(
        args.companies
    )

    build_site(
        industry_df,
        companies_df,
        args.output_dir,
        args.template,
        args.site_root,
    )


if __name__ == "__main__":
    main()