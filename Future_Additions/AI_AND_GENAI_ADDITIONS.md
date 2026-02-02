# AI / GenAI Future Additions for MagicStream Movies

This folder documents possible AI and GenAI-based enhancements for the project. None of these are implemented today; they are ideas for later.

---

## 1. Admin review → automatic ranking (LLM)

**What:** When an admin submits a movie review (`PATCH /updatereview/:imdb_id`), use an LLM to classify the review sentiment and set the ranking automatically instead of requiring the client to send a ranking.

**How:**
- If `OPENAI_API_KEY` (or similar) is set: call OpenAI (e.g. via LangChain Go) with a prompt like: “Classify this movie review into exactly one of: Excellent, Good, Average, Poor. Reply with only the rating name.”
- Map the model’s reply to your existing ranking values and update the movie.
- If no API key or call fails: keep current behavior (client sends ranking or default to Unrated).

**Where:** Backend – `AdminReviewUpdate` in the movie controller; optional helper for prompt + LLM call.

**Why:** Reduces manual work for admins and keeps ratings consistent.

---

## 2. Smarter movie recommendations (ML / embeddings)

**What:** Improve “recommended movies” beyond simple genre match (e.g. add similarity by description, past behaviour, or embeddings).

**How:**
- Option A: Store embeddings for movie titles/descriptions (or use an external API). Recommend by vector similarity (e.g. cosine) in addition to genre.
- Option B: Collaborative filtering – “users who liked X also liked Y” using watch/list data.
- Option C: Hybrid: combine genre filters + embedding similarity + ranking.

**Where:** Backend – recommendation logic (e.g. `GetRecommendedMovies` or a dedicated service); optional new collection or index for embeddings.

**Why:** More relevant suggestions and better discovery.

---

## 3. Auto-generated movie descriptions / summaries (GenAI)

**What:** For new or existing movies, generate short descriptions or summaries from title, genre, and (if available) admin review or external metadata.

**How:**
- Call an LLM with movie metadata (title, genres, review snippet) and ask for a 1–2 sentence summary or blurb.
- Store result in the movie document and show it on the frontend (e.g. detail page, cards).

**Where:** Backend – e.g. on “add movie” or a separate “generate description” admin endpoint; frontend – display the new field.

**Why:** Consistent, readable blurbs without manual copy.

---

## 4. Search with natural language (LLM / embeddings)

**What:** Let users search in plain language (e.g. “fun action movies from the 90s”) instead of only filters.

**How:**
- Option A: LLM turns the query into structured filters (genre, decade, keywords) and you run existing DB queries.
- Option B: Embed queries and movie metadata; search by vector similarity (with or without keyword filters).

**Where:** Backend – new search endpoint; optional embedding pipeline and vector index (e.g. MongoDB Atlas Vector Search or external vector DB).

**Why:** Better UX and discovery.

---

## 5. Content moderation for reviews (LLM / APIs)

**What:** Check user or admin review text for policy violations, spam, or toxicity before saving.

**How:**
- Call an LLM or moderation API (e.g. OpenAI Moderation) on review text.
- If flagged, reject or queue for human review; otherwise save as today.

**Where:** Backend – before persisting review in `AdminReviewUpdate` or any user-review endpoint.

**Why:** Safer, more compliant platform.

---

## 6. Chatbot or Q&A about movies (RAG / LLM)

**What:** A small assistant that answers questions about movies (e.g. “What’s the best thriller?” or “What did the admin say about Movie X?”).

**How:**
- Ingest movie metadata and reviews into a knowledge base (e.g. chunks + embeddings).
- On user question: retrieve relevant chunks, then call an LLM with context + question to generate an answer (RAG).

**Where:** Backend – new endpoint (e.g. `/ask` or `/chat`); optional background job to build/update the index.

**Why:** Engaging, self-service discovery and support.

---

## 7. Personalized “why this was recommended” (LLM)

**What:** For each recommended movie, show a short line like “Recommended because you like Action and this is highly rated.”

**How:**
- When building recommendations, pass user favourites and movie info to an LLM and ask for a one-sentence explanation per movie (or a template filled by LLM).

**Where:** Backend – inside or next to `GetRecommendedMovies`; frontend – show the explanation on cards or detail.

**Why:** Builds trust and clarity in recommendations.

---

## 8. Auto-tagging or genre suggestions (LLM)

**What:** When adding a movie, suggest genres or tags from title + description (or poster/metadata if available).

**How:**
- Send title (and optional description/review) to an LLM with instructions: “From this movie title/description, list 1–3 genres from: [your genre list]. Reply with genre names only.”
- Return suggestions to the admin UI; admin can accept or edit before save.

**Where:** Backend – e.g. `POST /suggest-genres` or part of add-movie flow; frontend – show suggestions in the form.

**Why:** Faster, more consistent cataloguing.

---

## 9. Summaries of multiple reviews (GenAI)

**What:** If you later support multiple reviews per movie, generate a short “consensus” summary (e.g. “Most viewers found it exciting but predictable”).

**How:**
- Aggregate review text (or embeddings), then call an LLM to produce a 1–2 sentence summary.
- Cache or store the summary and show it on the movie page.

**Where:** Backend – job or on-demand endpoint; frontend – movie detail page.

**Why:** Quick overview without reading every review.

---

## 10. Accessibility: alt text for posters (Vision / GenAI)

**What:** Generate short alt text for movie posters for screen readers.

**How:**
- When a poster is added (or in a batch job), call a vision-capable API (e.g. GPT-4V or similar) with the image and ask for one sentence of alt text.
- Store with the movie and use in `alt` attributes on the frontend.

**Where:** Backend – on upload or cron; frontend – use the stored alt text.

**Why:** Better accessibility and SEO.

---

## Implementation notes (when you add AI later)

- **Secrets:** Store API keys in env (e.g. `OPENAI_API_KEY`) or a secrets manager; never in code.
- **Cost/latency:** Prefer caching, batching, and optional features (e.g. “use AI ranking only if key is set”) so the app works without AI.
- **Fallbacks:** Always keep a non-AI path (e.g. manual ranking, genre-only recommendations) when the API is down or key is missing.
- **Libraries:** For Go, options include LangChain Go (`github.com/tmc/langchaingo`), direct OpenAI client, or provider-agnostic SDKs depending on the feature.

---

*Last updated: Future Additions folder created. No AI features are implemented in the main codebase yet.*
