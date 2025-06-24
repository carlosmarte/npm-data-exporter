### **DataExporter Library Integration Guide**

A JavaScript/TypeScript module for exporting data to various formats like JSON and CSV, with support for custom formats.

#### **1. Core Usage**

Initialize the exporter and use its built-in methods.

```javascript
import { DataExporter } from "@thinkeloquent/data-exporter";

// 1. Initialize
const exporter = new DataExporter({
  /* global options */
});
const data = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

// 2. Export
const jsonPath = await exporter.toJSON(data, { filename: "users.json" });
const csvPath = await exporter.toCSV(data, { filename: "users.csv" });
```

#### **2. Key Methods**

- `exporter.toJSON(data, options)`: [Exports data to a JSON file or returns a JSON string.]
- `exporter.toCSV(data, options)`: [Exports data to a CSV file or returns a CSV string.]
- `exporter.toMultiple(data, formats, options)`: [Exports data to multiple formats (e.g., `['json', 'csv']`) at once.]
- `exporter.export(data, format, options)`: [Generic method for exporting to any registered format (e.g., `'json'`, `'csv'`, or custom ones).]

#### **3. Key Concepts**

- `[File Export]`: To save to a file, provide a `filename` in the `options` object. The method returns the file path as a string.
- `[In-Memory Export]`: To get the content as a string, **omit** the `filename` from the `options` object. The method returns the generated content string.

#### **4. Configuration Options**

**Global Options (in `new DataExporter({...})`)**

- `[outputDir: string]`: Default directory for all saved files (e.g., `'./exports'`).
- `[createTimestamp: boolean]`: If `true`, adds a timestamp to filenames to prevent overwrites.

**Per-Call Options (in `.toJSON`, `.toCSV`, etc.)**

- **Common Options:**

  - `[filename: string]`: The name of the output file. If omitted, returns content as a string.
  - `[includeMetadata: boolean]`: If `true`, wraps the output data in a metadata object.
  - `[dateFormat: string]`: Format for `Date` objects (e.g., `'iso'`, `'epoch'`).

- **JSON-Specific Options (`.toJSON`):**

  - `[prettify: boolean]`: If `true`, formats the JSON with indentation for readability.

- **CSV-Specific Options (`.toCSV`):**
  - `[includeHeaders: boolean]`: If `true`, the first row of the CSV will be the column headers.
  - `[flattenObjects: boolean]`: If `true`, converts nested objects into flat columns (e.g., `{ user: { name: 'A' } }` becomes a `user.name` column).
  - `[delimiter: string]`: The character to separate columns (default: `,`).
  - `[maxDepth: number]`: The maximum depth to flatten nested objects.
  - `[nullValue: string]`: The string to use for `null` or `undefined` values (e.g., `'N/A'`).

#### **5. Extensibility: Custom Formats**

Create and use your own export formats (like XML, YAML, etc.).

1.  `[Import]`: Import `ExportStrategy` from the module.
2.  `[Extend]`: Create a class that extends `ExportStrategy`.
3.  `[Implement]`: Implement the `async generateContent(data, options)` method to return the formatted string.
4.  `[Register]`: Add your custom strategy to an exporter instance: `exporter.registerStrategy('myFormat', MyStrategyClass);`
5.  `[Use]`: Export using the generic method: `await exporter.export(data, 'myFormat', { filename: 'data.ext' });`
