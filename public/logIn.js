
// Grabs the login button
const logInButton = document.querySelector('#logInButton')

// Function to login the user
function logInUser(){
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    // POST route to compare with the database
    fetch('/login', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            password,
        }),
    })
    .then(response => response.json())
    .then(data => {
        // If user exists
        if(data._id){
            console.log('Logged in:', data);
            localStorage.setItem('userId', data._id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', email);
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Login failed');
        }
    })
    .catch(err => {
        console.error('Login request failed:', err);
    });
}

logInButton.addEventListener('click', logInUser)