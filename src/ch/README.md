# Chapter content

One file per chapter (`M15.js` = Murphy 1 ch. 15, `D3.js` = Dive into Deep Learning ch. 3, `A21.js` = Murphy 2 ch. 21).
Each file adds to the same three tables the rest of the site reads:

- `CHI[key]`: chapter intro (`why`, `builds`, `sims`)
- `SEC["M15.1"]`: section explanation (`t`) and optional key equation (`eq: [equation, meaning]`)
- `EASY["M15.1"]`: the one-line everyday version

`src/build.sh` concatenates them after `p8.js`. Plain text only: everything is HTML-escaped on render.
