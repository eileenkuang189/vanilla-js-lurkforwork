import { BACKEND_PORT } from './config.js';
import { getFeed } from './feed.js';
import { generateErrorMessage } from './helpers.js';

const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerButton = document.getElementById('swap-to-register');
const goBackButton = document.getElementById('go-back');

const feedScreen = document.getElementById('feed-screen');

// when the 'Login' button is clicked on the login screen, this function is called to authorise the user
loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const data = { email, password };

    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            const errorMessage = document.getElementById('login-error-message');
            generateErrorMessage(errorMessage, "Invalid Login Details. Please try again.");
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('loggedInUser', JSON.stringify(data));
        // redirect to the feed page
        loginScreen.style.display = "none";
        feedScreen.style.display = "block";
        getFeed();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

// when the 'Register' button is clicked on the register screen, this function is called to register the user
registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const data = { email, password, name };

    if (password != confirmPassword) {
        alert('Passwords do not match');
        throw new Error('Passwords do not match');
    }
    fetch( `http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            const errorMessage = document.getElementById('register-error-message');
            generateErrorMessage(errorMessage, 'Email address already registered');
        }
        return response.json();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// button to go to the register screen
registerButton.addEventListener('click', (event) => {
    loginScreen.style.display = "none";
    registerScreen.style.display = "block";
    window.scrollTo(0, 0);
});

// button to go back to the login screen
goBackButton.addEventListener('click', (event) => {
    loginScreen.style.display = "block";
    registerScreen.style.display = "none";
    window.scrollTo(0, 0);
});
