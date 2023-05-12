import { BACKEND_PORT } from "./config.js";
import { getNameFromId, fileToDataUrl, getProfilePictureFromId, formatDateDMY, validateDate  } from "./helpers.js";
import { createDiv } from "./feed.js";

let user = undefined;
let parameters = undefined;

/***************************************************************
                Populate the User Profile Screen
***************************************************************/

// call the fetch API function to get the user data.
export function fetchUserData(userId) {
  window.scrollTo(0, 0);
  user = JSON.parse(localStorage.getItem("loggedInUser"));
  parameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
  };
  fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, parameters)
    .then((response) => {
      response.json().then((response) => {
        populateUserData(response);
      });
    })
    .catch((error) => {
      alert(error);
      console.error("Error:", error);
    });
}

// Add in all of the user data into the respective locations on the screen
function populateUserData(response) {
  // personal data
  document.getElementById("user-name").innerText = response.name;
  document.getElementById("user-id").innerText = response.id;
  document.getElementById("user-email").innerText = response.email;
  const profilePic = document.getElementById("user-profile-pic");
  if (response.image !== undefined) profilePic.src = response.image;
  else profilePic.src = "assets/profile.png";

  // jobs
  const userJobs = document.getElementById("user-jobs");
  userJobs.innerText = "";
  if (response.jobs.length === 0) {
    userJobs.innerText = "No Current Jobs";
    userJobs.style.textAlign = "center";
  } else {
    userJobs.style.textAlign = "left";
    response.jobs.forEach((postData) => {
      const newPost = createJobDetails(postData);
      userJobs.append(newPost);
    });
  }
  
  // watchers
  const watchers = response.watcheeUserIds;
  const userWatchers = document.getElementById("user-watchers");
  const watchText = document.getElementById("watching-users");
  watchText.innerText = `Watching Users: ${watchers.length} User(s)`;
  if (watchers.length === 0) {
    userWatchers.innerText = "No Watching Users";
  } else userWatchers.innerText = "";
  let loggedInUserWatchingProfile = false;
  for (let i = 0; i < watchers.length; i++) {
    if (watchers[i] === user.userId) loggedInUserWatchingProfile = true;

    let div = document.createElement("div");
    div.className = "user-flex-container"
    div.style.alignItems = "center";
    div.style.width = "200px";
    let userImg = document.createElement("img");
    userImg.className = "user-flex-profile";
    userImg.alt = "User profile picture"
    getProfilePictureFromId(watchers[i], user).then(img => {
      userImg.src = img;
    });
    div.appendChild(userImg);
    let userName = document.createElement("span");
    getNameFromId(watchers[i], parameters).then((name) => {
      userName.innerText = name;
    });
    div.appendChild(userName);

    div.addEventListener("mouseover", function () {
      this.style.color = "#0b65c2";
      this.style.fontWeight = "bold";
    });
    div.addEventListener("mouseout", function () {
      this.style.color = "black";
      this.style.fontWeight = "normal";
    });
    div.addEventListener("click", () => {
      fetchUserData(watchers[i], parameters);
    });
    userWatchers.appendChild(div);
  }
  // watch and edit icon conditions
  const watchingIcon = document.getElementById("watch-profile");
  const watchingTooltip = document.getElementById("watch-profile-tooltip");
  const editIcon = document.getElementById("edit-profile");
  const editTooltip = document.getElementById("edit-profile-tooltip");
  if (response.id === user.userId) {
    // you are on your own profile
    watchingIcon.style.display = "none";
    watchingTooltip.style.display = "none";
    editIcon.style.display = "block";
    editTooltip.style.display = "block";
    editIcon.className = "bi bi-pencil-square";
  } else if (loggedInUserWatchingProfile) {
    watchingIcon.style.display = "block";
    watchingTooltip.style.display = "block";
    watchingIcon.className = "bi bi-eye-slash-fill";
    watchingTooltip.innerText = "Unwatch Profile";
    editIcon.style.display = "none";
    editTooltip.style.display = "none";
  } else {
    watchingIcon.style.display = "block";
    watchingTooltip.style.display = "block";
    watchingIcon.className = "bi bi-eye-fill";
    watchingTooltip.innerText = "Watch Profile";
    editIcon.style.display = "none";
    editTooltip.style.display = "none";
  }
}

/***************************************************************
                  Profile and User Job Features
***************************************************************/

// Edit your own profile button
function editProfile(user) {
  const email = document.getElementById("edit-email").value;
  const password = document.getElementById("edit-password").value;
  const name = document.getElementById("edit-name").value;
  let image = document.getElementById("edit-image").files[0];

  fileToDataUrl(image)
    .then((response) => {
      image = response;
      const data = { email, password, name, image };

      fetch(`http://localhost:${BACKEND_PORT}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user.token,
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status === 200) {
            fetchUserData(user.userId);
            console.log("edit profile: success");
          }
          else if (response.status === 400) console.log("Error: Invalid Input");
          else if (response.status === 403) console.log("Invalid token");
        })
        .catch((error) => {
          alert(error);
          console.error("Error:", error);
        });
      })
      .catch((error) => {
        alert(error);
        console.error("Error:", error);
      });

  // reset the edit profile screen
  document.getElementById("edit-profile-form").reset();
}

// Watch a user button
const watch = document.getElementById("watch-profile");
watch.addEventListener("click", (event) => {
  const email = document.getElementById("user-email").innerText;
  const tooltipText = document.getElementById(
    "watch-profile-tooltip"
  ).innerText;
  let turnon = true;
  if (tooltipText === "Unwatch Profile") turnon = false;
  let data = { email, turnon };
  fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    alert(error);
    console.error("Error:", error);
  });
  const currentProfile = document.getElementById("user-id").innerText;
  fetchUserData(currentProfile);
});

// Create a job button
const createJobDetails = (postData) => {
  const newPost = createDiv("job-container");

  const newImg = document.createElement("img");
  newImg.className = "job-image";
  newImg.style.width = "100px";
  newImg.style.height = "100px";
  newImg.src = postData.image;
  newImg.alt = "Job post image"
  newPost.appendChild(newImg);

  const post = createDiv("job-description");
  const postHeader = createDiv("job-description-header");
  const updateJobIcons = createDiv("update-job-icons");

  const newTitle = document.createElement("h2");
  newTitle.className = "job-header";
  newTitle.innerHTML = postData.title;
  postHeader.appendChild(newTitle);

  let postId = parseInt(postData.id);

  createEditJob(updateJobIcons, postId);
  createDeleteJob(updateJobIcons, postId);

  postHeader.appendChild(updateJobIcons);
  post.appendChild(postHeader);

  const newDescription = document.createElement("p");
  const newDescriptionText = document.createTextNode(postData.description);
  newDescription.appendChild(newDescriptionText);
  post.appendChild(newDescription);

  const newDate = document.createElement("p");
  const newDateText = document.createTextNode('Post Date: ');
  const newDateText2 = document.createTextNode(formatDateDMY(postData.createdAt));
  newDate.className = "job-date";
  newDate.appendChild(newDateText);
  newDate.appendChild(newDateText2);
  post.appendChild(newDate);

  newPost.appendChild(newImg);
  newPost.appendChild(post);
  return newPost;
};

// Update a job button
const requestUpdateJob = (data, newModal) => {
  console.log(data);
  fetch(`http://localhost:${BACKEND_PORT}/job`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      console.log(response);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      bootstrap.Modal.getInstance(newModal).hide();

      alert("Success!");
    })
    .then(() => {
      fetchUserData(user.userId);
    })
    .catch((error) => {
      alert(error);
      console.error("Error:", error);
    });
};

// Create modal for job update button
const createEditJob = (updateJobIcons, postId) => {
  const editJobContainer = createDiv("image-container");
  const editJobIcon = document.createElement("i");
  editJobIcon.setAttribute("aria-label", "Edit job icon")
  editJobIcon.className = "bi bi-pencil-square job-icon";
  editJobIcon.id = `edit-job-icon-${postId}`;
  editJobContainer.appendChild(editJobIcon);

  const spanEdit = document.createElement("span");
  spanEdit.classList.add("tooltip", "edit-job-tooltip");
  spanEdit.textContent = "Edit Job";
  editJobContainer.appendChild(spanEdit);
  updateJobIcons.appendChild(editJobContainer);

  editJobIcon.setAttribute("data-bs-toggle", "modal");
  editJobIcon.setAttribute("data-bs-target", `#modal-${postId}-update-job`);

  const newModal = document.getElementById("update-job").cloneNode(true);
  newModal.id = `modal-${postId}-update-job`;
  updateJobIcons.appendChild(newModal);

  // update modal body, form, label and input id's to make them unique
  const updateModalBody = newModal.querySelector(".modal-body");
  updateModalBody.setAttribute("id", `update-${postId}-job-body`);
  const updateModalForm = newModal.querySelector("#update-job-form");
  updateModalForm.setAttribute("id", `update-${postId}-job-form`);
  updateModalForm.setAttribute("name", "update-job-form");

  const labels = updateModalForm.querySelectorAll("label");
  
  labels.forEach((label) => {
    const forAttr = label.getAttribute("for");
    if (forAttr && forAttr.includes("update")) {
      label.setAttribute("for", forAttr.replace("update", `update-${postId}`));
    }
  });

  const inputs = updateModalForm.querySelectorAll("input");
  const textarea = updateModalForm.querySelectorAll("textarea");
  const formElements = [ ...inputs, ...textarea];

  formElements.forEach((element) => {
    const idAttr = element.getAttribute("id");
    if (idAttr && idAttr.includes("update")) {
      element.setAttribute("id", idAttr.replace("update", `update-${postId}`));
      element.setAttribute("name", idAttr.replace("update", `update-${postId}`));
    }
  });

  const submitJobButton = newModal.querySelector("#submit-job-updates");
  submitJobButton.setAttribute("id", `submit-${postId}-job-updates`);
  submitJobButton.addEventListener("click", () => {
    const title = document.getElementById(`update-${postId}-title`).value;
    const start = document.getElementById(`update-${postId}-start-date`).value;
    const description = document.getElementById(`update-${postId}-description`).value;
    const image = document.getElementById(`update-${postId}-image`).files[0];

    let data = { id: postId };
    data = collateData(data, title, start, description);

    if (image == null) {
      requestUpdateJob(data, newModal);
    } else {
      try {
        fileToDataUrl(image)
        .then((response) => {
          data["image"] = response;
          requestUpdateJob(data, newModal);
        })
        .catch((error) => {
          alert(error);
          console.error("Error:", error);
        });
      } catch (error) {
        alert(error);
      }
    }
  });
};

// Delete a job button
const createDeleteJob = (updateJobIcons, postId) => {
  const deleteJobContainer = createDiv("image-container");
  const deleteJobIcon = document.createElement("i");
  deleteJobIcon.setAttribute("aria-label", "Delete job icon")
  deleteJobIcon.className = "bi bi-trash3 job-icon";
  deleteJobIcon.id = "delete-job-icon";
  deleteJobContainer.appendChild(deleteJobIcon);

  const spanDelete = document.createElement("span");
  spanDelete.classList.add("tooltip", "delete-job-tooltip");
  spanDelete.textContent = "Delete Job";
  deleteJobContainer.appendChild(spanDelete);
  updateJobIcons.appendChild(deleteJobContainer);

  deleteJobIcon.addEventListener("click", (event) => {
    const confirmDelete = confirm("Are you sure you want to delete?");
    if (confirmDelete) {
      fetch(`http://localhost:${BACKEND_PORT}/job`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user.token,
        },
        body: JSON.stringify({ id: postId }),
      })
        .then((response) => {
          console.log(response);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          alert("Success!");
        })
        .then(() => {
          fetchUserData(user.userId);
        })
        .catch((error) => {
          alert(error);
          console.error("Error:", error);
        }
      );
    }
  });
};

/***************************************************************
                      Connecting Screens
***************************************************************/

// Connecting screen to go to edit your profile
const editProfileScreen = document.getElementById("edit-profile-screen");
const userScreen = document.getElementById("user-screen");
const edit = document.getElementById("edit-profile");
edit.addEventListener("click", (event) => {
  userScreen.style.display = "none";
  editProfileScreen.style.display = "block";
});

// Connecting screen to go back to the user profile screen after editing your profile
const updateProfile = document.getElementById("update-profile");
updateProfile.addEventListener("click", (event) => {
  editProfile(user);
  userScreen.style.display = "block";
  fetchUserData(user.userId, parameters);
  editProfileScreen.style.display = "none";
});

/***************************************************************
                      Helper Functions
***************************************************************/

// Appends attribute to data if not empty
const collateData = (data, title, start, description) => {
  if (title !== "") {
    data["title"] = title;
  }
  if (start !== "") {
    start = validateDate(start);
    data["start"] = start;
  }
  if (description !== "") {
    data["description"] = description;
  }
  return data;
};
