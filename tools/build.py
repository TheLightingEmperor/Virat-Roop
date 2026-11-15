#!/usr/bin/env python3
"""One-file build:  vendor/three.{core,module}.min.js + src/NN_*.js + embedded assets  ->  index.html

  python3 tools/build.py [out.html]

Layout it expects (all paths relative to the project root, the parent of tools/):
  src/shell.html            the page, with placeholders
  src/NN_name.js            plain scripts, joined in NAME ORDER into one scope (the number is the load order)
  vendor/three.core.min.js  } the two ES-module builds from the three.js npm package (build/), MIT.
  vendor/three.module.min.js}  Keep vendor/LICENSE beside them.

Placeholders in shell.html:
  {{THREE}}          three.js as one classic script that defines a frozen global THREE (no module loader, works from file://)
  {{APP}}            the joined src modules
  {{B64:path}}       base64 of a file (a GLB, a woff2 font, ...). The build stops if the file is missing.
  {{B64?:path}}      the same, but an empty string if the file is missing (optional assets)

Checks: every module is syntax-checked alone (node --check), then the joined script again. The second check is the one
that catches the same top-level name declared in two modules, which is the classic failure of this layout.
"""
import base64, glob, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, VENDOR = os.path.join(ROOT, "src"), os.path.join(ROOT, "vendor")
OUT = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "index.html")
NODE = shutil.which("node")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def spec_list(body):
    """'a as b, c' -> [('a', 'b'), ('c', 'c')]"""
    out = []
    for item in body.split(","):
        item = item.strip()
        if item:
            parts = [x.strip() for x in item.split(" as ")]
            out.append((parts[0], parts[-1]))
    return out


def wrap_three():
    """three ships as a core module and a renderer module that imports from it. Wrap each in a function scope and
    hand the core's exports to the renderer, so the page needs no <script type=module> (which file:// refuses)."""
    core = read(os.path.join(VENDOR, "three.core.min.js")).strip()
    mod = read(os.path.join(VENDOR, "three.module.min.js")).strip()
    tail = re.search(r"export\s*\{([^}]*)\}\s*;?\s*$", core)
    core_ret = ",".join(f"{pub}:{loc}" for loc, pub in spec_list(tail.group(1)))
    core_js = "var __tCore=(function(){" + core[: tail.start()] + ";return{" + core_ret + "};})();"

    imp = re.search(r'import\s*\{([^}]*)\}\s*from\s*"\./three\.core\.min\.js"\s*;?', mod)
    reexp = re.search(r'export\s*\{([^}]*)\}\s*from\s*"\./three\.core\.min\.js"\s*;?', mod)
    body, passed = mod.replace(imp.group(0), "", 1), []
    if reexp:
        body = body.replace(reexp.group(0), "", 1)
        passed = [pub for _, pub in spec_list(reexp.group(1))]
    body = body.strip()
    tail = re.search(r"export\s*\{([^}]*)\}\s*;?\s*$", body)
    destructure = ",".join(f"{pub}:{loc}" for pub, loc in spec_list(imp.group(1)))
    mod_ret = ",".join([f"{n}:__tCore.{n}" for n in passed] + [f"{pub}:{loc}" for loc, pub in spec_list(tail.group(1))])
    mod_js = "var __tMod=(function(__tCore){var{" + destructure + "}=__tCore;" + body[: tail.start()] + ";return{" + mod_ret + "};})(__tCore);"
    return "var THREE=(function(){'use strict';" + core_js + mod_js + "return Object.freeze(Object.assign({},__tCore,__tMod));})();"


def check(path):
    if not NODE:
        return True, ""
    r = subprocess.run([NODE, "--check", path], capture_output=True, text=True)
    return r.returncode == 0, r.stderr.strip()[:1800]


def embed(m):
    optional, rel = m.group(1) == "?", m.group(2).strip()
    p = os.path.join(ROOT, rel)
    if not os.path.isfile(p):
        if optional:
            return ""
        sys.exit(f"build stopped: {rel} (asked for by shell.html) does not exist")
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def main():
    if not NODE:
        print("warning: node not found, modules are NOT syntax-checked")
    parts, ok = [], True
    for f in sorted(glob.glob(os.path.join(SRC, "*.js"))):
        src = read(f)
        if "</script" in src.lower():
            sys.exit(f"build stopped: {os.path.basename(f)} contains a closing script tag, which would end the page's script")
        good, err = check(f)
        if not good:
            ok = False
            print(f"SYNTAX ERROR in src/{os.path.basename(f)}:\n{err}")
        parts.append(f"// ===== {os.path.basename(f)} =====\n" + src.replace("'use strict';", "", 1))
    if not ok:
        sys.exit(1)
    app = "'use strict';\n" + "\n".join(parts)
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tf:
        tf.write(app)
    good, err = check(tf.name)
    os.unlink(tf.name)
    if not good:
        sys.exit("SYNTAX ERROR in the joined script (usually one top-level name declared in two modules):\n" + err)

    html = read(os.path.join(SRC, "shell.html"))
    html = re.sub(r"\{\{B64(\??):([^}]+)\}\}", embed, html)
    # str.replace, not re.sub: the payloads contain backslashes and dollar signs
    html = html.replace("{{THREE}}", wrap_three()).replace("{{APP}}", app)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(html)
    os.replace(tmp, OUT)                      # atomic: a preview that reloads mid-build never sees half a page
    print(f"built {os.path.relpath(OUT, ROOT)}  {len(html) / 1024:.0f} KB  ({len(parts)} modules)")


if __name__ == "__main__":
    main()
