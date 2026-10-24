"""Summarise Lighthouse JSON runs in ./out into medians, a text table and lighthouse-summary.json.

Expects files named lh-<name>-<mobile|desktop>-<n>.json (what run-lighthouse.sh writes).
Usage: python3 summarize-lighthouse.py            (from the directory that holds ./out)
"""
import collections
import glob
import json
import re
import statistics as st

CATS = ["performance", "accessibility", "best-practices", "seo"]
METRICS = {
    "first-contentful-paint": "FCP",
    "largest-contentful-paint": "LCP",
    "total-blocking-time": "TBT",
    "cumulative-layout-shift": "CLS",
    "speed-index": "SI",
}

groups = collections.defaultdict(list)
for path in sorted(glob.glob("out/lh-*.json")):
    m = re.match(r"out/lh-(.+)-(mobile|desktop)-(\d+)\.json$", path)
    if m:
        groups[(m.group(1), m.group(2))].append(json.load(open(path)))

summary = {}
first = next(iter(groups.values()))[0]
meta = {
    "lighthouseVersion": first["lighthouseVersion"],
    "hostUserAgent": first["environment"]["hostUserAgent"],
    "throttling": first["configSettings"]["throttlingMethod"],
}
print(f"Lighthouse {meta['lighthouseVersion']} | throttling={meta['throttling']}")
print(f"{'page':18} {'form':8} scores median[min-max] | metrics (median) | weight")

for (name, form), runs in sorted(groups.items(), key=lambda kv: (kv[0][1], kv[0][0])):
    scores = {}
    for c in CATS:
        vals = [round(r["categories"][c]["score"] * 100) for r in runs]
        scores[c] = {"median": int(st.median(vals)), "min": min(vals), "max": max(vals), "runs": vals}
    metrics = {}
    for key, label in METRICS.items():
        med = st.median(r["audits"][key]["numericValue"] for r in runs)
        metrics[label] = round(med, 3) if label == "CLS" else round(med, 1)
    items = [r["audits"]["network-requests"]["details"]["items"] for r in runs]
    weight = {
        "transferKiB": round(st.median(r["audits"]["total-byte-weight"]["numericValue"] for r in runs) / 1024),
        "requests": int(st.median(len(i) for i in items)),
        "scriptKiB": round(st.median(sum(x.get("transferSize", 0) for x in i if x.get("resourceType") == "Script") for i in items) / 1024),
    }
    below = set()
    for r in runs:
        for c in CATS:
            for ref in r["categories"][c]["auditRefs"]:
                a = r["audits"][ref["id"]]
                if a.get("score") is not None and a["score"] < 1 and ref["weight"] > 0:
                    below.add((c, a["id"], round(a["score"], 2)))
    summary[f"{name}/{form}"] = {
        "runs": len(runs),
        "fetchTimes": [r["fetchTime"] for r in runs],
        "scores": scores,
        "metrics": metrics,
        "weight": weight,
        "auditsBelow1": sorted(below),
    }
    s = " ".join(f"{c[:4]}={scores[c]['median']}[{scores[c]['min']}-{scores[c]['max']}]" for c in CATS)
    mt = f"FCP={metrics['FCP']/1000:.2f}s LCP={metrics['LCP']/1000:.2f}s TBT={metrics['TBT']:.0f}ms CLS={metrics['CLS']:.3f}"
    print(f"{name:18} {form:8} {s} | {mt} | {weight['transferKiB']}KiB {weight['requests']}req js={weight['scriptKiB']}KiB")

json.dump({"meta": meta, "results": summary}, open("out/lighthouse-summary.json", "w"), indent=2)
print("wrote out/lighthouse-summary.json")
