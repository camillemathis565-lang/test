"""Step 3: embed outputs/web_data.json into the interactive HTML report."""
from cbattr import config as C

if __name__ == "__main__":
    tpl = (C.ROOT / "report_template.html").read_text()
    data = (C.OUT / "web_data.json").read_text().replace("</", "<\\/")
    (C.OUT / "report.html").write_text(tpl.replace("/*DATA*/", data))
    print(C.OUT / "report.html")
