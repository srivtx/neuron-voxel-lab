#!/usr/bin/env bash
# Builds ../index.html from the parts in this folder. Run from the repo root: npm run build:site
set -e
cd "$(dirname "$0")"
OUT=../index.html
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
  cat p1.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>'
  echo '<script>'
  cat p2.js p4.js p5easy.js p5.js p6a.js p6b.js p7a.js p7b.js
  printf '\nconst PRACTICE = '; cat practice.json; printf ';\n'
  printf '\nTOC = '; cat toc.json; printf ';\n'
  cat p3.js
  echo '</script></body></html>'
} > "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
