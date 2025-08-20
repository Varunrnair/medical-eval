import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";



export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public/sakhi/");
    const entries = fs.readdirSync(publicDir, { withFileTypes: true });
    const modelFolders = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !["icons", "images", "assets", "_next", "medical_3"].includes(
            entry.name,
          ) &&
          !entry.name.startsWith("."),
      )
      .map((entry) => entry.name)
      .sort();
    return NextResponse.json(modelFolders);
  } catch (error) {
    console.error("Error reading model directories:", error);
    return NextResponse.json(
      { error: "Failed to read model directories" },
      { status: 500 },
    );
  }
}