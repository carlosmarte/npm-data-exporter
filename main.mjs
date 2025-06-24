import { promises as fs } from "fs";
import { dirname, join, resolve } from "path";

// ============================================================================
// CORE INTERFACES & STRATEGY PATTERN
// ============================================================================

/**
 * Abstract Export Strategy - Strategy Pattern Implementation
 * Defines contract that all export strategies must implement
 */
class ExportStrategy {
  constructor(name, options = {}) {
    if (this.constructor === ExportStrategy) {
      throw new Error("ExportStrategy cannot be instantiated directly");
    }
    this.name = name;
    this.options = { ...this.getDefaultOptions(), ...options };
  }

  /**
   * Main export method - Template Method Pattern
   */
  async export(data, options = {}) {
    const config = { ...this.options, ...options };

    // Validate input data
    this.validate(data);

    // Transform data for specific format
    const transformedData = await this.transform(data, config);

    // Generate file content
    const content = await this.generateContent(transformedData, config);

    // Return content or save to file
    if (config.outputPath) {
      await this.saveToFile(content, config.outputPath);
      return config.outputPath;
    }

    return content;
  }

  /**
   * Abstract methods to be implemented by concrete strategies
   */
  async transform(data, options) {
    return data; // Default: no transformation
  }

  async generateContent(data, options) {
    throw new Error("generateContent must be implemented by concrete strategy");
  }

  validate(data) {
    if (!data) {
      throw new DataExportError("Data cannot be null or undefined");
    }
  }

  getDefaultOptions() {
    return {
      outputPath: null,
      encoding: "utf8",
    };
  }

  async saveToFile(content, outputPath) {
    try {
      await fs.mkdir(dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, this.options.encoding);
    } catch (error) {
      throw new FileSystemError(`Failed to save file: ${error.message}`);
    }
  }
}

// ============================================================================
// CONCRETE EXPORT STRATEGIES
// ============================================================================

/**
 * JSON Export Strategy - Handles JSON format export
 */
class JsonExportStrategy extends ExportStrategy {
  constructor(options = {}) {
    super("json", options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      prettify: true,
      includeMetadata: true,
      dateFormat: "iso",
    };
  }

  async transform(data, options) {
    let transformedData = Array.isArray(data) ? [...data] : { ...data };

    // Add metadata if requested
    if (options.includeMetadata) {
      const metadata = {
        exportedAt: new Date().toISOString(),
        format: "json",
        recordCount: Array.isArray(data) ? data.length : 1,
        exporter: "DataExporter v1.0.0",
      };

      if (Array.isArray(transformedData)) {
        transformedData = {
          metadata,
          data: transformedData,
        };
      } else {
        transformedData.metadata = metadata;
      }
    }

    return transformedData;
  }

  async generateContent(data, options) {
    try {
      return options.prettify
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    } catch (error) {
      throw new DataExportError(`JSON serialization failed: ${error.message}`);
    }
  }

  validate(data) {
    super.validate(data);

    // Check if data is JSON-serializable
    try {
      JSON.stringify(data);
    } catch (error) {
      throw new DataExportError("Data is not JSON serializable");
    }
  }
}

/**
 * CSV Export Strategy - Handles CSV format export
 */
class CsvExportStrategy extends ExportStrategy {
  constructor(options = {}) {
    super("csv", options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      delimiter: ",",
      includeHeaders: true,
      quoteStrings: true,
      escapeQuotes: true,
      dateFormat: "iso",
      nullValue: "",
      flattenObjects: true,
      maxDepth: 3,
    };
  }

  async transform(data, options) {
    // Ensure we have an array of objects
    let records = Array.isArray(data) ? data : [data];

    // Flatten nested objects if requested
    if (options.flattenObjects) {
      records = records.map((record) =>
        this.flattenObject(record, "", options.maxDepth)
      );
    }

    return records;
  }

  async generateContent(data, options) {
    if (!Array.isArray(data) || data.length === 0) {
      return "";
    }

    const rows = [];

    // Get all unique keys from all objects
    const allKeys = new Set();
    data.forEach((obj) => {
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys);

    // Add headers if requested
    if (options.includeHeaders) {
      rows.push(this.formatCsvRow(headers, options));
    }

    // Add data rows
    data.forEach((obj) => {
      const rowData = headers.map((header) =>
        this.formatCsvValue(obj[header], options)
      );
      rows.push(this.formatCsvRow(rowData, options));
    });

    return rows.join("\n");
  }

  flattenObject(obj, prefix = "", maxDepth = 3, currentDepth = 0) {
    if (
      currentDepth >= maxDepth ||
      !obj ||
      typeof obj !== "object" ||
      Array.isArray(obj)
    ) {
      return obj;
    }

    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(
          flattened,
          this.flattenObject(value, newKey, maxDepth, currentDepth + 1)
        );
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  formatCsvValue(value, options) {
    if (value === null || value === undefined) {
      return options.nullValue;
    }

    if (value instanceof Date) {
      return options.dateFormat === "iso"
        ? value.toISOString()
        : value.toString();
    }

    if (Array.isArray(value)) {
      return `"${value.join("; ")}"`;
    }

    if (typeof value === "object") {
      return `"${JSON.stringify(value)}"`;
    }

    let stringValue = String(value);

    // Escape quotes if needed
    if (options.escapeQuotes && stringValue.includes('"')) {
      stringValue = stringValue.replace(/"/g, '""');
    }

    // Quote strings if they contain delimiter, quotes, or newlines
    if (
      options.quoteStrings &&
      (stringValue.includes(options.delimiter) ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r"))
    ) {
      stringValue = `"${stringValue}"`;
    }

    return stringValue;
  }

  formatCsvRow(values, options) {
    return values.join(options.delimiter);
  }

  validate(data) {
    super.validate(data);

    // For CSV, we need objects or arrays of objects
    if (!Array.isArray(data) && typeof data !== "object") {
      throw new DataExportError(
        "CSV export requires object or array of objects"
      );
    }
  }
}

// ============================================================================
// FACTORY PATTERN FOR STRATEGY CREATION
// ============================================================================

/**
 * Export Strategy Factory - Factory Pattern Implementation
 * Creates appropriate export strategies based on format
 */
class ExportStrategyFactory {
  constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  registerDefaultStrategies() {
    this.register("json", JsonExportStrategy);
    this.register("csv", CsvExportStrategy);
  }

  /**
   * Register a new export strategy
   */
  register(format, strategyClass) {
    if (!strategyClass.prototype instanceof ExportStrategy) {
      throw new Error(`${strategyClass.name} must extend ExportStrategy`);
    }

    this.strategies.set(format.toLowerCase(), strategyClass);
    return this;
  }

  /**
   * Create strategy instance for given format
   */
  create(format, options = {}) {
    const StrategyClass = this.strategies.get(format.toLowerCase());

    if (!StrategyClass) {
      throw new DataExportError(`Unsupported export format: ${format}`);
    }

    return new StrategyClass(options);
  }

  /**
   * Get all available formats
   */
  getAvailableFormats() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format) {
    return this.strategies.has(format.toLowerCase());
  }
}

// ============================================================================
// MAIN DATA EXPORTER CLASS
// ============================================================================

/**
 * DataExporter - Main class implementing Facade Pattern
 * Provides simple interface for data export operations
 */
class DataExporter {
  constructor(options = {}) {
    this.factory = new ExportStrategyFactory();
    this.defaultOptions = {
      outputDir: "./exports",
      createTimestamp: true,
      ...options,
    };
  }

  /**
   * Export data to specified format
   */
  async export(data, format, options = {}) {
    const config = { ...this.defaultOptions, ...options };

    // Generate output path if not provided
    if (!config.outputPath && config.outputDir) {
      config.outputPath = this.generateOutputPath(format, config);
    }

    const strategy = this.factory.create(format, config);
    return await strategy.export(data, config);
  }

  /**
   * Export to JSON format
   */
  async toJSON(data, options = {}) {
    return this.export(data, "json", options);
  }

  /**
   * Export to CSV format
   */
  async toCSV(data, options = {}) {
    return this.export(data, "csv", options);
  }

  /**
   * Export to multiple formats simultaneously
   */
  async toMultiple(data, formats, options = {}) {
    const results = {};

    for (const format of formats) {
      try {
        const formatOptions = { ...options, ...options[format] };
        results[format] = await this.export(data, format, formatOptions);
      } catch (error) {
        results[format] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Register custom export strategy
   */
  registerStrategy(format, strategyClass) {
    this.factory.register(format, strategyClass);
    return this;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    return this.factory.getAvailableFormats();
  }

  /**
   * Validate data before export
   */
  async validate(data, format) {
    const strategy = this.factory.create(format);
    strategy.validate(data);
    return true;
  }

  /**
   * Generate output file path
   */
  generateOutputPath(format, options) {
    const timestamp = options.createTimestamp
      ? new Date().toISOString().replace(/[:.]/g, "-")
      : "";

    const filename =
      options.filename || `export${timestamp ? "-" + timestamp : ""}.${format}`;

    return resolve(options.outputDir, filename);
  }

  /**
   * Get export statistics
   */
  getExportStats(data) {
    return {
      isArray: Array.isArray(data),
      recordCount: Array.isArray(data) ? data.length : 1,
      dataType: typeof data,
      hasNestedObjects: this.hasNestedObjects(data),
      estimatedSize: JSON.stringify(data).length,
    };
  }

  hasNestedObjects(data) {
    const checkNested = (obj) => {
      if (Array.isArray(obj)) {
        return obj.some((item) => typeof item === "object" && item !== null);
      }

      if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).some(
          (value) => typeof value === "object" && value !== null
        );
      }

      return false;
    };

    return checkNested(data);
  }
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

class DataExportError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataExportError";
  }
}

class FileSystemError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileSystemError";
  }
}

// ============================================================================
// EXAMPLE USAGE & CLI
// ============================================================================

async function main() {
  console.log("🚀 DataExporter v1.0.0 - Architecture Demo\n");

  try {
    // Initialize DataExporter
    const exporter = new DataExporter({
      outputDir: "./exports",
      createTimestamp: true,
    });

    console.log(
      `📋 Supported formats: ${exporter.getSupportedFormats().join(", ")}\n`
    );

    // Sample data - mixed structure to demonstrate flexibility
    const sampleData = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        profile: {
          age: 30,
          department: "Engineering",
          skills: ["JavaScript", "Node.js", "React"],
        },
        joinDate: new Date("2023-01-15"),
        active: true,
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        profile: {
          age: 28,
          department: "Design",
          skills: ["Figma", "Adobe XD", "CSS"],
        },
        joinDate: new Date("2023-03-20"),
        active: true,
      },
      {
        id: 3,
        name: "Bob Johnson",
        email: "bob@example.com",
        profile: {
          age: 35,
          department: "Marketing",
          skills: ["Analytics", "SEO", "Content Strategy"],
        },
        joinDate: new Date("2022-11-10"),
        active: false,
      },
    ];

    // Display data statistics
    const stats = exporter.getExportStats(sampleData);
    console.log("📊 Data Statistics:");
    console.log(JSON.stringify(stats, null, 2));
    console.log("");

    // Export to JSON with metadata
    console.log("📄 Exporting to JSON...");
    const jsonPath = await exporter.toJSON(sampleData, {
      prettify: true,
      includeMetadata: true,
      filename: "employees.json",
    });
    console.log(`✅ JSON exported to: ${jsonPath}\n`);

    // Export to CSV with flattened structure
    console.log("📊 Exporting to CSV...");
    const csvPath = await exporter.toCSV(sampleData, {
      includeHeaders: true,
      flattenObjects: true,
      filename: "employees.csv",
    });
    console.log(`✅ CSV exported to: ${csvPath}\n`);

    // Export to multiple formats
    console.log("🔄 Exporting to multiple formats...");
    const multiResults = await exporter.toMultiple(
      sampleData,
      ["json", "csv"],
      {
        json: {
          prettify: false,
          filename: "employees-compact.json",
        },
        csv: {
          delimiter: ";",
          filename: "employees-semicolon.csv",
        },
      }
    );

    console.log("📁 Multi-format export results:");
    Object.entries(multiResults).forEach(([format, result]) => {
      console.log(
        `  ${format}: ${typeof result === "string" ? result : result.error}`
      );
    });
    console.log("");

    // Demonstrate in-memory export (no file output)
    console.log("💾 In-memory export example:");
    const jsonContent = await exporter.toJSON(sampleData.slice(0, 1), {
      prettify: true,
      includeMetadata: false,
    });
    console.log("JSON Content:");
    console.log(jsonContent);
    console.log("");

    console.log("🎉 All exports completed successfully!");
  } catch (error) {
    console.error("❌ Export failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export classes for external use
export {
  DataExporter,
  ExportStrategy,
  JsonExportStrategy,
  CsvExportStrategy,
  ExportStrategyFactory,
  DataExportError,
  FileSystemError,
};

// Run demo if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
