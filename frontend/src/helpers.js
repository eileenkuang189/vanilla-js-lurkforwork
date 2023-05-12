import { BACKEND_PORT } from "./config.js";

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

// parse in an user-id and return the name of the user. Pass in the parameters needed for the getUser fetch function
export function getNameFromId(id, parameters) {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${id}`, parameters)
    .then(response => response.json())
    .then(data => {
        return data.name;
    });
}

// parse in an user-id and return the profile picture of the user.
export function getProfilePictureFromId(id, auth) {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.image !== undefined) return data.image;
        else return 'assets/profile.png';
    });
}

// generate an error message for login/register, and then show the error message on the screen
export function generateErrorMessage(error, message) {
    error.textContent = message;
    error.style.display = 'block';
    error.parentElement.setAttribute('aria-label', 'Error: ' + error.textContent);
    throw new Error(message);
}

/**
 * Converts a string date to DD/MM/YYYY format
 * @param {String} date 
 * @returns string in DD/MM/YYYY format
 */
export const formatDateDMY = (date) => {
    let newDate = new Date(date);
    return newDate.toLocaleDateString("en-GB");
};

/**
 * 
 * @param {String} date input 
 * @returns false if invalid or not regex matching date
 * @returns date in ISOString format if input matches regex and is a valid date
 */
export const validateDate = (input) => {
    // Regex for valid date format: dd/mm/yyyy
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
    if (!regex.test(input)) {
      return false;
    }
  
    // if input matches regex, parse input as date and check if it is a valid date
    const parts = input.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return false;
    }
  
    // if input matches regex and is a valid date, return date in ISOString format
    return date.toISOString();
  };
