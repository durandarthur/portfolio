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

export const techsFormatter = (techs) => {
  return treeify.asTree(techs);
};
