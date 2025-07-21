
const fs = require("fs");
const path = require("path");
const { readCSVFile } = require("../lib/helper");




// Function to purify notion leads data
async function readShopifyTemplate() {

    // Path to Template File
    const templateFilePath = path.join(__dirname, '../shopifyTemplate/customer_template.csv');

    // Read File
    const templateData = await readCSVFile(templateFilePath); // Array of objects

    // Log infor
    console.log('leadsData', templateData);

}



async function runPipeline() {
    try {

        await readShopifyTemplate();

    } catch (err) {
        // handle errors gracefully
        console.log("❌ Error during pipeline: " + err.message);
    }
}



runPipeline();

