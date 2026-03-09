#!/bin/sh
# -----------------------------------------------------------------------
# generate-sitemap.sh
# Runs inside the Docker container at startup (via supervisord).
# Waits for PocketBase to become healthy, then fetches all published
# recipes and blog articles and writes a full multilingual sitemap
# with hreflang alternates to the nginx web root.
#
# Requires: wget, jq  (both installed via apk in the Dockerfile)
# -----------------------------------------------------------------------

DOMAIN="https://deliciasculinarias.shop"
PB="http://127.0.0.1:8090"
OUT="/usr/share/nginx/html/sitemap.xml"
TODAY=$(date -u +%Y-%m-%d)

# ── Wait for PocketBase (up to 60 s) ────────────────────────────────────
echo "[sitemap] Aguardando PocketBase..."
i=0
until wget -qO- "$PB/api/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 12 ]; then
    echo "[sitemap] PocketBase não respondeu em 60 s — mantendo sitemap estático"
    exit 0
  fi
  sleep 5
done
echo "[sitemap] PocketBase pronto"

# ── Helper: append one <url> block ──────────────────────────────────────
# Args: $1=canonical-path  $2=lastmod  $3=changefreq  $4=priority
#       $5=pt-path  $6=en-path  $7=es-path
u() {
  printf '  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n    <xhtml:link rel="alternate" hreflang="pt"        href="%s%s"/>\n    <xhtml:link rel="alternate" hreflang="en"        href="%s%s"/>\n    <xhtml:link rel="alternate" hreflang="es"        href="%s%s"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s%s"/>\n  </url>\n' \
    "$DOMAIN" "$1" "$2" "$3" "$4" \
    "$DOMAIN" "$5" "$DOMAIN" "$6" "$DOMAIN" "$7" "$DOMAIN" "$5" \
    >> "$OUT"
}

# ── Start XML ────────────────────────────────────────────────────────────
printf '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' > "$OUT"

# ── Static pages ─────────────────────────────────────────────────────────
u "/pt"          "$TODAY" daily   1.0 /pt          /en          /es
u "/en"          "$TODAY" daily   1.0 /pt          /en          /es
u "/es"          "$TODAY" daily   1.0 /pt          /en          /es
u "/pt/receitas" "$TODAY" weekly  0.9 /pt/receitas /en/recipes  /es/recetas
u "/en/recipes"  "$TODAY" weekly  0.9 /pt/receitas /en/recipes  /es/recetas
u "/es/recetas"  "$TODAY" weekly  0.9 /pt/receitas /en/recipes  /es/recetas
u "/pt/blog"     "$TODAY" weekly  0.8 /pt/blog     /en/blog     /es/blog
u "/en/blog"     "$TODAY" weekly  0.8 /pt/blog     /en/blog     /es/blog
u "/es/blog"     "$TODAY" weekly  0.8 /pt/blog     /en/blog     /es/blog
u "/pt/sobre"    "$TODAY" monthly 0.5 /pt/sobre    /en/about    /es/nosotros
u "/en/about"    "$TODAY" monthly 0.5 /pt/sobre    /en/about    /es/nosotros
u "/es/nosotros" "$TODAY" monthly 0.5 /pt/sobre    /en/about    /es/nosotros
u "/pt/contato"  "$TODAY" monthly 0.5 /pt/contato  /en/contact  /es/contacto
u "/en/contact"  "$TODAY" monthly 0.5 /pt/contato  /en/contact  /es/contacto
u "/es/contacto" "$TODAY" monthly 0.5 /pt/contato  /en/contact  /es/contacto

# ── Recipes ──────────────────────────────────────────────────────────────
RJ=$(wget -qO- \
  "${PB}/api/collections/recipes/records?fields=slug_pt%2Cslug_en%2Cslug_es%2Cupdated&perPage=500&skipTotal=1" \
  2>/dev/null || echo '{"items":[]}')

RC=$(printf '%s' "$RJ" | jq -r '(.items // []) | length' 2>/dev/null || echo 0)
echo "[sitemap] Receitas encontradas: $RC"

printf '%s' "$RJ" | \
  jq -r '(.items // [])[] | [
    (.slug_pt // ""),
    (.slug_en // .slug_pt // ""),
    (.slug_es // .slug_pt // ""),
    (.updated // "" | .[0:10])
  ] | @tsv' 2>/dev/null | \
while IFS=$(printf '\t') read -r spt sen ses lm; do
  [ -z "$spt" ] && continue
  u "/pt/receita/$spt" "$lm" monthly 0.7 "/pt/receita/$spt" "/en/recipe/$sen"  "/es/receta/$ses"
  u "/en/recipe/$sen"  "$lm" monthly 0.7 "/pt/receita/$spt" "/en/recipe/$sen"  "/es/receta/$ses"
  u "/es/receta/$ses"  "$lm" monthly 0.7 "/pt/receita/$spt" "/en/recipe/$sen"  "/es/receta/$ses"
done

# ── Blog articles ─────────────────────────────────────────────────────────
BJ=$(wget -qO- \
  "${PB}/api/collections/blog_articles/records?fields=slug_pt%2Cslug_en%2Cslug_es%2Cupdated&perPage=500&skipTotal=1" \
  2>/dev/null || echo '{"items":[]}')

BC=$(printf '%s' "$BJ" | jq -r '(.items // []) | length' 2>/dev/null || echo 0)
echo "[sitemap] Artigos encontrados: $BC"

printf '%s' "$BJ" | \
  jq -r '(.items // [])[] | [
    (.slug_pt // ""),
    (.slug_en // .slug_pt // ""),
    (.slug_es // .slug_pt // ""),
    (.updated // "" | .[0:10])
  ] | @tsv' 2>/dev/null | \
while IFS=$(printf '\t') read -r spt sen ses lm; do
  [ -z "$spt" ] && continue
  u "/pt/blog/$spt" "$lm" monthly 0.6 "/pt/blog/$spt" "/en/blog/$sen" "/es/blog/$ses"
  u "/en/blog/$sen" "$lm" monthly 0.6 "/pt/blog/$spt" "/en/blog/$sen" "/es/blog/$ses"
  u "/es/blog/$ses" "$lm" monthly 0.6 "/pt/blog/$spt" "/en/blog/$sen" "/es/blog/$ses"
done

# ── Close XML ─────────────────────────────────────────────────────────────
printf '</urlset>\n' >> "$OUT"
echo "[sitemap] Gerado com sucesso: $OUT"
