
const fs = require("fs");
const path = require("path");
const { readCSVFile } = require("./lib/helper");
const writeRfc4180Csv = require("./scripts/write-rfc4180");






// Function to purify notion leads data
async function readNotionLeads() {

    // Path to Notion Leads Data
    const notionDir = path.join(__dirname, './notionLeads');

    // Get all files 
    const leadFiles = fs.readdirSync(notionDir);

    // Get current
    const file = leadFiles[0]; // Get first file

    // File Path
    const filePath = path.join(notionDir, file);


    // Read File
    const leadsData = await readCSVFile(filePath); // Array of objects

    // Log infor
    console.log('leadsData', leadsData);

}


async function filterNotionLeads(leadsData) {


    // Loop on leads data
    const purifiedLeads = leadsData?.map((row, index) => {

        let customer = {
            // Lead entry according to shopify template
        };


        /* Study Structure

            Identifier: 'Furkan Gokcen x1',
            Amount: '$199.50',
            Travel Date': 'July 20, 2025',
            Status: 'Sale',
            Customer Full Name: 'Furkan Gökçen',
            Customer Email: 'fnrkan@gmail.com',
            Customer Phone(opt.): '+905385287211',
            Pax: '1',
            Created by: 'Enes Burak Elmal',
            Created time: 'July 20, 2025 10:20 AM',
            Last edited time: 'July 20, 2025 10:21 AM'
        
        */

            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''
            customer['First Name'] = ''






            return customer;



    });


    // Write purified file
    await writeRfc4180Csv(purifiedLeads, './output/shopifyData.csv');


}


async function runPipeline() {
    try {

        // Step 1 : Read Notion Leads Data
        const leadsData = await readNotionLeads();

        // Step 2 : Filter and Purify according tho shopify template
        await filterNotionLeads(leadsData);


    } catch (err) {
        // handle errors gracefully
        console.log("❌ Error during pipeline: " + err.message);
    }
}



runPipeline();

