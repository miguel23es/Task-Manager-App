const avatarUpload = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('avatar-preview');
const signOutButton = document.querySelector('.sign-out');
const deleteBtn = document.querySelector('.delete');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');
const email = localStorage.getItem('email');

// Load saved avatar
window.addEventListener('DOMContentLoaded', async () => {
    if(!userId) return;

    const res = await fetch(`/users/${userId}`);
    const data = await res.json();

    if(data.avatarUrl) {
        avatarPreview.src = data.avatarUrl;
    }
});

// When user uploads a new image 
avatarUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if(!file) return;

    // shows a preview
    avatarPreview.src = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append('avatar', file);
    const userId = localStorage.getItem('userId');

    // Upload to server 
    await fetch(`/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
    });
});


// Name for the user
document.addEventListener("DOMContentLoaded", async () => {
  const userName = document.querySelector(".username");
  const emailName = document.querySelector(".emailName");
  const no_tasks = document.querySelector(".no_tasks");

  userName.innerText = username;
  emailName.innerText = `Email: ${email}`;

  try {
    const res = await fetch(`/tasks/count/${userId}`);
    const data = await res.json();
    no_tasks.innerText = `Number of tasks: ${data.totalTasks}`;
  } catch (err) {
    console.error("Task count failed", err);
    no_tasks.innerText = "Number of tasks: 0";
  }
});



// Signs user out
signOutButton.addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "login.html";
});

// Deletes account
deleteBtn.addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to delete your account?");
    if(!confirmed) return;

    fetch(`/users/${userId}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        alert("Your account has been deleted!");
        localStorage.removeItem("userId");
        window.location.href = "login.html";
    })
    .catch(err => {
      console.error("Failed to delete account:", err);
      alert("There was a problem deleting your account.");
    });
})