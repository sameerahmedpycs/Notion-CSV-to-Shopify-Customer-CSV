#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get CLI arguments
const [sourceFolder, destFolder] = process.argv.slice(2);

if (!sourceFolder) {
  console.error("❌ Usage: node fixLineEndings.js <source-folder> <destination-folder>");
  process.exit(1);
}

// // Ensure destination folder exists
// if (!fs.existsSync(destFolder)) {
//   fs.mkdirSync(destFolder, { recursive: true });
// }

// Read all .csv files
const files = fs.readdirSync(sourceFolder).filter(file => file.endsWith(".csv"));

if (!files.length) {
  console.log("📭 No CSV files found in the source folder.");
  process.exit(0);
}

// Normalize line endings and save
files.forEach(file => {
  const sourcePath = path.join(sourceFolder, file);
//   const destPath = path.join(destFolder, file);

  const content = fs.readFileSync(sourcePath, "utf8");
  const normalized = content.replace(/\r?\n|\r/g, "\r\n");

  fs.writeFileSync(sourcePath, normalized, "utf8");
  console.log(`✅ Fixed line endings in: ${file}`);
});

// console.log(`\n🎉 Done! All CSVs are now using CRLF line endings in: ${destFolder}`);
