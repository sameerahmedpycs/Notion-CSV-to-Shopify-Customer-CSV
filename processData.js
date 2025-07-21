const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-write-stream');

const CUSTOMERS_TEMPLATE_FILE = 'customers_template.csv';
const MESSAGE_SALE_PIPELINE_FILE = 'Message Sale Pipeline.csv';
const PROCESSED_OUTPUT_FILE = 'processed_customers_dataa.csv';

async function processCustomersData() {
    let customersTemplateHeaders = [];
    let messageSalePipelineData = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, CUSTOMERS_TEMPLATE_FILE))
            .pipe(csv())
            .on('headers', (headers) => {
                customersTemplateHeaders = headers;
            })
            .on('data', () => {})
            .on('end', () => {
                console.log('Finished reading customers_template.csv headers.');
                resolve();
            })
            .on('error', reject);
    });

    await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, MESSAGE_SALE_PIPELINE_FILE))
            .pipe(csv())
            .on('data', (data) => messageSalePipelineData.push(data))
            .on('end', () => {
                console.log('Finished reading Message Sale Pipeline.csv data.');
                resolve();
            })
            .on('error', reject);
    });

    const processedRows = [];

    let totalEntries = messageSalePipelineData.length;
    let validEntries = 0;
    let invalidEntries = 0;
    let invalidReason = {
        email: 0,
        phone: 0,
        both: 0
    };

    /**
     * Helper function to split a full name into first and last names.
     * Handles cases with single words or multiple words, including Turkish characters.
     * @param {string} fullName - The full name string.
     * @returns {{firstName: string|null, lastName: string|null}} An object with first and last names.
     */
    const splitName = (fullName) => {
        if (!fullName) {
            return { firstName: null, lastName: null };
        }
        const parts = String(fullName).trim().split(' ');
        if (parts.length > 1) {
            return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
        } else if (parts.length === 1) {
            return { firstName: parts[0], lastName: null };
        }
        return { firstName: null, lastName: null };
    };

    /**
     * Helper function to extract potential first and last names from an email address.
     * Converts 'firstname.lastname@domain.com' to 'Firstname Lastname'.
     * @param {string} email - The email address string.
     * @returns {{firstName: string|null, lastName: string|null}} An object with extracted first and last names.
     */
    const extractNameFromEmail = (email) => {
        if (!email) {
            return { firstName: null, lastName: null };
        }
        const match = email.match(/^([^@]+)@/);
        if (match) {
            const namePart = match[1].replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
            return splitName(namePart);
        }
        return { firstName: null, lastName: null };
    };

    /**
     * Validates if a given string is a well-formed email address.
     * @param {string} email - The email string to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    const isValidEmail = (email) => {
        if (!email) return false;
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).toLowerCase());
    };

    /**
     * Formats and validates a phone number, ensuring it has the +90 country code
     * and a sufficient number of digits for a Turkish phone number.
     * @param {string} phone - The phone number string to validate and format.
     * @returns {string|null} Formatted phone number (e.g., +905551234567) if valid, null otherwise.
     */
    const formatAndValidatePhone = (phone) => {
        if (!phone) return null;

        let cleanedPhone = String(phone).replace(/\D/g, '');

        if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
            cleanedPhone = cleanedPhone.substring(1);
        }

        if (cleanedPhone.length === 10) {
            return `+90${cleanedPhone}`;
        }
        else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('90')) {
            return `+${cleanedPhone}`;
        }
        else if (String(phone).startsWith('+') && cleanedPhone.length >= 7) {
             return String(phone).replace(/[^\d+]/g, '');
        }

        return null;
    };


    for (const row of messageSalePipelineData) {
        let invalidEmailFlag = false;
        let invalidPhoneFlag = false;

        const newRow = {};
        customersTemplateHeaders.forEach(header => {
            newRow[header] = null;
        });

        let firstName = null;
        let lastName = null;

        if (row['Customer Full Name'] && String(row['Customer Full Name']).trim()) {
            ({ firstName, lastName } = splitName(row['Customer Full Name']));
        }
        else if (row['Identifier'] && String(row['Identifier']).trim()) {
            const identifierName = String(row['Identifier']).replace(/ x\d+(\+\d*c?)?/, '').trim();
            ({ firstName, lastName } = splitName(identifierName));
        }
        else if (row['Customer Email'] && String(row['Customer Email']).trim()) {
            ({ firstName, lastName } = extractNameFromEmail(row['Customer Email']));
        }

        newRow['First Name'] = firstName;
        newRow['Last Name'] = lastName;

        const email = row['Customer Email'];
        if (isValidEmail(email)) {
            newRow['Email'] = email;
        } else {
            invalidEmailFlag = true;
        }

        const phone = row['Customer Phone(opt.)'];
        const formattedPhone = formatAndValidatePhone(phone);
        if (formattedPhone) {
            newRow['Phone'] = formattedPhone;
            newRow['Default Address Phone'] = formattedPhone;
        } else {
            invalidPhoneFlag = true;
            newRow['Phone'] = null;
            newRow['Default Address Phone'] = null;
        }

        if (invalidEmailFlag) {
            if (invalidPhoneFlag) {
                invalidReason.both++;
            } else {
                invalidReason.email++;
            }
            invalidEntries++;
            continue;
        }

        newRow['Accepts Email Marketing'] = 'yes';
        newRow['Accepts SMS Marketing'] = formattedPhone ? 'yes' : 'no';

        newRow['Default Address Company'] = null;
        newRow['Default Address Address1'] = null;
        newRow['Default Address Address2'] = null;
        newRow['Default Address City'] = null;
        newRow['Default Address Province Code'] = null;
        newRow['Default Address Country Code'] = null;
        newRow['Default Address Zip'] = null;

        const tags = [];
        const travelDate = row['Travel Date'];
        if (travelDate) {
            const dateParts = String(travelDate).split('→');
            if (dateParts.length > 0) {
                const startDateStr = dateParts[0].trim();
                const matchMonthYear = startDateStr.match(/([A-Za-z]+)\s+\d+,\s*(\d{4})/);
                if (matchMonthYear) {
                    const monthName = matchMonthYear[1];
                    const year = matchMonthYear[2];
                    tags.push(`Travel Date Month: ${monthName}`);
                    tags.push(`Travel Date Year: ${year}`);
                }
            }
        }
        newRow['Tags'] = tags.join(', ') || null;

        newRow['Note'] = null;
        newRow['Tax Exempt'] = null;

        processedRows.push(newRow);
        validEntries++;

        if (invalidPhoneFlag) {
            invalidReason.phone++;
        }
    }

    const csvWriter = createCsvWriter({
        headers: customersTemplateHeaders,
        sendHeaders: true,
    });

    const outputStream = fs.createWriteStream(path.join(__dirname, PROCESSED_OUTPUT_FILE));

    outputStream.write(Buffer.from([0xEF, 0xBB, 0xBF]));

    csvWriter.pipe(outputStream);

    processedRows.forEach(row => {
        csvWriter.write(row);
    });

    csvWriter.end();

    outputStream.on('finish', () => {
        console.log(`Processed data saved to ${PROCESSED_OUTPUT_FILE}`);
        console.log('\n=== Processing Statistics ===');
        console.log(`Total Entries in pipeline: ${totalEntries}`);
        console.log(`Valid Entries Processed: ${validEntries}`);
        console.log(`Invalid Entries Skipped (due to invalid email): ${invalidEntries}`);
        console.log('\nReason for Skipped/Invalid Entries:');
        console.log(`- Invalid Email (and valid phone): ${invalidReason.email}`);
        console.log(`- Invalid Phone (but valid email, entry included): ${invalidReason.phone}`);
        console.log(`- Both Invalid Email and Phone: ${invalidReason.both}`);
    });

    outputStream.on('error', (err) => {
        console.error('Error writing CSV:', err);
    });
}

processCustomersData().catch(console.error);

