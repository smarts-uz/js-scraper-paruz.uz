import axios from "axios";
import fs from "fs";
import { axiosConfig } from "./config.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeAllData() {
    console.log("🚀 Starting data scraping with page-based pagination...");
    
    try {
        const allData = [];
        const seenIds = new Set();
        let page = 1;
        const pageSize = 50; // Small pages to avoid server errors
        let emptyPages = 0;
        
        while (emptyPages < 3) { // Stop after 3 empty pages
            try {
                console.log(`📝 Fetching page ${page}...`);
                
                const response = await axios({
                    ...axiosConfig,
                    params: {
                        limit: pageSize,
                        page: page
                    }
                });
                
                const batch = response.data;
                
                if (!batch || batch.length === 0) {
                    emptyPages++;
                    console.log(`⚠️  Empty page ${emptyPages}/3 at page ${page}`);
                    page++;
                    continue;
                }
                
                emptyPages = 0; // Reset counter
                let newRecords = 0;
                
                for (const user of batch) {
                    const userId = user.profile?.user_id || user.username;
                    if (!seenIds.has(userId)) {
                        seenIds.add(userId);
                        allData.push(user);
                        newRecords++;
                    }
                }
                
                console.log(`✅ Page ${page}: ${batch.length} records, ${newRecords} new, total unique: ${allData.length}`);
                
                page++;
                await delay(800); // Pause between requests
                
            } catch (error) {
                console.error(`❌ Error at page ${page}:`, error.message);
                
                if (error.message.includes('500')) {
                    console.log("⚠️  Server error, waiting longer...");
                    await delay(3000);
                    page++;
                    emptyPages++;
                } else {
                    break;
                }
            }
            
            // Safety limit
            if (page > 200) {
                console.log("⚠️  Reached safety limit (200 pages)");
                break;
            }
        }
        
        // Save results
        if (allData.length > 0) {
            console.log("💾 Saving results...");
            fs.writeFileSync('result.json', JSON.stringify(allData, null, 2), 'utf8');
            console.log(`🎉 Successfully saved ${allData.length} unique records!`);
        } else {
            console.log("📋 No data collected");
            fs.writeFileSync('result.json', '[]', 'utf8');
        }
        
    } catch (error) {
        console.error('💥 Critical error:', error.message);
    }
}

scrapeAllData();
