import axios from "axios";
import fs from "fs"
import { axiosConfig } from "./config.js";

try {
    let response = await axios(axiosConfig)

    let parsedData = response.data

    fs.writeFile('result.json', JSON.stringify(parsedData, null, 2), (err) => {
        if (err) {
          console.error('Error on file write:', err);
        } else {
          console.log('Successfully parsed data');
        }
      });
} catch (err) {
    console.log(err)
}
