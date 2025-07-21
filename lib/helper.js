const fs = require("fs");
const { parse } = require("csv-parse");



// Function to read CSV
async function readCSVFile(filePath) {
    const parser = parse({
        bom: true,
        record_delimiter: '\r\n',
        delimiter: ',',
        quote: '"',
        relax_quotes: true,
        relax_column_count: true,
        skip_empty_lines: true,
        escape: '"',
        columns: true,
        trim: true,
        comment: '#',
    });

    return new Promise((resolve, reject) => {
        const rows = [];

        fs.createReadStream(filePath)
            .on('error', (err) => {
                console.error('File Read Error:', err.message);
                reject(err);
            })
            .pipe(parser)
            .on('data', (row) => {
                rows.push(row);
            })
            .on('error', (err) => {
                console.error('Parsing Error:', err.message);
                reject(err);
            })
            .on('end', () => {
                // console.log(': Finished parsing for.');
                resolve(rows);
            });
    });
}



module.exports = {
    readCSVFile
};