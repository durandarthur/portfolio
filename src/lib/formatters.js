import { $t } from "../i18n";
import { CATEGORIES, TAGS, tagOf } from "../techs";

export const timelineFormatter = (timeline) => {
  let output = "";
  timeline.forEach((entry) => {
    output += "|\n|\n|\n";
    Object.values(entry).forEach((value) => {
      output += value + "\n";
    });
  });
  return output;
};

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const span = (cls, text) => `<span class="${cls}">${escapeHtml(text)}</span>`;
const tagSpan = (tag) =>
  `<span style="color: var(--tag-${tag})">${escapeHtml($t(`Techs.tags.${tag}`))}</span>`;

// The Techs window's tree as HTML for the terminal: same categories, tree
// characters and tags (all folders open), then the legend
export const techsTreeFormatter = () => {
  const folderName = (cat) => $t(`Techs.folders.${cat.key}`);
  const nameWidth = Math.max(
    ...CATEGORIES.map((cat) => 3 + folderName(cat).length),
    ...CATEGORIES.flatMap((cat) => cat.techs.map((t) => 8 + t.name.length))
  );
  const lines = [span("term-folder", $t("App.apps.techs.label") + "/")];

  CATEGORIES.forEach((cat, ci) => {
    const lastCat = ci === CATEGORIES.length - 1;
    const name = folderName(cat);
    lines.push(
      span("term-faint", lastCat ? "└─ " : "├─ ") +
        span("term-folder", name) +
        " ".repeat(nameWidth + 2 - 3 - name.length) +
        span("term-muted", String(cat.techs.length))
    );
    cat.techs.forEach((tech, ti) => {
      const branch = (lastCat ? "    " : "│   ") + (ti === cat.techs.length - 1 ? "└── " : "├── ");
      const tag = tagOf(tech);
      lines.push(
        span("term-faint", branch) +
          escapeHtml(tech.name) +
          " ".repeat(nameWidth + 2 - 8 - tech.name.length) +
          tagSpan(tag)
      );
    });
  });

  lines.push("", span("term-muted", $t("Techs.usedAt")) + "  " + TAGS.map(tagSpan).join("  "));
  return `<pre>${lines.join("\n")}</pre>`;
};
