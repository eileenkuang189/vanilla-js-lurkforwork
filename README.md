# Vanilla JS Project: LurkForWork

A single page app for a UNSW adaptation of the popular professional social networking tool, LinkedIn.


## Features
 * Login and registration form
 * Job posting feed, with post like and comment functionality
 * Feed pagination and live updates by polling
 * Viewing and watching user profiles
 * Adding, updating and deleting job posting
 * 

## Running the project locally
### The Frontend

Run the following command once on your machine:

`$ npm install --global http-server`

Then whenever you want to start your server, run the following in your project's root folder:

`$ npx http-server frontend -c 1 -p [port]`


This will start up a second HTTP server where if you navigate to `http://localhost:8000` (or whatever URL/port it provides) it will run your `index.html` without any CORs issues.

### The Backend
Clone this repo and run `yarn install` in `backend` directory once.

To run the backend server, simply run `yarn start` in the `backend` directory. This will start the backend.

To view the API interface for the backend you can navigate to the base URL of the backend (e.g. `http://localhost:5005`). This will list all of the HTTP routes that you can interact with.

Note: backend was provided by cs6080 teaching team.
