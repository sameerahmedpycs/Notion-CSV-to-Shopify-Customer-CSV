const { stringify } = require('csv-stringify') // from 'csv' package family
const fs = require('fs');

/**
 * Write RFC 4180–compliant CSV from an array of objects.
 *
 * @param {Object[]} data            Array of row objects.
 * @param {string}   filePath        Output file path.
 * @param {string[]} [columns]       Optional ordered list of column keys (header labels = same names by default).
 * @param {Object}   [opts]          Extra stringify options overrides.
 * @returns {Promise<void>}
 */
async function writeRfc4180Csv(data, filePath, columns = undefined, opts = {}) {
    return new Promise((resolve, reject) => {
        const cols = deriveColumns(data, columns);

        // Map columns to header labels (can customize labels separately if desired)
        // Accepts array or object; object form lets you map { key: 'Header Label' }.
        const columnSpec = cols.map(k => ({ key: k, header: k }));
        // console.log('columnSpec', columnSpec);

        const stringifier = stringify({
            header: true,
            columns: columnSpec,

            // RFC 4180 specifics
            delimiter: ',',            // Field separator
            record_delimiter: '\r\n',  // Mandatory CRLF line terminators
            quote: '"',                // Quote char
            escape: '"',               // Escape by doubling
            quoted: false,             // Minimal quoting (only when needed) -> RFC style
            // If you prefer to quote *every* field (still valid RFC), set quoted: true.

            // Normalize null/undefined -> '' so you don't get "undefined" text
            cast: {
                // Called for each value; 'any' type fallback
                // context: {column, header, quoting, ...}
                any(value) {
                    if (value === null || value === undefined) return '';
                    // Ensure string output; if object/array, JSON.stringify (or custom)
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
                }
            },

            ...opts, // allow caller overrides (e.g., quoted_empty, bom)
        });

        const writable = fs.createWriteStream(filePath, { encoding: 'utf8' });

        stringifier.on('error', reject);
        writable.on('error', reject);
        writable.on('finish', resolve);

        // Pipe
        stringifier.pipe(writable);

        // Push rows
        for (const row of data) {
            // Ensure all expected columns present
            const normalized = {};
            for (const c of cols) normalized[c] = row[c];
            stringifier.write(normalized);
        }

        stringifier.end();
    });
}


function deriveColumns(data, explicitColumns) {
    if (explicitColumns && explicitColumns.length) return explicitColumns;
    const seen = new Set();
    const cols = [];

    for (const row of data) {
        for (const k of Object.keys(row)) {
            if (!seen.has(k)) {
                seen.add(k);
                cols.push(k);
            }
        }
    }
    return cols;
}


module.exports = writeRfc4180Csv;
