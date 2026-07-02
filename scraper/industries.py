# Inc42 industries to scrape. URL: https://inc42.com/industry/{url_slug}/stories/
#
# Each entry: (url_slug, human_readable_name).
# Inc42's canonical industry slugs differ from the plain names for a few
# (healthtech / enterprisetech / cleantech have no hyphen). Slugs verified
# against https://inc42.com/industry/ on 2026-07-01.
#
# NOTE: `it`, `retail` and `startup-ecosystem` are NOT valid Inc42 industry
# profiles — those URLs 302-redirect away from /industry/ and yield 0 cards.
# They are kept here (as requested) so the run reports them explicitly; the
# scraper detects the redirect and logs why they came back empty.
INDUSTRIES = [
    ("fintech", "Fintech"),
    ("travel-tech", "Travel Tech"),
    ("electric-vehicles", "Electric Vehicles"),
    ("healthtech", "Health Tech"),
    ("edtech", "Edtech"),
    ("it", "IT"),
    ("logistics", "Logistics"),
    ("retail", "Retail"),
    ("ecommerce", "Ecommerce"),
    ("startup-ecosystem", "Startup Ecosystem"),
    ("enterprisetech", "Enterprise Tech"),
    ("cleantech", "Clean Tech"),
    ("consumer-internet", "Consumer Internet"),
    ("agritech", "Agritech"),
]
