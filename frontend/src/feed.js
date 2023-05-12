import { BACKEND_PORT } from "./config.js";
import { fetchUserData } from "./user.js";
import { getProfilePictureFromId, formatDateDMY } from "./helpers.js";

const feedScreen = document.getElementById("feed-screen");
const userScreen = document.getElementById("user-screen");
const editProfileScreen = document.getElementById("edit-profile-screen");
const feed = document.getElementById("feed");

let user = undefined;
let scrollCounter = 0;
let numberOfJobs = 0;

/***************************************************************
                  Main Functions for Feed Screen
***************************************************************/

export function getFeed() {
  scrollCounter = 0;
  const parameters = getParameters();
  const loggedInName = document.getElementById("logged-in-name");
  const profilePic = document.getElementById("logged-in-name-pp");
  fetch(
    `http://localhost:${BACKEND_PORT}/user?userId=${user.userId}`,
    parameters
  )
    .then((response) => response.json())
    .then((data) => {
      loggedInName.innerText = data.name;
      profilePic.src = data.image;
    });

  // Clears the feed screen
  feed.replaceChildren();
  createSpinner();

  // Load the first five posts
  loadNextFiveJobs(parameters);

  setIntervalForPolling();

  // Start observing the feed screen for changes in visibility
  observer.observe(feedScreen);
}

// Returns the paramaters used to for GET request for /job/feed
const getParameters = () => {
  user = JSON.parse(localStorage.getItem("loggedInUser"));
  const parameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
  };
  return parameters;
};

// Loads next five jobs based on the global scroll counter 
const loadNextFiveJobs = (parameters) => {
  fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${scrollCounter}`, parameters)
    .then((response) => response.json())
    .then((data) => {
      const creatorIds = data.map((item) => item.creatorId);

      const userDetailPromise = creatorIds.map((userId) => {
        return fetch(
          `http://localhost:${BACKEND_PORT}/user?userId=${userId}`,
          parameters
        ).then((response) => response.json());
      });

      return Promise.all(userDetailPromise).then((userData) => {
        // Map the creator data to the corresponding job info data
        return data.map((item, index) => {
          // Return each item in a new array
          const userDataNoId = userData[index];
          delete userDataNoId.id;
          delete userDataNoId.image;
          return { ...item, ...userData[index] };
        });
      });
    })
    .then((feedAndUserData) => {
      // Ensure chronological order of posts from most to least recent
      feedAndUserData.sort((a, b) => b.createdAt - a.createdAt);
      feedAndUserData.forEach((postData) => {
        const newPost = createNewPost(postData);
        feed.appendChild(newPost);
      });
      // Handle spinner
      const spinner = document.getElementById("spinner");
      if (feedAndUserData.length > 0) {
        spinner.style.display = "block";
        incrementScrollCounter();
      } else {
        spinner.style.display = "none";
        spinner.remove();
      }
    })
    .catch((error) => console.error(error));
};

/***************************************************************
                      Infinite Scroll
***************************************************************/

// Infinite scroll uses Intersection Observer instance to monitor the visibility of the feed screen.
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // When the feed screen is visible, start loading more content
      window.addEventListener("scroll", handleScroll);
    } else {
      // When the feed screen is not visible, stop loading more content
      window.removeEventListener("scroll", handleScroll);
    }
  });
});

const handleScroll = () => {
  if (
    Math.ceil(window.pageYOffset) + Math.ceil(window.innerHeight) >=
    document.body.offsetHeight
  ) {
    loadNextFiveJobs(getParameters());
  }
};

const incrementScrollCounter = () => {
  scrollCounter += 5;
}

/***************************************************************
                      Screen Changing
***************************************************************/

// Connecting screen to go to your own profile screen
const profileLogo = document.getElementById("nav-bar-profile");
profileLogo.addEventListener("click", (event) => {
  const login = document.getElementById("login-screen").style.display;
  if (login !== "block" && user !== undefined) {
    feedScreen.style.display = "none";
    userScreen.style.display = "block";
    editProfileScreen.style.display = "none";
    fetchUserData(user.userId);
  }
});

// Connecting screen to go to the feed screen
const homeLogo = document.getElementById("nav-bar-home");
homeLogo.addEventListener("click", (event) => {
  const login = document.getElementById("login-screen").style.display;
  if (login !== "block" && user !== undefined) {
    feedScreen.style.display = "block";
    userScreen.style.display = "none";
    document.getElementById("new-post").style.display = "none";
    editProfileScreen.style.display = "none";
    getFeed();
  }
});

// Connecting screen to log out of your account. Back to the login screen
const logout = document.getElementById('nav-bar-logout');
logout.addEventListener('click', (event) => {
  const login = document.getElementById('login-screen').style.display;
  const confirmDelete = confirm("Are you sure you want to log out?");
  if (login !== "block" && confirmDelete) {
    // reset website
    document.getElementById('login-screen').style.display = "block";
    document.getElementById('user-screen').style.display = "none";
    document.getElementById('feed-screen').style.display = "none";
    document.getElementById('login-error-message').style.display = "none";
    document.getElementById('edit-profile-screen').style.display = "none";
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    window.scrollTo(0, 0);
  }
});

/***************************************************************
                       Live Update
 ***************************************************************/

// Controller function for polling. This function is called when the user logs in and periodically updates the counters of likes and comments every 5 seconds, while checking for new posts
const setIntervalForPolling = () => {
  setInterval(() => {
    pollCounters();
    // Keep track of how many jobs are currently in the feed
    let updatedNumberOfJobs = 0;
    checkForNewPosts().then(jobs => {
      updatedNumberOfJobs = jobs;
      if (numberOfJobs === 0) numberOfJobs = updatedNumberOfJobs; // first time polling for jobs, ignore
      else if (numberOfJobs === updatedNumberOfJobs - 1) {
        document.getElementById('new-post').style.display = 'block';
        numberOfJobs = updatedNumberOfJobs;
      } else numberOfJobs = updatedNumberOfJobs
    });
  }, 5000);
}

// Function for polling the counters. This function includes the fetch API.
const pollCounters = () => {
  const parameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
  }
  fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${scrollCounter - 5}`, parameters)
    .then(response => response.json())
    .then(data => {
      for (let i = 0; i < data.length; i++) {
        // update the counters for likes
        pollCountersHelper(data[i].likes, 'likes', data[i]);
        // update the counters for comments
        pollCountersHelper(data[i].comments, 'comments', data[i]);
      }
    })
    .catch(error => {
      console.error('Error polling data: ' + error);
    });
}

// Helper function for polling the counters. Prevents duplicated code between likes and comments.
const pollCountersHelper = (path, type, data) => {
  const constant = document.getElementById(`view-${type}-button-text-${data.id}`);
  const value = path.length;
  constant.innerText = `${value} ${type}`;
  // update modal
  const modal = document.getElementById(`modal-${data.id}-${type}-body`);
  modal.innerText = "";
  const modalFade = document.getElementById(`modal-${data.id}-${type}`);
  populateModal(path, modal, type, modalFade);
}

// When the user likes a job post, this function is called to change the button from 'Liked' to 'Disliked', or vice versa.
const toggleLikeDislike = (button, isLiked) => {
  if (isLiked) {
    button.classList.remove("active");
    button.innerText = "";
    const likeIcon = document.createElement("i");
    likeIcon.setAttribute("aria-label", "Thumbs up icon");
    likeIcon.className = "bi bi-hand-thumbs-up feed-icon";
    const text = document.createTextNode("Like");
    button.appendChild(likeIcon);
    button.appendChild(text);
  } else {
    button.classList.add("active");
    button.innerText = "";
    const dislikeIcon = document.createElement("i");
    dislikeIcon.setAttribute("aria-label", "Thumbs down icon");
    dislikeIcon.className = "bi bi-hand-thumbs-down feed-icon";
    const text = document.createTextNode("Dislike");
    button.appendChild(dislikeIcon);
    button.appendChild(text);
  }
  return isLiked;
};

const checkForNewPosts = () => {
  let jobCounter = 0;
  return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${user.userId}`, getParameters())
    .then((response) => response.json())
    .then((data) => {
      const watchedUsers = data.watcheeUserIds;
      const jobCountPromises = watchedUsers.map((watchedUser) => {
        // fetch this user and the number of jobs that they have
        return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${watchedUser}`, getParameters())
          .then((response) => response.json())
          .then((data) => {
            return data.jobs.length;
          })
          .catch((err) => {
            console.error(err);
            return 0;
          });
      });
      return Promise.all(jobCountPromises);
    })
    .then((jobCounts) => {
      // sum up all the job counts
      jobCounter = jobCounts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      console.log('job counter: ' + jobCounter);
      return jobCounter;
    })
    .catch((err) => {
      console.error(err);
      return 0;
    });
}

/***************************************************************
                        Other Functionality
***************************************************************/

// Calls the add comment fetch API to add a comment to a job post.
const addCommentToPost = (id, comment) => {
  let data = { id, comment };
  fetch(`http://localhost:${BACKEND_PORT}/job/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.status === 400) alert("Error: Invalid Input")
      else response.json()
    })
    .catch((error) => {
      alert(error)
      console.error('Error:', error);
    });
  document.getElementById(`comments-text-${id}`).value = "";
}

// Calls the watch profile fetch API to watch a user from email from the feed screen.
const watchButton = document.getElementById("watch-user-from-feed");
watchButton.addEventListener("click", (event) => {
  const email = document.getElementById("watch-user-from-feed-input").value;
  let turnon = true;
  let data = { email, turnon };
  fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status === 400) alert("Error: Invalid Input");
      else alert("You are now watching this user.");
    })
    .catch((error) => {
      alert(error);
      console.error("Error:", error);
    });
});

/***************************************************************
                  Create Element Functions
***************************************************************/

// Create new post HTML elements with the given post data object
const createNewPost = (postData) => {
  // Divs
  const newPost = createDiv("job-post");
  newPost.id = `post-${postData.id}`;

  const postHeader = createDiv("job-post-header");
  const postHeaderLeft = createDiv("padding-10px margin-right-10px");
  const postHeaderRight = createDiv("padding-10px");
  const postContent = createDiv("padding-10px");

  const postContentViewButtons = createDiv("padding-10px view-buttons");
  const postContentReactButtons = createDiv(
    "btn-group padding-10px react-buttons"
  );

  // Text content
  const newImg = document.createElement("img");
  newImg.className = "profile-picture-size";
  newImg.src = postData.image;
  newImg.setAttribute("alt", "Job post image")
  postHeaderLeft.appendChild(newImg);

  const newTitle = document.createElement("h2");
  newTitle.innerText = postData.title;
  postHeaderRight.appendChild(newTitle);

  const newAuthor = createPara("Posted By", postData.name);
  newAuthor.className = "post-author";
  newAuthor.id = `post-author-${postData.creatorId}`;
  postHeaderRight.appendChild(newAuthor);
  newAuthor.addEventListener("click", (event) => {
    fetchUserData(postData.creatorId);
    feedScreen.style.display = "none";
    userScreen.style.display = "block";
  });

  const formattedPostedDate = formatPostedDate(postData.createdAt);
  const newPostedDate = createPara("Posted", formattedPostedDate);

  postHeaderRight.appendChild(newPostedDate);

  const descriptionHeader = document.createElement("h4");
  descriptionHeader.innerText = "Description";
  postContent.appendChild(descriptionHeader);

  const newDescription = document.createElement("p");
  const newDescriptionText = document.createTextNode(postData.description);
  newDescription.appendChild(newDescriptionText);
  postContent.appendChild(newDescription);

  const newStartDate = createPara("Start Date", formatDateDMY(postData.start));
  postHeaderRight.appendChild(newStartDate);

  // View Buttons
  const viewLikeIcon = document.createElement("i");
  viewLikeIcon.setAttribute("aria-label", "Thumbs up icon");
  viewLikeIcon.className = "bi bi-hand-thumbs-up feed-icon";
  viewLikeIcon.id = "view-likes-icon";

  const viewLikeButton = document.createElement("button");
  viewLikeButton.className = "btn btn-link";
  viewLikeButton.id = "view-likes-button";
  const viewLikeButtonText = document.createElement("span");
  viewLikeButtonText.id = `view-likes-button-text-${postData.id}`;
  viewLikeButtonText.innerText = `${postData.likes.length} likes `;
  viewLikeButton.appendChild(viewLikeIcon);
  viewLikeButton.appendChild(viewLikeButtonText);

  // View Like button modal popup
  const viewLikeIconModalType = "likes";
  viewLikeButton.setAttribute("type", "button");
  viewLikeButton.setAttribute("data-bs-toggle", "modal");
  viewLikeButton.setAttribute(
    "data-bs-target",
    `#modal-${postData.id}-${viewLikeIconModalType}`
  );

  const likeModal = createModal(
    postData.likes,
    postData.id,
    viewLikeIconModalType
  );
  postContentViewButtons.appendChild(viewLikeButton);
  postContentViewButtons.appendChild(likeModal);

  const viewCommentIcon = document.createElement("i");
  viewCommentIcon.setAttribute("aria-label", "Chat bubble icon");
  viewCommentIcon.className = "bi bi-chat feed-icon";
  viewCommentIcon.id = "view-comments-button";

  const viewCommentButton = document.createElement("button");
  viewCommentButton.className = "btn btn-link";
  viewCommentButton.id = "view-comments-button";
  const viewCommentButtonText = document.createElement("span");
  viewCommentButtonText.id = `view-comments-button-text-${postData.id}`;
  viewCommentButtonText.innerText = `${postData.comments.length} comments `;

  viewCommentButton.appendChild(viewCommentIcon);
  viewCommentButton.appendChild(viewCommentButtonText);

  // View button modal popup
  const viewCommentIconModalType = "comments";
  viewCommentButton.setAttribute("type", "button");
  viewCommentButton.setAttribute("data-bs-toggle", "modal");
  viewCommentButton.setAttribute(
    "data-bs-target",
    `#modal-${postData.id}-${viewCommentIconModalType}`
  );
  const commentsModal = createModal(
    postData.comments,
    postData.id,
    viewCommentIconModalType
  );
  postContentViewButtons.appendChild(viewCommentButton);
  postContentViewButtons.appendChild(commentsModal);

  // Reactions - Like button
  postContentReactButtons.setAttribute("role", "group");
  postContentReactButtons.setAttribute("aria-label", "Reactions");

  const reactLikeIcon = document.createElement("i");
  reactLikeIcon.setAttribute("aria-label", "Thumbs up icon");
  reactLikeIcon.id = "react-likes-icon";

  const reactLikeButton = document.createElement("button");
  reactLikeButton.id = `like-button-${postData.id}`;
  reactLikeButton.className = "btn btn-outline-primary react-like-button color";
  let reactLikeButtonText = document.createTextNode("Like");

  // Like/Dislike button icon
  let isLiked = postData.likes.some((like) => like.userId === user.userId);
  if (!isLiked) {
    reactLikeIcon.className = "bi bi-hand-thumbs-up feed-icon";
  } else {
    reactLikeButton.classList.add("active");
    reactLikeIcon.className = "bi bi-hand-thumbs-down feed-icon";
    reactLikeIcon.setAttribute("aria-label", "Thumbs down icon");
    reactLikeButtonText = document.createTextNode("Dislike");
  }

  reactLikeButton.appendChild(reactLikeIcon);
  reactLikeButton.appendChild(reactLikeButtonText);
  postContentReactButtons.appendChild(reactLikeButton);

  reactLikeButton.addEventListener("click", (event) => {
    isLiked = toggleLikeDislike(reactLikeButton, isLiked);
    fetch(`http://localhost:${BACKEND_PORT}/job/like`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify({
        id: postData.id,
        turnon: !isLiked,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
      })
      .catch((error) => {
        console.error("Error updating data:", error);
      });
    isLiked = !isLiked;
  });

  // Reactions - Comment button
  const reactCommentIcon = document.createElement("i");
  reactCommentIcon.setAttribute("aria-label", "Chat bubble icon");
  reactCommentIcon.className = "bi bi-chat feed-icon react-comments-icon";

  const reactCommentButton = document.createElement("button");
  reactCommentButton.className = "btn btn-outline-primary";
  reactCommentButton.id = "react-comments-button";
  reactCommentButton.setAttribute("data-bs-toggle", "modal");
  reactCommentButton.setAttribute(
    "data-bs-target",
    `#modal-${postData.id}-${viewCommentIconModalType}`
  );
  const reactCommentButtonText = document.createTextNode("Comment");
  reactCommentButton.appendChild(reactCommentIcon);
  reactCommentButton.appendChild(reactCommentButtonText);
  postContentReactButtons.appendChild(reactCommentButton);

  // Add the HTML elements to the newPost
  postHeader.appendChild(postHeaderLeft);
  postHeader.appendChild(postHeaderRight);
  newPost.appendChild(postHeader);
  newPost.appendChild(postContent);
  newPost.appendChild(postContentViewButtons);
  newPost.appendChild(postContentReactButtons);
  return newPost;
};

// Creates a spinner element on feed page
const createSpinner = () => {
  const container = document.createElement("div");
  container.classList.add("d-flex", "justify-content-center");

  const spinner = document.createElement("div");
  spinner.classList.add("spinner-border", "m-5");
  spinner.setAttribute("role", "status");
  spinner.setAttribute("id", "spinner");
  spinner.style.display = "none";

  const span = document.createElement("span");
  span.classList.add("visually-hidden");
  span.textContent = "Loading...";

  spinner.appendChild(span);

  container.appendChild(spinner);
  feedScreen.appendChild(container);
  return container;
};

// Creates a new div element with a class name
export const createDiv = (className) => {
  const newDiv = document.createElement("div");
  newDiv.className = className;
  return newDiv;
};

// Creates a new paragraph element with a label and its text content
const createPara = (labelName, paraText) => {
  const newPara = document.createElement("p");
  const newParaText = document.createTextNode(paraText);
  const newParaLabel = document.createElement("b");
  const newlabelText = document.createTextNode(labelName + ": ");
  newParaLabel.appendChild(newlabelText);

  newPara.appendChild(newParaLabel);
  newPara.appendChild(newParaText);
  return newPara;
};

// Creates a new modal popup, and populates the body with contentList
// Post Id used in element id's, modalType is either "likes" or "comments"
const createModal = (contentList, postId, modalType) => {
  const modalFade = createDiv("modal fade");
  modalFade.id = `modal-${postId}-${modalType}`;

  modalFade.setAttribute("tabindex", "-1");
  modalFade.setAttribute("role", "dialog");
  modalFade.setAttribute(
    "aria-labelledby",
    `modal-${postId}-${modalType}-label`
  );
  modalFade.setAttribute("aria-hidden", "true");

  const modalDialog = createDiv("modal-dialog modal-dialog-scrollable");
  modalDialog.setAttribute("role", "document");

  const modalContent = createDiv("modal-content");

  const modalHeader = createDiv("modal-header");
  const modalHeaderText = document.createElement("h4");
  modalHeaderText.setAttribute("class", "modal-title");
  modalHeaderText.setAttribute("id", `modal-${postId}-${modalType}-label`);
  modalHeaderText.innerText =
    modalType.charAt(0).toUpperCase() + modalType.slice(1);

  const closeButton = document.createElement("button");
  closeButton.className = "btn-close";
  closeButton.setAttribute("type", "button");
  closeButton.setAttribute("data-bs-dismiss", "modal");
  closeButton.setAttribute("aria-label", "Close");

  const modalBody = createDiv("modal-body");
  modalBody.style.display = "block";
  modalBody.setAttribute("id", `modal-${postId}-${modalType}-body`);
  populateModal(contentList, modalBody, modalType, modalFade);

  const modalComment = createDiv("padding-10px");
  if (modalType === "comments") {
    // add section to add comments
    user = JSON.parse(localStorage.getItem("loggedInUser"));
    let commentsSection = document.createElement("div");
    commentsSection.className = "comments-section";
    let commentsProfile = document.createElement("img");
    commentsProfile.className = ("user-flex-profile");
    getProfilePictureFromId(user.userId, user).then(img => {
      commentsProfile.src = img;
    });
    commentsProfile.alt = "User profile picture";
    let commentsAdd = document.createElement("input");
    commentsAdd.type = "text";
    commentsAdd.className = "comments-text";
    commentsAdd.id = `comments-text-${postId}`;
    commentsAdd.placeholder = "  Add a comment...";
    let commentsPost = document.createElement("button");
    commentsPost.className = "comments-post";
    commentsPost.innerText = "Comment";
    commentsPost.addEventListener("click", (event) => {
      const newComment = document.getElementById(
        `comments-text-${postId}`
      ).value;
      addCommentToPost(postId, newComment);
    });
    commentsSection.appendChild(commentsProfile);
    commentsSection.appendChild(commentsAdd);
    commentsSection.appendChild(commentsPost);
    modalComment.appendChild(commentsSection);
  }

  const modalFooter = createDiv("modal-footer");
  const footerCloseButton = document.createElement("button");
  footerCloseButton.setAttribute("type", "button");
  footerCloseButton.className = "btn btn-secondary";
  footerCloseButton.setAttribute("data-bs-dismiss", "modal");
  footerCloseButton.innerText = "Close";

  modalHeader.appendChild(modalHeaderText);
  modalHeader.appendChild(closeButton);
  modalFooter.appendChild(footerCloseButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalComment);
  modalContent.appendChild(modalFooter);
  modalDialog.appendChild(modalContent);
  modalFade.appendChild(modalDialog);
  return modalFade;
};

// Populate modal for likes/dislikes and comments
const populateModal = (path, modal, type, modalFade) => {
  const auth = JSON.parse(localStorage.getItem("loggedInUser"));
  if (path.length === 0) {
    const newUser = document.createElement("p");
    newUser.innerText = `No ${type}`;
    modal.appendChild(newUser);
  } else if (type === "likes") {
    path.forEach((user) => {
      let newUser = document.createElement("div");
      newUser.className = "user-flex-container";
      newUser.style.alignItems = "center";
      let userImg = document.createElement("img");
      userImg.className = "user-flex-profile";
      getProfilePictureFromId(user.userId, auth).then((img) => {
        userImg.src = img;
      });
      newUser.appendChild(userImg);
      let userName = document.createElement("span");
      userName.innerText = user.userName;
      newUser.appendChild(userName);
      newUser.addEventListener("click", (event) => {
        bootstrap.Modal.getInstance(modalFade).hide();
        fetchUserData(user.userId);
        feedScreen.style.display = "none";
        userScreen.style.display = "block";
      });
      modal.appendChild(newUser);
    });
  } else if (type === "comments") {
    path.forEach((user) => {
      let newComment = document.createElement("div");
      newComment.className = "user-flex-container";
      let commentLeft = document.createElement("div");
      commentLeft.className = "user-flex-left";
      let userImg = document.createElement("img");
      userImg.className = "user-flex-profile";
      getProfilePictureFromId(user.userId, auth).then((img) => {
        userImg.src = img;
      });
      commentLeft.appendChild(userImg);
      let commentRight = document.createElement("div");
      commentRight.className = "user-flex-right";
      let commentUserName = document.createElement("b");
      commentUserName.className = "comments-user-name";
      commentUserName.innerText = user.userName;

      let commentUserComments = document.createElement("p");
      commentUserComments.className = "comments-user-comment";
      commentUserComments.innerText = user.comment;

      commentRight.appendChild(commentUserName);
      commentRight.appendChild(commentUserComments);
      newComment.appendChild(commentLeft);
      newComment.appendChild(commentRight);
      newComment.addEventListener("click", (event) => {
        bootstrap.Modal.getInstance(modalFade).hide();
        fetchUserData(user.userId);
        feedScreen.style.display = "none";
        userScreen.style.display = "block";
      });
      modal.appendChild(newComment);
    });
  }
};


// Formats a string postedDate
const formatPostedDate = (postedDate) => {
  let posted = new Date(postedDate);
  const diffInMs = Date.now() - posted;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 24) {
    // display how many hours and minutes ago it was posted
    return (
      diffInHours + " hours " + (diffInMins - diffInHours * 60) + " mins ago"
    );
  } else {
    // display posted date as DD/MM/YYYY
    return posted.toLocaleDateString("en-GB");
  }
};
