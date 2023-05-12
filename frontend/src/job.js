import { BACKEND_PORT } from "./config.js";
import { fileToDataUrl, validateDate } from "./helpers.js";
import { getFeed } from "./feed.js";

let user = undefined;

const postJob = document.getElementById("submit-job-post");

postJob.addEventListener("click", () => { addJob() });

/**
 * Adds a job with fields (title, start, description, image)
 * to database and updates feed screen when successful.
 */
const addJob = () => {
  user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Get Post a Job form values
  const title = document.getElementById("create-title").value;
  let start = document.getElementById("create-start-date").value;
  const description = document.getElementById("create-description").value;
  let image = document.getElementById("create-image").files;

  start = validateDate(start);

  try {
    validateJobFields(title, start, description, image);
    
    fileToDataUrl(image[0])
      .then((response) => {
        // Convert image to data url
        image = response;
        const data = { title, image, start, description };

        // Post Job
        fetch(`http://localhost:${BACKEND_PORT}/job`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.token,
          },
          body: JSON.stringify(data),
        }).then((response) => {
          if (response.status === 200) {
            // Refresh feed page
            getFeed();

            const modal = document.getElementById("post-job");
            bootstrap.Modal.getInstance(modal).hide();
            alert("Success!");
            
            // Clear form on successful submission
            document.getElementById("create-job-form").reset();
          } else {
            alert("Error: " + response);
          }
        }).catch((error) => {
          alert(error);
          console.error("Error:", error);
        });
      })
      .catch((error) => {
        alert(error);
        console.error("Error:", error);
      });
  } catch (error) {
    alert(error);
    console.log(error);
  }
};

/**
 * Throws error if job fields (title, start date and description) are empty or invalid
 * @param {String} title
 * @param {toISOString} start
 * @param {String} description
 * @param {FileList} image
 */
const validateJobFields = (title, start, description, image) => {
  if (title.trim() === "") {
    throw Error("Please fill out Title.");
  } else if (!start) {
    throw Error("Invalid Start Date");
  } else if (description.trim() === "") {
    throw Error("Please fill out Description.");
  } else if (image.length === 0) {
    throw Error("Please upload png, jpg or jpeg image.");
  }
};
