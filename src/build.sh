#!/usr/bin/env bash
# Builds ../index.html from the parts in this folder. Run from the repo root: npm run build:site
set -e
cd "$(dirname "$0")"
OUT=../index.html
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="description" content="Learn machine learning from first principles: every chapter of Murphy'\''s Probabilistic ML (both volumes) and Dive into Deep Learning, with 3D voxel simulations, live equations, NumPy exercises with answers and build projects."><meta name="theme-color" content="#121a17" media="(prefers-color-scheme: dark)"><meta name="theme-color" content="#eef1ea" media="(prefers-color-scheme: light)"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta property="og:type" content="website"><meta property="og:site_name" content="Neuron Voxel Lab"><meta property="og:title" content="Neuron Voxel Lab · machine learning from first principles"><meta property="og:description" content="Three ML textbooks, every chapter, built from a single neuron upward: voxel simulations, live equations, exercises and projects with answers."><meta property="og:url" content="https://neuron-voxel-lab.vercel.app/"><meta property="og:image" content="https://neuron-voxel-lab.vercel.app/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://neuron-voxel-lab.vercel.app/og.png"><style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
  cat p1.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>'
  echo '<script>'
  cat p2.js p4.js p5easy.js p5.js p6a.js p6b.js p7a.js p7b.js p8.js
  printf '\nconst PRACTICE = '; cat practice.json; printf ';\n'
  printf '\nTOC = '; cat toc.json; printf ';\n'
  cat p3.js
  echo '</script></body></html>'
} > "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
