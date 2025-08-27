import fs from "fs";
import { saveConfig } from "./config.js";
const { readFileSync, mkdirSync, writeFileSync } = fs;

// Helper functions
const sanitizeFileName = (str) => {
  if (!str) return 'Unknown';
  return str
    .replace(/[<>:"/\\|?*,`'""]/g, '_')  // Replace invalid Windows characters
    .replace(/[\r\n\t]/g, '_')           // Replace newlines, returns, tabs
    .replace(/\s+/g, ' ')                // Replace multiple spaces with single space
    .replace(/^\.|\.$|^\s+|\s+$/g, '')   // Remove leading/trailing dots and spaces
    .trim()
    .substring(0, 100);                  // Limit length to avoid path issues
};
const getData = (value) => value?.toString().trim() || "No data";
const formatPhone = (phone) => {
  if (!phone || phone.toString().trim() === '') return "No data";
  
  // Remove all non-digit characters
  let cleanPhone = phone.toString().replace(/\D/g, '');
  
  // Remove +998 country code if present
  if (cleanPhone.startsWith('998') && cleanPhone.length >= 12) {
    cleanPhone = cleanPhone.substring(3);
  }
  
  // Ensure exactly 9 digits
  if (cleanPhone.length === 9) {
    return cleanPhone;
  } else {
    return "No data"; // Return "No data" if not exactly 9 digits
  }
};

const processPhones = (phoneString) => {
  if (!phoneString || phoneString.toString().trim() === '') {
    return {
      originals: ["No data"],
      formatted: ["No data"]
    };
  }
  
  // Split by comma and clean each phone
  const phones = phoneString.toString().split(',').map(p => p.trim()).filter(p => p);
  
  if (phones.length === 0) {
    return {
      originals: ["No data"],
      formatted: ["No data"]
    };
  }
  
  return {
    originals: phones,
    formatted: phones.map(phone => formatPhone(phone))
  };
};
const extractOrgName = (name) => {
  if (!name) return "No Organization";
  // Extract text inside quotes if present
  const match = name.match(/"([^"]+)"/); 
  let orgName = match ? match[1] : name;
  
  // Clean up the organization name
  orgName = orgName
    .replace(/[\r\n\t]+/g, ' ')          // Replace newlines with spaces
    .replace(/\s+/g, ' ')                // Replace multiple spaces with single space
    .trim();
    
  return orgName || "No Organization";
};

try {
  const data = readFileSync(saveConfig.jsonFilePath, "utf-8");
  const users = JSON.parse(data);
  console.log(`Processing ${users.length} users...`);

  users.forEach((user, index) => {
    try {
      // Get organization and person names
      const orgName = extractOrgName(user.profile?.organization_name?.trim());
      const fio = user.profile?.fio?.trim() || user.username;
      const region = user.profile?.region?.trim();

      // Create safe folder names
      const safeOrgName = sanitizeFileName(orgName);
      const safeFioName = sanitizeFileName(fio);
      
      // Directory paths
      const regionDir = `${saveConfig.savePath}/${region}`;
      const orgDir = `${regionDir}/${safeOrgName}`;
      const personDir = `${orgDir}/${safeFioName}`;

      // Create folders synchronously
      mkdirSync(personDir, { recursive: true });

      // User data extraction
      const phoneData = processPhones(user.profile?.phone);
      const userData = {
        username: getData(user.username),
        address: getData(user.profile?.address),
        cityId: getData(user.profile?.city_id),
        direction: getData(user.profile?.direction),
        city: getData(user.profile?.city),
        license: getData(user.profile?.license_number)
      };

      // Create files with custom naming
      const files = [
        { name: sanitizeFileName(userData.username + '.txt'), content: userData.username },
        { name: sanitizeFileName(userData.address + '.txt'), content: userData.address },
        { name: sanitizeFileName('CityID ' + userData.cityId + '.txt'), content: userData.cityId },
        { name: sanitizeFileName(userData.direction + '.txt'), content: userData.direction },
        { name: sanitizeFileName(userData.city + '.txt'), content: userData.city },
        { name: sanitizeFileName(`Lic# ${userData.license}.txt`), content: userData.license }
      ];
      
      // Add phone files - multiple originals and formatted
      phoneData.originals.forEach((phone) => {
        files.push({
          name: sanitizeFileName(`${phone}.txt`),
          content: phone
        });
      });
      
      phoneData.formatted.forEach((phone) => {
        // Only add formatted if it's different from original and not "No data"
        if (phone !== "No data" && !phoneData.originals.includes(phone)) {
          files.push({
            name: sanitizeFileName(`${phone}.txt`),
            content: phone
          });
        }
      });

      // Write all text files synchronously
      files.forEach(file => {
        try {
          writeFileSync(`${personDir}/${file.name}`, file.content, "utf-8");
        } catch (err) {
          console.error(`Error writing ${file.name}:`, err.message);
        }
      });

      // Write JSON data as json file
      try {
        const jsonFile = 'ALL.json';
        writeFileSync(`${personDir}/${jsonFile}`, JSON.stringify(user, null, 2), "utf-8");
      } catch (err) {
        console.error(`Error writing JSON file:`, err.message);
      }

      // Progress tracking
      if ((index + 1) % 50 === 0 || (index + 1) === users.length) {
        console.log(`Processed ${index + 1}/${users.length} users`);
      }
    } catch (userError) {
      console.error(`Error processing user ${index + 1}:`, userError.message);
    }
  });
  
  console.log(`All ${users.length} users processed successfully!`);
} catch (e) {
  console.error("Error:", e.message);
}