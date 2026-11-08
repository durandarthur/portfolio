import * as treeify from "treeify";

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

// Tree as HTML, with the tree lines in the faint colour (see .term-faint)
export const techsFormatter = (techs) => {
  return escapeHtml(treeify.asTree(techs)).replace(
    /[├└│─]+/g,
    (lines) => `<span class="term-faint">${lines}</span>`
  );
};
