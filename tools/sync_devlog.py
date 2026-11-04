# -*- coding: utf-8 -*-
"""블루프린트 뷰어 HTML 번들 -> 블로그 '개발 일지' 글(blog/post/2026/devlog/*.html) 생성.

사용법:  python tools/sync_devlog.py [번들폴더]

 - 번들의 각 그래프 HTML(노드 캔버스)을 읽어 노드 실행 흐름만 미니멀한 단계 목록으로 풀어쓴다.
 - 위젯 레이아웃(Designer 배치), 변수 목록, 요약 카드 같은 디자인성 탭은 제외한다.
 - 같은 구조의 흐름(노드 구성이 거의 같은 것)은 한 항목으로 합치고, 이전 버전 파일은 제외한다.
 - 주제(GROUPS)별로 글 1개씩 만든다. 분류표에 없는 새 파일은 '미분류' 글에 모인다.
 - blog/index.html 의 개발 일지 카드 영역은 건드리지 않는다 (카드는 직접 관리).
"""
import html
import json
import os
import re
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\aoius\Downloads\bookshop_blueprint_html_bundle"
SRC = os.path.join(BUNDLE, "blueprint_html")
OUT = os.path.join(ROOT, "blog", "post", "2026", "devlog")

# (슬러그, 글 제목, 설명, [(대표 파일, [이전 버전 파일...]), ...])   파일명은 blueprint_ 와 .html 생략
GROUPS = [
    ("quest", "퀘스트 시스템", "퀘스트 카드, 다이얼로그, 로그, 트래커의 노드 연결", [
        ("questcard_initcard_final", ["questcard_initcard_v2", "questcard_initcard_horizontal", "questcard_initcard_csection_horizontal", "questcard_initcard", "initcard_complete_nogaps", "initcard_flow_horizontal"]),
        ("shopnpcmenu_quest_final", ["shopnpcmenu_quest_v2", "shopnpcmenu_quest", "shopnpcmenu_quest_full"]),
        ("questbtn_statecheck", []),
        ("questbtn_true_final", []),
        ("questdialog_fix_final", []),
        ("questdialog_accept_reject", []),
        ("questlog_construct", []),
        ("questlog_onkeydown", []),
        ("questtracker_full", []),
        ("questtrackeritem_inititem", []),
        ("questtrackeritem_desc", []),
        ("switch_portrait", []),
        ("debug_questlogref", []),
    ]),
    ("shop", "상점 · NPC", "상점 메뉴, 구매/판매, NPC 상호작용의 노드 연결", [
        ("shopnpc_interact", []),
        ("shopnpcmenu_talk", []),
        ("shopmenu_open", []),
        ("shopmenu_food_all", []),
        ("shopbuy_buttons", []),
        ("sellpopup_qty", []),
        ("qtybutton_full", []),
        ("reaction_connect", []),
        ("randomtext", []),
    ]),
    ("inventory", "인벤토리 · 핫바", "그리드 계산, 드래그 앤 드롭, 단축키의 노드 연결", [
        ("inventory_grid", []),
        ("hotbar", []),
        ("hotbar_duplicate", []),
        ("ondrop_full", []),
        ("dragfilter", []),
        ("dragvisual_quantity", []),
        ("refreshslot0_full", []),
        ("refreshslot_icon", []),
        ("updatedetailpanel_unified", []),
        ("itemdescription_add", []),
        ("onkeydown", []),
        ("bpko_qkey_toggle_fixed", ["bpko_qkey_toggle", "bpko_eventq_toggle"]),
    ]),
    ("gather", "채집 · 낚시", "채집 스팟, 애니메이션, 결과, 낚시 UI의 노드 연결", [
        ("gather_all", []),
        ("gatherspot", []),
        ("spotrespawn", []),
        ("gatheranim_final", []),
        ("gatherresult_full", []),
        ("fishingui", []),
        ("initresult", []),
    ]),
    ("dialogue", "대화 · 엔딩 · 튜토리얼", "다이얼로그, 컷씬, 엔딩, 일일 리포트의 노드 연결", [
        ("installment_master", []),
        ("initamount", []),
        ("showcurrentline_amount", []),
        ("portrait_anim", []),
        ("oc_typenextchar_complete", []),
        ("doslidenext_switchint", []),
        ("openingdialogue_onmousedown", []),
        ("tutorialslides_complete", []),
        ("ending_full", []),
        ("ending_paymentsuccess", []),
        ("endcutscene_final_full", []),
        ("dailyreport", []),
        ("texture_amountidx_fix", []),
    ]),
    ("system", "게임 시스템", "게임 모드, 이벤트 바인딩, 새 게임 판별의 노드 연결", [
        ("gamemode_newgame_check", []),
        ("newgame_detect", []),
        ("bindevent_final_clear", []),
        ("bindevent_merge", []),
    ]),
]

# 디자인성 탭(위젯 배치, 변수 목록, 요약 카드)은 이름으로 걸러낸다
SKIP_TAB = re.compile(r"Designer|배치|변수|요약|구조 \(")
SIMILAR = 0.7   # 이 이상 노드 구성이 같으면 같은 흐름으로 합친다
SUBSET = 0.85   # 작은 쪽이 큰 쪽에 거의 포함되면(부분집합) 같은 흐름으로 본다
MIN_MERGE = 3   # 노드가 이 수 미만이면 합치지 않는다


# ----------------------------------------------------------------------------- 파싱
def txt(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip() if el else ""


def clean_title(t):
    t = re.sub(r"^[◆●■▶⚡🟢🔴🔧✓\s]+", "", t)
    t = re.sub(r"^\d+\.\s*", "", t)
    return t.strip()


def parse(path):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "lxml")
    title = re.sub(r"^Blueprint Graph Viewer\s*[—-]\s*", "", txt(soup.title))
    names = [re.sub(r"^[✓🔧⚠\s]+", "", txt(t)) for t in soup.select("#toolbar .tab")]
    conts = [c for c in soup.select('[id^="S"]') if re.fullmatch(r"S\d+", c.get("id", ""))]
    if not conts:
        conts, names = [soup.body], [""]
    tabs = []
    for i, c in enumerate(conts):
        nodes = {}
        for n in c.select(".bp-node"):
            nid = n.get("id")
            if not nid:
                continue
            hdr = n.select_one(".bp-hdr")
            pins, rows = {}, []
            for row in n.select(".pin-row"):
                rc = row.get("class", [])
                pds = row.select(".pd")
                lbls = [txt(l) for l in row.select(".pin-lbl")]
                left = right = None
                ll = rl = ""
                if "both" in rc and len(pds) >= 2:
                    left, right = pds[0], pds[1]
                    ll, rl = (lbls[0] if lbls else ""), (lbls[-1] if len(lbls) > 1 else "")
                elif pds and "out" in rc:
                    right, rl = pds[0], (lbls[0] if lbls else "")
                elif pds:
                    left, ll = pds[0], (lbls[0] if lbls else "")
                L, R = make_cell(left, ll), make_cell(right, rl)
                for pin in (L, R):
                    if pin:
                        pins[pin["id"]] = {"cls": pin["cls"], "labels": [pin["label"]]}
                if L or R or lbls:
                    rows.append({"L": L, "R": R, "text": lbls[0] if (not L and not R and lbls) else ""})
            kinds = [k[2:] for k in (hdr.get("class", []) if hdr else []) if k.startswith("h-")]
            nodes[nid] = {"title": clean_title(txt(hdr)) if hdr else nid, "pins": pins, "rows": rows,
                          "kind": kinds[0] if kinds else "func"}
        links = []
        el = c.select_one(".cl")
        if el:
            for br in el.find_all("br"):
                br.replace_with("\n")
            links = [x.strip() for x in el.get_text().split("\n") if x.strip()]
        tabs.append({"name": names[i] if i < len(names) else "", "nodes": nodes, "wires": [], "links": links})
    script = "\n".join(s.get_text() for s in soup.find_all("script"))
    pin_tab = {pid: ti for ti, t in enumerate(tabs) for n in t["nodes"].values() for pid in n["pins"]}
    pin_tab.update({nid: ti for ti, t in enumerate(tabs) for nid in t["nodes"]})
    wre = (r"\bW\(\s*(?:(?:[A-Za-z_]\w*|'svg\w*'|\d+)\s*,\s*)?'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\w+)"
           r"\s*(?:,\s*(true|false))?\s*(?:,\s*'([^']*)')?")
    for m in re.finditer(wre, script):
        a, b = m.group(1), m.group(2)
        if a in pin_tab and b in pin_tab:
            tabs[pin_tab[a]]["wires"].append({"a": a, "b": b, "label": m.group(5) or ""})
    return title, tabs


def make_cell(pd, label):
    if pd is None or not pd.get("id"):
        return None
    return {"id": pd.get("id"), "cls": pd.get("class", []), "label": label}


def pin_info(t):
    p2n, cls, lab = {}, {}, {}
    for nid, n in t["nodes"].items():
        for pid, p in n["pins"].items():
            p2n[pid] = nid
            cls[pid] = p["cls"]
            ls = [l for l in p["labels"] if l not in ("실행", "", "▷")]
            lab[pid] = ls[0] if ls else ""
    return p2n, cls, lab


def build_tree(t):
    """exec 와이어를 따라 [[step, ...], ...] 구조로. step={'id','t','kind','kids':[(label,[step..])]}"""
    nodes = t["nodes"]
    p2n, cls, lab = pin_info(t)
    exec_w = [w for w in t["wires"] if "exec" in cls.get(w["a"], []) and "exec" in cls.get(w["b"], [])]
    out_of, indeg = {}, {}
    for w in exec_w:
        a, b = p2n[w["a"]], p2n[w["b"]]
        out_of.setdefault(a, []).append((w["a"], b))
        indeg[b] = indeg.get(b, 0) + 1
    starts = [n for n in out_of if n not in indeg]
    seen = set()

    def walk(nid):
        seq, cur = [], nid
        while cur and cur not in seen:
            seen.add(cur)
            step = {"id": cur, "t": nodes[cur]["title"], "kids": [], "kind": nodes[cur]["kind"]}
            seq.append(step)
            outs = out_of.get(cur, [])
            if len(outs) == 1:
                cur = outs[0][1]
                continue
            for pid, nxt in outs:
                kid = walk(nxt)
                if kid:
                    step["kids"].append((lab.get(pid, "") or "→", kid))
            break
        return seq

    return [walk(s) for s in starts]


def norm(t):
    t = re.sub(r"\(.*?\)", "", t)
    t = re.sub(r"[◆★●▶▼◀→]", "", t)
    return re.sub(r"\s+", " ", t).strip().lower()


def title_set(trees):
    out = set()

    def rec(seq):
        for s in seq:
            out.add(norm(s["t"]))
            for _, k in s["kids"]:
                rec(k)
    for tr in trees:
        rec(tr)
    return out


# ----------------------------------------------------------------------------- 렌더링
def e(s):
    return html.escape(s, quote=False)


PIN_TYPES = ("exec", "object", "int", "int64", "bool", "float", "name", "text", "str", "struct", "self",
             "tex", "deleg", "enum", "soft", "reply", "key")


def pin_type(cls):
    for c in cls:
        if c in PIN_TYPES:
            return c
    return "empty"


def short(label):
    label = re.split(r"\s*←\s*", label)[0].strip()
    return "" if label in ("실행", "▷") else label


def render_node(n, pref):
    def dot(p):
        return '<i class="pd %s" id="%s_%s"></i>' % (" ".join(p["cls"]), pref, p["id"])

    rows = []
    for r in n["rows"]:
        L, R = r["L"], r["R"]
        if not L and not R:
            if r["text"]:
                rows.append('<div class="pr txt">%s</div>' % e(r["text"]))
            continue
        rows.append('<div class="pr">%s<span class="pl">%s</span><span class="sp"></span><span class="pl">%s</span>%s</div>' % (
            dot(L) if L else "", e(short(L["label"])) if L else "",
            e(short(R["label"])) if R else "", dot(R) if R else ""))
    return '<div class="nd k-%s"><div class="nh">%s</div><div class="nbody">%s</div></div>' % (
        n["kind"], e(n["title"]), "".join(rows))


class Ctx:
    def __init__(self, t, pref):
        self.t, self.pref = t, pref
        self.nodes = t["nodes"]
        self.p2n, self.cls, _ = pin_info(t)
        self.is_exec = {nid: any("exec" in p["cls"] for p in n["pins"].values()) for nid, n in self.nodes.items()}
        t["wires"] = [w for w in t["wires"] if w["a"] in self.p2n and w["b"] in self.p2n]
        self.srcs = {}
        for w in t["wires"]:
            if "exec" in self.cls.get(w["a"], []):
                continue
            self.srcs.setdefault(self.p2n[w["b"]], []).append(self.p2n[w["a"]])
        self.placed = set()

    def feeders(self, owner):
        """owner 에 데이터를 공급하는 순수 노드를 가까운 순(레벨)으로. 각 레벨은 세로로 쌓는다."""
        levels, frontier = [], [owner]
        while True:
            nxt = []
            for f in frontier:
                for s in self.srcs.get(f, []):
                    if s not in self.placed and not self.is_exec[s] and s not in nxt:
                        nxt.append(s)
            if not nxt:
                break
            self.placed.update(nxt)
            levels.append(nxt)
            frontier = nxt
        return levels

    def step_html(self, st):
        self.placed.add(st["id"])
        levels = self.feeders(st["id"])
        feeds = "".join('<div class="lvl">%s</div>' % "".join(render_node(self.nodes[x], self.pref) for x in lv)
                        for lv in reversed(levels))
        return '<div class="col">%s<div class="main">%s</div></div>' % (
            '<div class="feeds">%s</div>' % feeds if feeds else "", render_node(self.nodes[st["id"]], self.pref))

    def seq_html(self, seq):
        out = ['<div class="seq">']
        for st in seq:
            out.append(self.step_html(st))
        out.append("</div>")
        for st in seq:
            if st["kids"]:
                out.append('<div class="fork">')
                for lab, kid in st["kids"]:
                    out.append('<div class="lane"><span class="tag">%s</span><div class="lanebody">%s</div></div>'
                               % (e(lab.strip("▶ ").strip() or "→"), self.seq_html(kid)))
                out.append("</div>")
        return "".join(out)


def render_flow(t, trees, pref):
    ctx = Ctx(t, pref)
    body = "".join(ctx.seq_html(tr) for tr in trees)
    leftover = [nid for nid in t["nodes"] if nid not in ctx.placed]
    if leftover:
        body += '<div class="extra"><span class="tag">기타</span><div class="seq">%s</div></div>' % "".join(
            '<div class="col"><div class="main">%s</div></div>' % render_node(t["nodes"][x], pref) for x in leftover)
    wires = [[pref + "_" + w["a"], pref + "_" + w["b"], pin_type(ctx.cls.get(w["a"], []))] for w in t["wires"]]
    return '<div class="flow"><div class="canvas" data-w="%s">%s<svg class="wires"></svg></div></div>' % (
        html.escape(json.dumps(wires), quote=True), body)


def render_section(title, t, trees, links, also, pref):
    body = []
    if trees:
        body.append(render_flow(t, trees, pref))
    elif links:
        body.append("<ol>%s</ol>" % "".join("<li>%s</li>" % e(x) for x in links))
    note = ""
    if also:
        note = '<p class="same">같은 구조: %s</p>' % e(" · ".join(also))
    return '<div class="post-section dl-sec"><h2>%s</h2>%s%s</div>' % (e(title), "".join(body), note)


def main():
    files = {f[len("blueprint_"):-5]: f for f in os.listdir(SRC) if f.startswith("blueprint_") and f.endswith(".html")}
    used = set()
    for _, _, _, items in GROUPS:
        for m, olds in items:
            used.add(m)
            used.update(olds)
    missing = sorted(k for k in used if k not in files)
    if missing:
        print("번들에 없는 파일(분류표 정리 필요):", missing)
    groups = [(s, t, d, [(m, olds) for m, olds in items if m in files]) for s, t, d, items in GROUPS]
    extra = sorted(k for k in files if k not in used)
    if extra:
        groups.append(("misc", "미분류", "분류표(GROUPS)에 아직 없는 새 파일", [(k, []) for k in extra]))

    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):          # 이전 생성물 정리
        p = os.path.join(OUT, f)
        if f.endswith(".html") or f == "bp":   # devlog.css / devlog.js 는 남긴다
            if os.path.isdir(p):
                import shutil
                shutil.rmtree(p)
            else:
                os.remove(p)

    summary = []
    for slug, gtitle, desc, items in groups:
        sections = []   # {title, trees, links, nodes:set, also:[]}
        for key, _ in items:
            title, tabs = parse(os.path.join(SRC, files[key]))
            for t in tabs:
                if (t["name"] and SKIP_TAB.search(t["name"])) or not t["nodes"]:
                    continue
                trees = build_tree(t)
                if not trees and not t["links"]:
                    continue
                sec_title = re.sub(r"^\d+\.\s*", "", t["name"] or title)
                sections.append({"title": sec_title, "tab": t, "trees": trees, "links": t["links"],
                                 "nodes": title_set(trees), "size": len(t["nodes"]), "also": []})
        # 같은 구조 합치기
        merged = []
        for s in sorted(sections, key=lambda x: -x["size"]):
            hit = None
            if len(s["nodes"]) >= MIN_MERGE:
                for m in merged:
                    inter = len(s["nodes"] & m["nodes"])
                    union = len(s["nodes"] | m["nodes"])
                    small = min(len(s["nodes"]), len(m["nodes"]))
                    if union and (inter / union >= SIMILAR or (small >= 4 and inter / small >= SUBSET)):
                        hit = m
                        break
            if hit:
                hit["also"].append(s["title"])
            else:
                merged.append(s)
        merged.sort(key=lambda x: sections.index(x))
        body = "\n        ".join(render_section(m["title"], m["tab"], m["trees"], m["links"], m["also"], "s%d" % i)
                              for i, m in enumerate(merged))
        page = TEMPLATE.replace("{{TITLE}}", e(gtitle)).replace("{{DESC}}", e(desc)).replace("{{BODY}}", body)
        with open(os.path.join(OUT, slug + ".html"), "w", encoding="utf-8") as fh:
            fh.write(page)
        summary.append((slug, gtitle, len(sections), len(merged)))
    for s in summary:
        print("%-10s %-14s 탭 %2d -> 항목 %2d" % s)


TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patohsi - 개발 일지: {{TITLE}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../style.css">
    <link rel="stylesheet" href="../../post_style.css">
    <link rel="stylesheet" href="devlog.css">
</head>
<body>
    <a href="../../../index.html" class="post-back-btn"><span aria-hidden="true">←</span> 목록으로</a>
    <article class="post-container dl-post">
        <h1 class="post-main-title">{{TITLE}}</h1>
        <p class="dl-lead">{{DESC}}</p>

        {{BODY}}
    </article>

    <div id="scroll-top-btn" onclick="scrollToTop()">
        <img src="../../assets/top_btn.png" class="top-btn-img" alt="Top">
    </div>

    <div class="bottom-nav-wrapper inverted-nav">
        <div class="nav-glow"></div>
        <nav id="main-nav" class="nav-bar">
            <div class="nav-bump-svg-container" onclick="toggleNav()">
                <svg viewBox="0 0 400 60" preserveAspectRatio="none" class="bump-svg">
                    <path d="M0,60 L110,60 Q140,60 150,40 L160,15 Q165,0 185,0 L215,0 Q235,0 240,15 L250,40 Q260,60 290,60 L400,60 Z"></path>
                </svg>
                <img src="../../assets/star_icon.png" alt="Toggle" class="trigger-icon">
            </div>
            <ul class="nav-links">
                <li class="nav-item"><a href="../../../../profile/index.html">PROFILE</a></li>
                <li class="nav-item"><a href="../../../../portfolio/index.html">PORTFOLIO</a></li>
                <li class="nav-item center-home"><a href="../../../../index.html" class="home-link-text">PATOHSI</a></li>
                <li class="nav-item"><a href="../../../index.html">BLOG</a></li>
                <li class="nav-item"><a href="../../../../commission/index.html">COMMISSION</a></li>
            </ul>
        </nav>
    </div>

    <script src="../../post_script.js"></script>
    <script src="devlog.js"></script>
</body>
</html>
"""

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
