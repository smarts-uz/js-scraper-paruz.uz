export const axiosConfig = {
    method: 'get',
    baseURL: 'https://server.paruz.uz/api/profiles',
    params: {
        limit: 100,           // Batch size
        // region_id: 14      // SEARCH FROM TASHKENT
    }
};

// File save configuration
export const saveConfig = {
    savePath: 'z:/Equipme/Advocate/Compan/App/',  // Base directory for saving files
    // savePath: './',  // Base directory for saving files
    jsonFilePath: './result.json' // Path to the input JSON file
};