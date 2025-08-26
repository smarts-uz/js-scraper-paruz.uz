import fs from "fs";
const { readFile, mkdir, writeFile } = fs;

// Helper functions
const sanitizeFileName = (str) => str.replace(/[<>:"/\\|?*,]/g, '_');
const getData = (value) => value?.toString().trim() || "No data";
const extractOrgName = (name) => {
  if (!name) return "No Organization";
  const match = name.match(/"([^"]+)"/); 
  return match ? match[1] : name;
};

readFile('./result.json', "utf-8", (err, data) => {
  if (err) return console.error("Error reading file:", err.message);

  try {
    const users = JSON.parse(data);
    console.log(`Processing ${users.length} users...`);

    users.forEach((user, index) => {
      // Get organization and person names
      const orgName = extractOrgName(user.profile?.organization_name?.trim());
      const fio = user.profile?.fio?.trim() || user.username;
      
      // Create safe folder names
      const safeOrgName = sanitizeFileName(orgName);
      const safeFioName = sanitizeFileName(fio);
      
      // Directory paths
      const orgDir = `./organizations/${safeOrgName}`;
      const personDir = `${orgDir}/${safeFioName}`;

      // Create folders
      mkdir(orgDir, { recursive: true }, (err) => {
        if (err) return console.error(`Error creating org folder:`, err.message);
        
        mkdir(personDir, { recursive: true }, (err) => {
          if (err) return console.error(`Error creating person folder:`, err.message);

          // User data extraction
          const userData = {
            username: getData(user.username),
            address: getData(user.profile?.address),
            phone: getData(user.profile?.phone),
            cityId: getData(user.profile?.city_id),
            direction: getData(user.profile?.direction),
            city: getData(user.profile?.city),
            license: getData(user.profile?.license_number)
          };

          // Create files with your custom naming
          const files = [
            { name: sanitizeFileName(userData.username), content: userData.username },
            { name: sanitizeFileName(userData.address), content: userData.address },
            { name: sanitizeFileName(userData.phone), content: userData.phone },
            { name: sanitizeFileName('CityID ' + userData.cityId), content: userData.cityId },
            { name: sanitizeFileName(userData.direction), content: userData.direction },
            { name: sanitizeFileName(userData.city), content: userData.city },
            { name: sanitizeFileName(`Lic#${userData.license}.txt`), content: userData.license }
          ];

          // Write all text files
          files.forEach(file => {
            writeFile(`${personDir}/${file.name}`, file.content, "utf-8", (err) => {
              if (err) console.error(`Error writing ${file.name}:`, err.message);
            });
          });

          // Write JSON file
          const jsonFile = `${personDir}/${safeFioName}.json`;
          writeFile(jsonFile, JSON.stringify(user, null, 2), "utf-8", (err) => {
            if (err) console.error(`Error writing JSON:`, err.message);
          });
        });
      });
      
      // Progress tracking
      if ((index + 1) % 50 === 0 || (index + 1) === users.length) {
        console.log(`Processed ${index + 1}/${users.length} users`);
      }
    });
    
    console.log(`All ${users.length} users processed`);
  } catch (e) {
    console.error("JSON parsing error:", e.message);
  }
});