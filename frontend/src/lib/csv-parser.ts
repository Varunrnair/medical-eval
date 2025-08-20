import Papa from "papaparse"
import fs from "fs"
import path from "path"



export async function parseCsvFromPath(filePath: string): Promise<any[]> {
  try {
    // Construct the full path relative to the public directory
    // filePath will be something like "/command-a-03-2025/data/scored_final_dataset.csv"
    const fullPath = path.join(process.cwd(), "public/sakhi", filePath)
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    const csvText = fs.readFileSync(fullPath, "utf-8")

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          // Try to coerce to number for any numeric-looking value (covers summary files)
          const trimmed = typeof value === "string" ? value.trim() : value
          if (trimmed === "" || trimmed === null || trimmed === undefined) return value
          const num = Number(trimmed)
          return Number.isFinite(num) ? num : value
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map((e) => e.message).join(", ")}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error: any) => {
          reject(error)
        },
      })
    })
  } catch (error) {
    throw new Error(`Failed to read or parse CSV: ${error}`)
  }
}

export function getColumnNames(data: any[]): string[] {
  if (data.length === 0) return []
  return Object.keys(data[0])
}

export function getNumericColumns(data: any[]): string[] {
  if (data.length === 0) return []
  const firstRow = data[0]
  return Object.keys(firstRow).filter(
    (key) =>
      typeof firstRow[key] === "number" ||
      (typeof firstRow[key] === "string" && !isNaN(Number.parseFloat(firstRow[key]))),
  )
}
