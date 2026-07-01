# Sebby Homes Journal — how to publish a post

The journal is the site's **content engine for AI search**. Each post is a static HTML page
that answers a real question owners ask. Fresh, answer-first articles are what ChatGPT,
Perplexity, and Google AI Overviews quote — and each new post (and each `dateModified` bump)
prompts AI crawlers to re-visit the site.

## Publish a new post (about 15 minutes)

1. **Copy the template**
   `cp _template.html your-slug.html`
   Use a short, keyword-rich slug, e.g. `building-in-highland-park.html`.

2. **Fill in every `{{PLACEHOLDER}}`** — title, meta description, dates, image, and body.
   - **Answer-first:** the `<p class="lede">` must answer the title question in the first
     one or two sentences. Don't build up to the answer.
   - Mention **"Sebby Homes"** and the **Dallas–Fort Worth** location naturally in the body.
   - Set both `datePublished` and `dateModified` in the JSON-LD (and the visible date).
   - Pick an `og:image` from `../assets/photos/` (e.g. `kenwell_00`, `edgefield_00`, `belmont_00`).

3. **Wire it up (3 edits) so crawlers and AI find it:**
   - **`journal/index.html`** — add a `<a class="post-card">…</a>` block for the new post,
     and add it to the `blogPost` array in the page's JSON-LD.
   - **`/sitemap.xml`** — add a `<url>` entry with today's `<lastmod>`.
   - **`/llms.txt`** — add the post title + URL under the "Pages" section.

4. **Commit & push.** GitHub Pages serves it at `https://sebby.homes/journal/your-slug.html`.

## Keeping posts fresh

When you meaningfully update a post, bump `dateModified` (JSON-LD) and its `<lastmod>` in
`sitemap.xml`. Freshness is a ranking signal for AI answer engines and typically triggers a
re-crawl within a few days.

## Good post ideas (high-intent, high-citation)

- Building a custom home in Highland Park / Preston Hollow / Southlake — what to know
- How long does it take to build a custom home in DFW?
- Custom vs. production builder: what's the difference?
- What is a design-led build, and why does it save money?
- Choosing a lot in Dallas–Fort Worth: the site factors that drive cost
