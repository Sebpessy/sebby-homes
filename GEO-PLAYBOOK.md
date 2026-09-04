# Sebby Homes — AI Search Visibility Playbook (GEO)

This is your step-by-step guide to being **seen and cited by AI search** — ChatGPT,
Perplexity, Google AI Overviews, Claude, Gemini — when people ask about custom luxury home
builders in Dallas–Fort Worth.

The website foundation is already built (see "What's already done"). The highest-leverage
remaining work is **off-site**: AI systems trust a business more when it exists consistently
across the web. Do these in order.

---

## What's already done (in this repo)

- ✅ **Structured data (JSON-LD)** in `index.html` — a linked graph describing the business
  (`GeneralContractor`), founder (Seb Pessy), website, and an FAQ. This is what lets AI
  extract your who/where/what/contact with confidence.
- ✅ **`robots.txt`** — explicitly welcomes AI crawlers (GPTBot, PerplexityBot, ClaudeBot,
  Google-Extended, and more).
- ✅ **`sitemap.xml`** — lists the homepage and journal so crawlers find everything.
- ✅ **`llms.txt`** — a curated, machine-readable summary of the business for LLMs.
- ✅ **Visible FAQ** on the homepage (`#faq`) — answer-first Q&A, the format AI quotes most.
- ✅ **Journal** (`/journal/`) — a content engine for fresh, citable articles.
- ✅ **Social/meta tags** — canonical, Open Graph, Twitter cards for clean link previews.

---

## Step 1 — Google Business Profile (biggest single win)

AI "home builder in Dallas" answers lean heavily on Google's local data.

1. Go to <https://business.google.com> and create a profile for **Sebby Homes**.
2. Choose **service-area business** (you build on clients' lots) and set the area to
   **Dallas–Fort Worth** and the specific cities (Highland Park, Preston Hollow, Southlake,
   Westlake, University Park, Uptown).
3. Primary category: **Home builder**. Add secondary: **General contractor**,
   **Custom home builder**.
4. Use the exact **NAP** (must match the site everywhere): `Sebby Homes` · `469-996-3789` ·
   `seb@sebby.homes` · website `https://sebby.homes`.
5. Verify the profile, add 10+ photos (use the portfolio images), write the description using
   language from the homepage, and **ask past clients for reviews** — review count and recency
   are strong trust signals for AI.

## Step 2 — Instagram (business account)

1. Create/convert to a **business** account, handle like `@sebbyhomes`.
2. Bio: "Custom luxury home builder · Dallas–Fort Worth" + link `https://sebby.homes`.
3. Keep NAP identical. Post portfolio work with location tags.

## Step 3 — Houzz (high authority in this vertical)

1. Create a **Houzz Pro** profile for Sebby Homes.
2. Category: New Home Builders / General Contractors; location Dallas–Fort Worth.
3. Upload projects, link back to `https://sebby.homes`. Houzz pages are frequently cited by
   AI for home-building questions.

## Step 4 — LinkedIn + secondary directories

- **LinkedIn** company page for Sebby Homes (link the site; Seb as founder).
- **Bing Places** (<https://www.bingplaces.com>) — powers Copilot/Bing answers.
- **Apple Business Connect** (<https://businessconnect.apple.com>) — powers Apple/Siri.
- Consider: BuildZoom, Angi, local DFW builder associations. Same NAP everywhere.

---

## Step 5 — Wire the profiles back into the site (5 minutes, do it once)

Once the profiles above exist, add their URLs to the site so AI connects them to you:

1. **`index.html`** — find the JSON-LD block near the top (there's a `TODO` comment above it).
   Add a `sameAs` array to the `#business` entity:
   ```json
   "sameAs": [
     "https://www.google.com/maps/place/...your-GBP...",
     "https://www.instagram.com/sebbyhomes",
     "https://www.houzz.com/pro/sebbyhomes",
     "https://www.linkedin.com/company/sebby-homes"
   ]
   ```
   Put it right after the `makesOffer` block, before the closing `}` of the `#business` entity.
2. **`llms.txt`** — add the same links under a new "## Profiles" section.
3. Commit and push.

---

## Step 6 — Keep it alive (the compounding loop)

1. **Publish a journal post every few weeks, never in a batch** (see `journal/README.md`).
   High-intent titles earn citations.
2. **Neighborhood posts: one at a time, on a schedule, with real local detail.** Google's
   scaled-content-abuse enforcement targets the pattern of many near-identical location
   pages appearing at once. One neighborhood post is an asset; a stack of them published
   together is a liability. Rules:
   - **Cadence:** at most one neighborhood post per month, and never two in the same week.
     The site launched with four articles; hold that baseline rather than jumping it.
   - **Order:** write the neighborhoods where homes have actually been delivered or lots
     walked first, so the post can name real streets, lot conditions, and review outcomes.
     Knox–Henderson has a delivered residence; Highland Park is already written.
   - **Content bar:** every neighborhood post must contain things true only of that place:
     its town or city review process and realistic timeline, lot size, tree, slope and soil
     conditions, deed restrictions or architectural control, what land costs relative to the
     build, and at least one detail from a real project or lot walk there. If a paragraph
     would still be true with the neighborhood name swapped, cut it.
   - **Overlap check:** before publishing, compare the draft against every existing
     neighborhood post. Shared text should be limited to the nav, footer, and CTA band. If
     two read alike, merge them into one Park Cities or DFW-wide post instead.
   - **Wire-up:** each post gets the three edits in `journal/README.md` with the real
     publish date in `sitemap.xml`. Do not backdate.
   - **Stop rule:** no more than four neighborhood posts total, Highland Park included.
     Past that the journal starts to look like a location-page set rather than a builder
     writing about their own work.
3. **Bump `dateModified`** when you update a page — freshness triggers AI re-crawls, usually
   within days.
4. **Gather Google reviews** steadily.
5. **Post to Instagram/Houzz** consistently with the same NAP.

---

## Step 7 — Measure it

- **Google Search Console** (<https://search.google.com/search-console>) — verify
  `sebby.homes`, submit `sitemap.xml`, watch impressions/queries.
- **Bing Webmaster Tools** — submit the sitemap.
- **Google Rich Results Test** (<https://search.google.com/test/rich-results>) — paste
  `https://sebby.homes/` to confirm the structured data is valid.
- **Spot-check AI directly** every few weeks — ask ChatGPT/Perplexity: *"custom luxury home
  builder in Highland Park Dallas"* or *"who builds custom homes in Southlake TX"* and see
  whether Sebby Homes appears. Improvement typically shows within 4–8 weeks of the off-site
  work above.
