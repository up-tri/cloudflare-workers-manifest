import fs from "fs";

export function overwrite(targetFilePath, callback) {
  const content = fs.readFileSync(targetFilePath, "utf-8");
  const newContent = callback(content);
  fs.writeFileSync(targetFilePath, newContent, "utf-8");
}
