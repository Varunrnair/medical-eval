import Papa from "papaparse"
import fs from "fs"
import path from "path"

// This function is no longer used for local files, but kept for completeness if needed for external URLs
export async function parseCsvFromUrl(url: string): Promise<any[]> {
  try {
    const response = await fetch(url)
    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field && (field.includes("score") || field.includes("similarity") || field.includes("perplexity"))) {
            const num = Number.parseFloat(value)
            return isNaN(num) ? value : num
          }
          return value
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map((e) => e.message).join(", ")}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  } catch (error) {
    throw new Error(`Failed to fetch or parse CSV: ${error}`)
  }
}

export async function parseCsvFromPath(filePath: string): Promise<any[]> {
  try {
    // Construct the full path relative to the public directory
    // filePath will be something like "/data/scored_final_dataset.csv"
    const fullPath = path.join(process.cwd(), "public", filePath)

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    const csvText = fs.readFileSync(fullPath, "utf-8")

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field && (field.includes("score") || field.includes("similarity") || field.includes("perplexity"))) {
            const num = Number.parseFloat(value)
            return isNaN(num) ? value : num
          }
          return value
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map((e) => e.message).join(", ")}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
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
