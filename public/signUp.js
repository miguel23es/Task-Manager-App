const signUpButton = document.querySelector('#signUpButton');

signUpButton.addEventListener("click", () => {
    // Grab values when the button is clicked
    const username = document.querySelector('#username').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    console.log(`${username}, ${email}, ${password}`);

    fetch('https://miluz.onrender.com/users', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('User created:', data);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        window.location.href = "index.html";
    })
    .catch(error => {
        console.error('Error creating user:', error);
    });
});

