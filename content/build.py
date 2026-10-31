"""Runs every solution, captures real output, writes src/practice.json and notebooks/*.ipynb.
Usage (from repo root): python3 content/build.py"""
import json, re, subprocess, sys, textwrap, os
sys.path.insert(0, os.path.dirname(__file__))
from exercises import EX
from exercises_more import MORE_EX
from projects import PROJECTS
from projects_more import MORE
EX = EX + MORE_EX
PROJECTS = PROJECTS + MORE

BOOK_META = {
    "M": ("murphy1", "Murphy 1"),
    "D": ("d2l", "D2L"),
    "A": ("murphy2", "Murphy 2"),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "srivtx/neuron-voxel-lab"
COLAB = f"https://colab.research.google.com/github/{REPO}/blob/main/notebooks/"
SITE = "https://neuron-voxel-lab.vercel.app"
PRE = "import matplotlib\nmatplotlib.use('Agg')\n"

def starter(code):
    out = []
    for line in code.split("\n"):
        if "##" not in line:
            out.append(line); continue
        body, hint = line.split("##", 1)
        hint = hint.strip(); body = body.rstrip()
        head, sep, last = body.rpartition("; ")
        target = last if sep else body
        m = re.match(r"^(\s*)(.+?)\s*(=|\+=|-=|\*=|/=)\s(?!=)", target)
        ind = re.match(r"^(\s*)", target).group(1)
        if target.strip().startswith("return "): rep = f"{ind}return ...  # TODO: {hint}"
        elif m: rep = f"{m.group(1)}{m.group(2)} {m.group(3)} ...  # TODO: {hint}"
        else: rep = f"{ind}...  # TODO: {hint}"
        out.append((head + sep + rep.lstrip()) if sep else rep)
    return "\n".join(out)

def clean(code):  # remove the ## markers from the solution
    return "\n".join(re.sub(r"\s*##\s*(.*)$", lambda m: "  # " + m.group(1), l) if "##" in l else l for l in code.split("\n"))

def run(code, timeout=300):
    r = subprocess.run([sys.executable, "-c", PRE + code], capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise SystemExit(f"FAILED:\n{code}\n---\n{r.stderr}")
    return r.stdout.rstrip()

def run_steps(steps):
    """Run project steps in one interpreter, capturing output per step."""
    prog = PRE + "import io, contextlib\n_outs = []\n"
    for s in steps:
        if s.get("code"):
            prog += f"_b = io.StringIO()\nwith contextlib.redirect_stdout(_b):\n{textwrap.indent(clean(s['code']), '    ')}\n_outs.append(_b.getvalue())\n"
        else:
            prog += "_outs.append('')\n"
    prog += "import json; print(json.dumps(_outs))\n"
    r = subprocess.run([sys.executable, "-c", prog], capture_output=True, text=True, timeout=900)
    if r.returncode != 0: raise SystemExit("PROJECT FAILED:\n" + r.stderr)
    return [o.rstrip() for o in json.loads(r.stdout.strip().split("\n")[-1])]

def md(src): return {"cell_type": "markdown", "metadata": {}, "source": src}
def cc(src, form=False):
    c = {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": src}
    if form: c["metadata"]["cellView"] = "form"
    return c
def nb(cells, name):
    return {"cells": cells, "metadata": {"colab": {"provenance": [], "name": name}, "kernelspec": {"display_name": "Python 3", "name": "python3"}, "language_info": {"name": "python"}}, "nbformat": 4, "nbformat_minor": 0}
def details(summary, body): return f"<details><summary><b>{summary}</b></summary>\n\n{body}\n\n</details>"

out = {"exercises": [], "projects": [], "colab": COLAB}
os.makedirs(f"{ROOT}/notebooks", exist_ok=True)
by_ch = {}
for e in EX:
    e = dict(e)
    if e["kind"] == "code":
        e["output"] = run(clean(e["code"]))
        e["starter"] = starter(e["code"]); e["solution"] = clean(e["code"]); del e["code"]
        print(f"ok  {e['id']:>4}  {e['title']}")
    bk, n = e["ch"][0], int(e["ch"][1:])
    slug, _ = BOOK_META[bk]
    e["notebook"] = f"{slug}_ch{n:02d}_practice.ipynb"
    by_ch.setdefault((bk, n), []).append(e); out["exercises"].append(e)

for (bk, n), items in by_ch.items():
    slug, btitle = BOOK_META[bk]
    cells = [md(f"# {btitle} · Chapter {n} · Practice\n\nFrom **Neuron Voxel Lab** ({SITE}/#{bk}{n}). Each exercise has a question, a hint, and an answer that stays hidden until you click.\n\n**How to use:** try the starter cell first (fill in the `...` TODOs), then compare with the hidden solution cell (double-click its title to see the code), then open the answer.")]
    for e in items:
        cells.append(md(f"## {e['id']} · {e['title']}  \n*Section §{e['sec']} · {e['kind']}*\n\n{e['q']}\n\n" + details("Hint", e["hint"])))
        if e["kind"] == "code":
            cells.append(cc("# Your turn: replace each ... with code\n" + e["starter"]))
            cells.append(cc("# @title Solution (double-click to show the code)\n" + e["solution"], form=True))
            cells.append(md(details("Answer and explanation", e["answer"] + "\n\nExpected output:\n```\n" + e["output"] + "\n```")))
        else:
            cells.append(md("✍️ *Write your answer here (double-click to edit).*"))
            cells.append(md(details("Worked answer", e["answer"])))
    json.dump(nb(cells, f"{btitle} ch {n} practice"), open(f"{ROOT}/notebooks/{slug}_ch{n:02d}_practice.ipynb", "w"), indent=1, ensure_ascii=False)

for p in PROJECTS:
    p = json.loads(json.dumps(p))
    outs = run_steps(p["steps"])
    cells = [md(f"# Project · {p['title']}\n\nFrom **Neuron Voxel Lab** ({SITE}). {p['blurb']}\n\nWork through the milestones in order; each builds on the previous cell's variables. Solutions are hidden: double-click a solution cell's title to reveal it.")]
    for i, (s, o) in enumerate(zip(p["steps"], outs), 1):
        s["output"] = o
        cells.append(md(f"## Milestone {i} · {s['title']}\n\n{s['q']}"))
        if s.get("code"):
            s["starter"] = starter(s["code"]); s["solution"] = clean(s["code"]); del s["code"]
            cells.append(cc("# Your turn\n" + s["starter"]))
            cells.append(cc(f"# @title Solution {i} (double-click to show the code)\n" + s["solution"], form=True))
            cells.append(md(details("Answer and explanation", s["answer"] + "\n\nExpected output:\n```\n" + o + "\n```")))
        else:
            cells.append(md("✍️ *Write your answer here.*")); cells.append(md(details("Model answer", s["answer"])))
        print(f"ok  {p['id']} milestone {i}: {s['title']}")
    p["notebook"] = f"project_{p['id']}.ipynb"
    json.dump(nb(cells, p["title"]), open(f"{ROOT}/notebooks/project_{p['id']}.ipynb", "w"), indent=1, ensure_ascii=False)
    out["projects"].append(p)

json.dump(out, open(f"{ROOT}/src/practice.json", "w"), ensure_ascii=False)
print("wrote src/practice.json and", len(by_ch) + len(PROJECTS), "notebooks")
