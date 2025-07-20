interface DataPreviewProps {
  data: any[]
  maxRows?: number
}

export default function DataPreview({ data, maxRows = 5 }: DataPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <p className="text-gray-400">No data available</p>
      </div>
    )
  }

  const columns = Object.keys(data[0])
  const previewData = data.slice(0, maxRows)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-base md:text-lg font-semibold text-gray-200">Data Preview</h3>
        <p className="text-sm text-gray-400">
          Showing {previewData.length} of {data.length} rows
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {column.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {previewData.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} className="px-4 py-3 text-sm text-gray-300">
                    {typeof row[column] === "string" && row[column].length > 50
                      ? `${row[column].substring(0, 50)}...`
                      : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
