# Usage Examples

```js
// Import specific classes you need
import {
  DataExporter,
  JsonExportStrategy,
  CsvExportStrategy,
  ExportStrategy,
  DataExportError,
} from "./main.mjs";
```

# Default + Named Import

```js
// If you need everything
import * as DataExporterModule from "./main.mjs";
const { DataExporter, JsonExportStrategy } = DataExporterModule;
```

# Selective Import for Custom Strategies

```js
// For extending functionality
import {
  ExportStrategy,
  ExportStrategyFactory,
  DataExporter,
} from "./main.mjs";
```

# Simple File Export

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter();
const userData = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

// Export to JSON file
const jsonPath = await exporter.toJSON(userData, {
  filename: "users.json",
  prettify: true,
});
console.log(`Exported to: ${jsonPath}`);

// Export to CSV file
const csvPath = await exporter.toCSV(userData, {
  filename: "users.csv",
  includeHeaders: true,
});
console.log(`Exported to: ${csvPath}`);
```

# In-Memory Export (No File)

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter();
const data = { message: "Hello World", timestamp: new Date() };

// Get JSON string directly
const jsonContent = await exporter.toJSON(data, {
  prettify: true,
  includeMetadata: false,
  // No outputPath = returns content string
});

console.log("JSON Content:");
console.log(jsonContent);
```

# Custom Output Directory

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter({
  outputDir: "./custom-exports",
  createTimestamp: true,
});

const salesData = [
  { product: "Widget A", sales: 100, revenue: 1500 },
  { product: "Widget B", sales: 75, revenue: 2250 },
];

const results = await exporter.toMultiple(salesData, ["json", "csv"]);
console.log("Export Results:", results);
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter({
  outputDir: "./custom-exports",
  createTimestamp: true,
});

const salesData = [
  { product: "Widget A", sales: 100, revenue: 1500 },
  { product: "Widget B", sales: 75, revenue: 2250 },
];

const results = await exporter.toMultiple(salesData, ["json", "csv"]);
console.log("Export Results:", results);
```

# Complex JSON Export Configuration

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter();
const complexData = [
  {
    user: {
      profile: { name: "John", age: 30 },
      preferences: { theme: "dark", notifications: true },
    },
    activity: {
      lastLogin: new Date(),
      sessionCount: 45,
    },
  },
];

const jsonResult = await exporter.toJSON(complexData, {
  filename: "complex-data.json",
  prettify: true,
  includeMetadata: true,
  dateFormat: "iso",
});
```

# Advanced CSV Export with Flattening

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter();
const nestedData = [
  {
    id: 1,
    user: { name: "Alice", details: { age: 25, city: "NYC" } },
    orders: [
      { id: 101, total: 150 },
      { id: 102, total: 200 },
    ],
  },
];

const csvResult = await exporter.toCSV(nestedData, {
  filename: "flattened-data.csv",
  flattenObjects: true,
  maxDepth: 3,
  delimiter: ";",
  quoteStrings: true,
  nullValue: "N/A",
});
```

# Multi-Format Export with Format-Specific Options

```js
import { DataExporter } from "./main.mjs";

const exporter = new DataExporter({
  outputDir: "./reports",
  createTimestamp: true,
});

const reportData = [
  { quarter: "Q1", revenue: 100000, expenses: 75000 },
  { quarter: "Q2", revenue: 120000, expenses: 80000 },
];

const multiResults = await exporter.toMultiple(reportData, ["json", "csv"], {
  // Global options
  createTimestamp: true,

  // Format-specific options
  json: {
    filename: "quarterly-report.json",
    prettify: true,
    includeMetadata: true,
  },
  csv: {
    filename: "quarterly-report.csv",
    delimiter: ",",
    includeHeaders: true,
    flattenObjects: false,
  },
});

console.log("Multi-export results:", multiResults);
```

# Creating a Custom XML Export Strategy

```js
import { ExportStrategy, DataExporter, DataExportError } from "./main.mjs";

class XmlExportStrategy extends ExportStrategy {
  constructor(options = {}) {
    super("xml", options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      rootElement: "data",
      itemElement: "item",
      prettyPrint: true,
      xmlDeclaration: true,
    };
  }

  async generateContent(data, options) {
    let xml = "";

    if (options.xmlDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += `<${options.rootElement}>\n`;

    const items = Array.isArray(data) ? data : [data];
    items.forEach((item) => {
      xml += `  <${options.itemElement}>\n`;
      xml += this.objectToXml(item, "    ");
      xml += `  </${options.itemElement}>\n`;
    });

    xml += `</${options.rootElement}>`;

    return xml;
  }

  objectToXml(obj, indent = "") {
    let xml = "";
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeXmlTag(key);
      if (typeof value === "object" && value !== null) {
        xml += `${indent}<${sanitizedKey}>\n`;
        xml += this.objectToXml(value, indent + "  ");
        xml += `${indent}</${sanitizedKey}>\n`;
      } else {
        const sanitizedValue = this.escapeXml(String(value));
        xml += `${indent}<${sanitizedKey}>${sanitizedValue}</${sanitizedKey}>\n`;
      }
    }
    return xml;
  }

  sanitizeXmlTag(tag) {
    return tag.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  escapeXml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  validate(data) {
    super.validate(data);
    // Add XML-specific validation if needed
  }
}

// Usage
const exporter = new DataExporter();
exporter.registerStrategy("xml", XmlExportStrategy);

const xmlData = [
  { id: 1, name: "Product A", price: 29.99 },
  { id: 2, name: "Product B", price: 39.99 },
];

const xmlResult = await exporter.export(xmlData, "xml", {
  filename: "products.xml",
  rootElement: "products",
  itemElement: "product",
});
```

# Custom YAML Export Strategy

```js
import { ExportStrategy, DataExporter } from "./main.mjs";

class YamlExportStrategy extends ExportStrategy {
  constructor(options = {}) {
    super("yaml", options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      indent: 2,
      flowLevel: -1,
      includeDocumentMarkers: true,
    };
  }

  async generateContent(data, options) {
    let yaml = "";

    if (options.includeDocumentMarkers) {
      yaml += "---\n";
    }

    yaml += this.toYaml(data, 0, options);

    if (options.includeDocumentMarkers) {
      yaml += "\n...";
    }

    return yaml;
  }

  toYaml(obj, depth = 0, options) {
    const indent = " ".repeat(depth * options.indent);

    if (Array.isArray(obj)) {
      return obj
        .map(
          (item) => `${indent}- ${this.toYaml(item, depth + 1, options).trim()}`
        )
        .join("\n");
    }

    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return `${indent}${key}:\n${this.toYaml(
              value,
              depth + 1,
              options
            )}`;
          }
          return `${indent}${key}: ${this.yamlValue(value)}`;
        })
        .join("\n");
    }

    return this.yamlValue(obj);
  }

  yamlValue(value) {
    if (typeof value === "string") {
      return value.includes("\n")
        ? `|\n  ${value.replace(/\n/g, "\n  ")}`
        : `"${value}"`;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }
}

// Register and use
const exporter = new DataExporter();
exporter.registerStrategy("yaml", YamlExportStrategy);

const configData = {
  database: {
    host: "localhost",
    port: 5432,
    credentials: {
      username: "admin",
      password: "secret",
    },
  },
  features: ["auth", "logging", "monitoring"],
};

const yamlResult = await exporter.export(configData, "yaml", {
  filename: "config.yaml",
});
```

# Batch Export with Error Recovery

```js
import { DataExporter, DataExportError } from "./main.mjs";

class BatchExporter {
  constructor() {
    this.exporter = new DataExporter();
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  async exportBatch(datasets, format, options = {}) {
    const results = [];

    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      const batchOptions = {
        ...options,
        filename: `batch-${i + 1}-${Date.now()}.${format}`,
      };

      try {
        const result = await this.exportWithRetry(
          dataset,
          format,
          batchOptions
        );
        results.push({ index: i, success: true, result });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          dataset: dataset.slice(0, 2), // Preview for debugging
        });
      }
    }

    return results;
  }

  async exportWithRetry(data, format, options, attempt = 1) {
    try {
      return await this.exporter.export(data, format, options);
    } catch (error) {
      if (attempt < this.retryCount) {
        console.log(`Retry attempt ${attempt} for ${options.filename}`);
        await this.delay(this.retryDelay * attempt);
        return this.exportWithRetry(data, format, options, attempt + 1);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Usage
const batchExporter = new BatchExporter();
const datasets = [
  [{ id: 1, name: "Dataset 1" }],
  [{ id: 2, name: "Dataset 2" }],
  [{ id: 3, name: "Dataset 3" }],
];

const batchResults = await batchExporter.exportBatch(datasets, "json", {
  prettify: true,
});

console.log("Batch Export Results:");
batchResults.forEach((result) => {
  if (result.success) {
    console.log(`✅ Batch ${result.index + 1}: ${result.result}`);
  } else {
    console.log(`❌ Batch ${result.index + 1}: ${result.error}`);
  }
});
```

# Validation & Data Sanitization

```js
import { DataExporter, DataExportError } from "./main.mjs";

class ValidatedExporter {
  constructor() {
    this.exporter = new DataExporter();
  }

  async exportWithValidation(data, format, options = {}, schema = null) {
    try {
      // Pre-export validation
      await this.validateData(data, schema);

      // Get export statistics
      const stats = this.exporter.getExportStats(data);
      console.log("Export Statistics:", stats);

      // Perform export
      const result = await this.exporter.export(data, format, options);

      // Post-export verification
      await this.verifyExport(result, format, stats);

      return {
        success: true,
        result,
        stats,
        format,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        format,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async validateData(data, schema) {
    // Basic validation
    if (!data) {
      throw new DataExportError("Data cannot be null or undefined");
    }

    // Schema validation (simplified example)
    if (schema && Array.isArray(data)) {
      data.forEach((item, index) => {
        this.validateAgainstSchema(item, schema, `Item ${index}`);
      });
    }
  }

  validateAgainstSchema(item, schema, context) {
    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && !(field in item)) {
        throw new DataExportError(
          `${context}: Missing required field '${field}'`
        );
      }

      if (field in item && rules.type && typeof item[field] !== rules.type) {
        throw new DataExportError(
          `${context}: Field '${field}' must be of type ${rules.type}`
        );
      }
    }
  }

  async verifyExport(result, format, stats) {
    if (typeof result === "string" && result.startsWith("./")) {
      // File export - verify file exists
      try {
        const fs = await import("fs/promises");
        const fileStats = await fs.stat(result);
        console.log(`File created: ${result} (${fileStats.size} bytes)`);
      } catch (error) {
        throw new DataExportError(
          `Export verification failed: ${error.message}`
        );
      }
    }
  }
}

// Usage with schema validation
const validatedExporter = new ValidatedExporter();

const userData = [
  { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
];

const userSchema = {
  id: { required: true, type: "number" },
  name: { required: true, type: "string" },
  email: { required: true, type: "string" },
  age: { required: false, type: "number" },
};

const validatedResult = await validatedExporter.exportWithValidation(
  userData,
  "json",
  { filename: "validated-users.json", prettify: true },
  userSchema
);

console.log("Validated Export Result:", validatedResult);
```

# Configuration

```js
import { DataExporter } from "./main.mjs";

class BusinessExporter {
  constructor(config = {}) {
    this.config = {
      baseOutputDir: process.env.EXPORT_DIR || "./exports",
      enableTimestamps: true,
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };

    this.exporter = new DataExporter({
      outputDir: this.config.baseOutputDir,
      createTimestamp: this.config.enableTimestamps,
    });
  }

  async exportReport(reportData, reportType, options = {}) {
    const reportOptions = {
      filename: `${reportType}-${new Date().toISOString().split("T")[0]}`,
      ...options,
    };

    // Export to multiple formats for different stakeholders
    const formats = ["json", "csv"];
    const results = await this.exporter.toMultiple(reportData, formats, {
      json: {
        ...reportOptions,
        filename: `${reportOptions.filename}.json`,
        prettify: true,
        includeMetadata: true,
      },
      csv: {
        ...reportOptions,
        filename: `${reportOptions.filename}.csv`,
        includeHeaders: true,
        flattenObjects: true,
      },
    });

    return {
      reportType,
      timestamp: new Date().toISOString(),
      formats: Object.keys(results),
      files: results,
      summary: this.generateSummary(reportData),
    };
  }

  generateSummary(data) {
    return {
      totalRecords: Array.isArray(data) ? data.length : 1,
      exportedAt: new Date().toISOString(),
      dataTypes: this.analyzeDataTypes(data),
    };
  }

  analyzeDataTypes(data) {
    if (!Array.isArray(data)) return [typeof data];

    const types = new Set();
    data.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        Object.values(item).forEach((value) => types.add(typeof value));
      } else {
        types.add(typeof item);
      }
    });

    return Array.from(types);
  }
}

// Usage
const BusinessExporter = new BusinessExporter({
  baseOutputDir: "./enterprise-reports",
  enableTimestamps: true,
});

const quarterlyData = [
  { department: "Sales", q1: 100000, q2: 110000, q3: 105000, q4: 120000 },
  { department: "Marketing", q1: 50000, q2: 55000, q3: 52000, q4: 60000 },
];

const reportResult = await BusinessExporter.exportReport(
  quarterlyData,
  "quarterly-performance",
  { includeMetadata: true }
);

console.log("Enterprise Export Complete:", reportResult);
```

# Streaming Export for Large Datasets

```js
import { DataExporter } from "./main.mjs";

class StreamingExporter {
  constructor() {
    this.exporter = new DataExporter();
    this.chunkSize = 1000;
  }

  async exportLargeDataset(dataGenerator, format, options = {}) {
    const chunks = [];
    let chunkIndex = 0;

    // Process data in chunks
    for await (const chunk of this.chunkData(dataGenerator, this.chunkSize)) {
      const chunkFilename = `${
        options.filename || "export"
      }-chunk-${chunkIndex}.${format}`;

      try {
        const result = await this.exporter.export(chunk, format, {
          ...options,
          filename: chunkFilename,
        });

        chunks.push({
          index: chunkIndex,
          filename: chunkFilename,
          recordCount: chunk.length,
          filePath: result,
        });

        console.log(`✅ Chunk ${chunkIndex} exported: ${chunk.length} records`);
        chunkIndex++;
      } catch (error) {
        console.error(`❌ Chunk ${chunkIndex} failed:`, error.message);
      }
    }

    return {
      totalChunks: chunks.length,
      chunks,
      summary: this.generateChunkSummary(chunks),
    };
  }

  async *chunkData(dataGenerator, chunkSize) {
    let chunk = [];

    for await (const item of dataGenerator) {
      chunk.push(item);

      if (chunk.length >= chunkSize) {
        yield chunk;
        chunk = [];
      }
    }

    if (chunk.length > 0) {
      yield chunk;
    }
  }

  generateChunkSummary(chunks) {
    const totalRecords = chunks.reduce(
      (sum, chunk) => sum + chunk.recordCount,
      0
    );
    return {
      totalRecords,
      averageChunkSize: Math.round(totalRecords / chunks.length),
      exportedAt: new Date().toISOString(),
    };
  }
}

// Usage with generator function
async function* generateLargeDataset(count = 10000) {
  for (let i = 0; i < count; i++) {
    yield {
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      timestamp: new Date().toISOString(),
    };
  }
}

const streamingExporter = new StreamingExporter();
const exportResult = await streamingExporter.exportLargeDataset(
  generateLargeDataset(5000),
  "json",
  { filename: "large-dataset", prettify: false }
);

console.log("Streaming Export Complete:", exportResult.summary);
```
