const description = [];
let firstClick = true;
let click = true;
let lastSelectedDate= "";
let start = "";
let end = "";
let countTask = 0;
let calendar;
let isoString;

let startStr = "";
let endStr = "";

let notes = {}; 
let tabNames = {};
let currentTab = 'general';

const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');


if(!userId){
    window.location.href = "login.html";
}

// Greeting the user
document.addEventListener("DOMContentLoaded", () => {
    fetchTasks();
    fetchNotes(currentTab);
    console.log(userId);
    greeting = document.querySelector(".greeting");
    greeting.innerHTML = `Good Morning, ${username}`;
});

// Full Calendar implementation API
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        timeZone: 'local',
        editable: true,
        events: [], // We'll load your tasks here next
        headerToolbar: {
        left: 'prev,next,today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        eventDidMount: function(info) {
            const now = new Date();
            const eventEnd = info.event.end || info.event.start;

            if (eventEnd < now) {
            info.el.classList.add("past-event");
            }
        },
    });
  calendar.render();

});

fetch(`https://miluz.onrender.com/tasks?user=${userId}`)
    .then(res => res.json())
    .then(tasks => {
      const events = tasks.map(task => 
        task.start === ""
            ? {
                title: task.title,
                start: task.dueDate,
                allDay: true
            }
            : {
                title: task.title,
                start: task.start,
                end: task.end
            }
        );

      calendar.addEventSource(events);
});



// When any of the tabs buttosn are pressed
document.querySelectorAll('.tabs button').forEach(button => {
    // Makes tab pressed button get darker and others normal
    button.addEventListener('click', () => {
        currentTab = button.dataset.tab;
       console.log("Tab clicked:", currentTab);
       document.querySelectorAll('.tabs button').forEach(btn => {
            btn.classList.remove('active-tab');
        }); 

        button.classList.add('active-tab');
        
         const notesContainer = document.querySelector('.noteSection');
        // Back button is a tab is pressed, check is there is already a back button
        const newNoteContainer = document.querySelector('.newNote');
        if (!newNoteContainer.querySelector('.backBtn')) {
            const backBtn = document.createElement("div");
            backBtn.classList.add("backBtn"); // names back button for future use
            backBtn.innerHTML = `
                <button class="homeNoteBtn"><i class="fa-solid fa-house"></i></button>
            `;
            newNoteContainer.append(backBtn);

            // Back button press, it loads general notes, and removes title, titleContainer and old notes
            backBtn.addEventListener("click", () => {
                currentTab = "general";
                backBtn.remove(); 
                const titleContainer = document.querySelector('.tabTitleContainer');
                if (titleContainer) {
                titleContainer.remove();
                }
                const h2 = document.querySelector('.tabTitle');
                if (h2) {
                h2.remove();
                }
                document.querySelectorAll('.tabs button').forEach(btn => {
                btn.classList.remove('active-tab');
                });
                notesContainer.value = '';
                fetchNotes(currentTab);             
            });
            
        }

        fetchNotes(currentTab);
        const tabTitleDiv = document.querySelector('.tabTitle');
        if (tabTitleDiv) {
            document.body.addEventListener("click", (e) => {
                if (e.target.classList.contains("tabTitle")) {
                    //Get the text content from the h2
                    const titleText = e.target.textContent.trim();
                    e.target.remove();
                    // Pass it to updateTitle
                    updateTitle(titleText);
                }
            });
        }

        document.querySelector('.tabTitleContainer')?.remove();
        document.querySelector('.tabTitle')?.remove();
    })
})

function updateTitle(tabTitle){
    let saveBtnAction = false;
    const headerContainer = document.querySelector('.newNote');
    
    document.querySelector('.tabTitleContainer')?.remove();
    document.querySelector('.tabTitle')?.remove();

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("tabTitleContainer");

    titleContainer.innerHTML = `
        <textarea class="tabTitleInput" placeholder="Name this tab">${tabTitle}</textarea>
        <button class="saveTitleBtn"><i class="fa-solid fa-check"></i></button>
    `;

    headerContainer.append(titleContainer);

    const input = titleContainer.querySelector(".tabTitleInput");
    input.focus();

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            titleContainer.querySelector(".saveTitleBtn").click();
        }
    });

    titleContainer.querySelector(".saveTitleBtn").addEventListener("click", () => {
        saveBtnAction = true;
        const title = input.value.trim();
        if (title) {
            tabNames[currentTab] = title;
            titleContainer.remove();
            showTabTitle(title);
        }
    });
    if(saveBtnAction == false){
        return;
    }
}

function showTitleInput() {
    const headerContainer = document.querySelector('.newNote');
    
    document.querySelector('.tabTitleContainer')?.remove();
    document.querySelector('.tabTitle')?.remove();

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("tabTitleContainer");

    titleContainer.innerHTML = `
        <textarea class="tabTitleInput" placeholder="Name this tab"></textarea>
        <button class="saveTitleBtn"><i class="fa-solid fa-check"></i></button>
    `;

    headerContainer.append(titleContainer);

    const input = titleContainer.querySelector(".tabTitleInput");
    input.focus();

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            titleContainer.querySelector(".saveTitleBtn").click();
        }
    });

    titleContainer.querySelector(".saveTitleBtn").addEventListener("click", () => {
        const title = input.value.trim();
        if (title) {
            tabNames[currentTab] = title;
            titleContainer.remove();
            showTabTitle(title);
        }
    });
}

function showTabTitle(title) {
    const newNoteContainer = document.querySelector('.newNote');
    if (!newNoteContainer) return; // Safety check

    // Remove any existing title element
    document.querySelector('.tabTitle')?.remove();

    // Create and append new title element
    const h2 = document.createElement("h2");
    h2.classList.add("tabTitle");
    h2.textContent = title;

    newNoteContainer.append(h2);

    fetch(`https://miluz.onrender.com/tabs/${currentTab}`, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ title: title })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Updated tab:", data);
    })
    .catch(err => {
        console.error("Error updating tab:", err);
    });

}
let debounceTimer;
const textArea = document.querySelector(".noteSection");

textArea.addEventListener("input", () => {
  clearTimeout(debounceTimer);  // Clear the previous timer

  debounceTimer = setTimeout(() => {
    const noteInput = textArea.value.trim();

    fetch(`https://miluz.onrender.com/tab/${currentTab}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note: noteInput }),
    })
      .then((res) => res.json())
      .then((updatedTab) => {
        console.log("Note saved:", updatedTab.notes);
      })
      .catch((err) => console.error("Error saving note:", err));
  }, 500);  // Adjust debounce delay (in ms) here
});

// Function to fetch notes when needed
function fetchNotes(currentTab) {
    fetch(`https://miluz.onrender.com/tabs?id=${currentTab}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0 && currentTab !== 'general') {
                showTitleInput();
                return;
            }

            const tab = data[0];

            if (!tab.title && currentTab !== 'general') {
                showTitleInput();
            } else {
                showTabTitle(tab.title);
            }

            document.querySelector('.noteSection').value = tab.notes || "";

            const newNoteContainer = document.querySelector('.tabTitleContainer');
            if (newNoteContainer) {
                newNoteContainer.textContent = tab.title;
            }
        })
        .catch(err => {
            console.error("Failed to fetch notes:", err);
        });
}



//If new task button is pressed
document.body.addEventListener("click", (event) => {
    if (event.target.closest(".button-container") || event.target.closest(".new-button")) {
        if(click){
            click = false;
            const newItem = document.createElement("div");
            newItem.classList.add("popup");
            // Add content to the popup
            newItem.innerHTML = `
            <div class="popup-content">
                <button class="x-mark"><i class="fa-solid fa-x"></i></button>
                <h2>New Task</h2>
                <input type="text" id="task-input" placeholder="Enter task name">
                <div class="task-plus">
                <button class="due-date">
                    <i class="fa-solid fa-calendar"></i>
                </button>
                <button class="description">
                    <i class="fa-solid fa-file-pen">
                </i></button>
                </div>
                <button class="create-btn"><p>Create Task</p></button>
            </div>
        `;
    
            // Append to the body
            document.body.appendChild(newItem);
    
            // Select elements inside the popup
            const taskInput = newItem.querySelector("#task-input");
            const createButton = newItem.querySelector(".create-btn");
            const closeButton = newItem.querySelector(".x-mark");
            let currentTop = 0;
    
            // Creates the pop up for the due date
            const newItem_2 = document.createElement("div");
            newItem_2.classList.add("popup");
            const dueDate = newItem.querySelector(".due-date");
    
            // When icon of due-date click, it opens up a window to choose due date
            dueDate.addEventListener("click", () => {
                newItem_2.innerHTML = `
                <button class="x-mark"><i class="fa-solid fa-x"></i></button>
                <p>Choose your due date</p>
                <input type="text" id="datePicker" placeholder = "Select Date..."/>
                <div class = "time-range-container">
                    <div>
                        <label for="startTime">Start Time:</label>
                        <input type="text" id="startTime" placeholder="Start Time">
                    </div>
                    <div>
                        <label for="endTime">End Time:</label>
                        <input type="text" id="endTime" placeholder="End Time">
                    </div>
                </div>
                <div>
                    <div class="all-day-container">
                        <input type="checkbox" id="allDayCheckbox" />
                        <label for="allDayCheckbox">All-Day</label>
                    </div>
                <button class="save-task">Save</button>
            `;
                document.body.appendChild(newItem_2);
                // If user chooses All Day 
                const allDayCheckbox = newItem_2.querySelector("#allDayCheckbox");
                const startTimeInput = newItem_2.querySelector("#startTime");
                const endTimeInput = newItem_2.querySelector("#endTime");

                allDayCheckbox.addEventListener("change", () => {
                const isChecked = allDayCheckbox.checked;
                startTimeInput.disabled = isChecked;
                endTimeInput.disabled = isChecked;

                // Change opacity to show they're disabled
                startTimeInput.style.opacity = isChecked ? "0.5" : "1";
                endTimeInput.style.opacity = isChecked ? "0.5" : "1";
                
                // Clears values if chosen
                if (isChecked) {
                    startTimeInput.value = "";
                    endTimeInput.value = "";
                    start = "";
                    end = "";
                    startStr = "";
                    endStr = "";
                }
                });
                // Flat pick functions for start and end times choosing
                flatpickr("#datePicker", {
                  dateFormat: "m/d/Y",
                  onChange: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0 && !allDayCheckbox.checked) {
                    isoString = selectedDates[0].toISOString().split("T")[0]; // "YYYY-MM-DD"
                    console.log("ISO Date:", isoString);
                    }
                }
                });
                let endPicker;
                flatpickr("#startTime", {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "h:i K",
                    time_24hr: false,
                    onChange: function(selectedDates) {
                        if (selectedDates.length > 0 && !allDayCheckbox.checked) {
                        const startTime = new Date(selectedDates[0].getTime());
                        const startTimeStr = startTime.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        });
                        startStr = startTimeStr;
                        start = `${isoString}T${startTimeStr}:00`;
                        // Add 30 minutes
                        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

                        // Update the end time picker
                        endPicker.setDate(endTime, true);
                        }
                    }
                });

                endPicker = flatpickr("#endTime", {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "h:i K",
                    time_24hr: false,
                    onChange: function(selectedDates) {
                        if (selectedDates.length > 0 && !allDayCheckbox.checked) {
                        const endtime = new Date(selectedDates[0].getTime());
                        const endTimeStr = endtime.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        });
                        end = `${isoString}T${endTimeStr}:00`;
                        console.log(`This is endtime ${endTimeStr}`);
                        endStr = endTimeStr;
                        }
                        
                    }
                });

                const closeButton_2 = newItem_2.querySelector(".x-mark");
                setupCloseButton(closeButton_2, newItem_2);
                const datePicker = newItem_2.querySelector("#datePicker");
                const save_task = newItem_2.querySelector(".save-task")                
    
                save_task.addEventListener("click", () => {
                    lastSelectedDate = isoString;
                    newItem_2.remove();
    
                });
    
            });
            // Creates the pop up for description
            let lastInput = "";
            const newItem_3 = document.createElement("div");
            newItem_3.classList.add("popup");
            const description = newItem.querySelector(".description");
    
            description.addEventListener("click", () => {
                newItem_3.innerHTML = `
                <p>Type your description for your task below</p>
                <textarea id="task-Description" placeholder="Type here!"></textarea>
                <button class="save-task">Save</button>
            `;
                document.body.appendChild(newItem_3);
    
                const taskDescription = newItem_3.querySelector("#task-Description");
                const save_task = newItem_3.querySelector(".save-task")
    
                // Saves last input text
                if (lastInput) {
                    taskDescription.value = lastInput;
                }
    
                taskDescription.addEventListener("change", () => {
                    lastInput = taskDescription.value;
                });
    
                // Closes the pop up for the input text
                function outsideClick(e) {
                    if (!newItem_3.contains(e.target)) {
                        newItem_3.remove();
                        document.removeEventListener("mousedown", outsideClick);
                    }
                }
                document.addEventListener("mousedown", outsideClick);
    
                // If save button is pressed 
                save_task.addEventListener("click", () => {
                    taskDescription.value = lastInput;
                    newItem_3.remove();
                });
            });
    

            
            // Close button functionality
            setupCloseButton(closeButton, newItem);
    
            // Create task functionality
            createButton.addEventListener("click", () => {
                const taskName = taskInput.value.trim();
                if (taskName) {
                    TaskInfo();
                    fetch('https://miluz.onrender.com/tasks', {
                        method: 'POST',
                        headers: {
                            "Content-Type" : "application/json",
                        },
                        body: JSON.stringify ({
                            title: taskName,
                            description: lastInput,
                            user: userId,
                            dueDate: lastSelectedDate,
                            start: start,
                            startStr: startStr,
                            end: end,
                            endStr: endStr
                        }),
                    })
                    .then(response => response.json())
                    .then(newTask => {
                        createTaskItem(newTask.title, newTask.description, newTask._id, newTask.dueDate, newTask.startStr, newTask.endStr);
                        checkForTodayTasks();
                        calendar.addEvent(
                            newTask.start === ""
                                ? {
                                    title: newTask.title,
                                    start: newTask.dueDate,
                                    allDay: true
                                }
                                : {
                                    title: newTask.title,
                                    start: newTask.start,
                                    end: newTask.end
                                }
                            );
                            start = "";
                            end = "";
                        /*if(newTask.allDay == "false"){
                            calendar.addEvent({
                            id: newTask._id,
                            title: newTask.title,
                            start: newTask.dueDate,
                            end: 
                            }); 
                        }*/
                         
                    })
                        
                    .catch(err => console.error('Error adding task:', err));
                    
                    newItem.remove(); // Close popup
                    click = true;
                } else {
                    alert("Please enter a task name!");
                }
            });
        }

    }
});

// Function to create a task item on the page
function createTaskItem(taskName, lastInput, id, lastSelectedDate, start, end) {
    const taskList = document.querySelector(".work");
    const taskElement = document.createElement("div");
    const add_button = document.createElement("div");
    taskElement.classList.add("task-items");
    const dateObj = new Date(lastSelectedDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    
    const btnConatiner = document.querySelector(".button-container");

    // Store task ID and description for backend usage
    taskElement.dataset.id = id;
    taskElement.dataset.lastInput = lastInput

    if(lastSelectedDate && start != ""){  // if a due-date was saved
        taskElement.innerHTML =`
            <div class="task-check">
                <input type="checkbox" class = "checkBox">
                <p class = "ppp">${taskName}</p>
            </div>
            <div class="task-edit">
                <button class="icon-desc">
                <i class="fa-solid fa-book"></i>
                </button>
            </div>
            <div class="task-calendar">
               <p class="date">${formattedDate}</p>
               <p class ="times">${start} - ${end}</p>
            </div>
    `;
    lastSelectedDate = null;
    }
    else if(lastSelectedDate && start == ""){
        taskElement.innerHTML =`
            <div class="task-check">
                <input type="checkbox" class = "checkBox">
                <p class = "ppp">${taskName}</p>
            </div>
            <div class="task-edit">
                <button class="icon-desc">
                <i class="fa-solid fa-book"></i>
                </button>
            </div>
            <div class="task-calendar">
               <p class="date">${formattedDate}</p>
               <p class ="times">All-Day</p>
            </div>
    `;
    }
    else{ // if a due-date wasn't save
        taskElement.innerHTML =`
            <div class="task-check">
                <input type="checkbox" class = "checkBox">
                <p class = "ppp">${taskName}</p>
            </div>
            <div class="task-edit">
                <button class="icon-desc">
                <i class="fa-solid fa-book"></i>
                </button>
            </div>
            <div class="task-calendar">
                <button class="icon-calendar">
                <i class="fa-solid fa-calendar"></i>
                </button>
            </div>
        `;
    }
    // Add task button always spwans after each task created
    add_button.innerHTML = `
        <div class="button-container">
                <button class="add-button">Add Task</button>
                <i class="fa-solid fa-plus"></i>
            </div>
    `
    ;
    btnConatiner.remove();
    taskList.appendChild(taskElement);
    taskList.appendChild(add_button);

    document.body.addEventListener("click", (event) => {
        const iconDesc = event.target.closest(".icon-desc"); // Find the clicked icon-desc
        if (iconDesc) {
            const taskElement = iconDesc.closest(".task-items");
            let description = taskElement.dataset.lastInput || "";
    
            // Check if a popup already exists for this task
            const existingPopup = taskList.querySelector(".popup");
            if (existingPopup) {
                return; // If a popup already exists, do nothing
            }
    
            // Only create a new popup if there's a valid description and if click is true
            if (click == true) {
                click = false;
                // Create a new popup
                let text = document.createElement("div");
                text.classList.add("popup");
                // In case a descripiton hasn't been given
                if(description == ""){
                    description = "Not description yet!";
                }
                text.innerHTML = `
                    <button class="x-mark"><i class="fa-solid fa-x"></i></button>
                    <h2>Task Description</h2>
                    <div class="inner-box">
                        <p>${description}</p>
                    </div>
                    <button class="save-task">Edit</button>
                `;
                taskList.appendChild(text); // Append the popup to the task element
    
                const closeButton = text.querySelector(".x-mark");
                const editButton = text.querySelector(".save-task");
                const box = text.querySelector(".inner-box");
    
                // If user wants to edit the description
                editButton.addEventListener("click", () => {
                    const textArea = document.createElement("textarea"); // Create textarea to edit description
                    textArea.classList.add("textArea");
                    textArea.value = description;
                    textArea.placeholder = "Type here!";
    
                    // Replace the inner box with the textarea
                    box.replaceWith(textArea);
    
                    // Replace edit button with save button
                    const saveButton = document.createElement("button");
                    saveButton.textContent = "Save";
                    saveButton.classList.add("save-task");
                    editButton.replaceWith(saveButton);
    
                    textArea.addEventListener("input", () => {
                        description = textArea.value;
                    });
    
                    // When user clicks save, update description and replace textarea with <p> element
                    saveButton.addEventListener("click", () => {
                        taskElement.dataset.lastInput = description;
                        const updatedDescription = description

                        fetch(`https://miluz.onrender.com/tasks/${taskElement.dataset.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type' : 'application/json'
                            },
                            body: JSON.stringify({description: updatedDescription})
                        })
                        .then(response => {
                            if(!response.ok) {
                                return response.json().then(err => {
                                    throw new Error(err.error || "Failed to update task.");
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log(data.message);

                             // Restore the original edit button
                            saveButton.replaceWith(editButton);
    
                            // Close the popup
                            text.remove();
                        })
                       
                    });
                });
    
                // Set up close button to remove popup
                setupCloseButton(closeButton, text);
            }
            click = true;
        }
    });

    deleteTask(taskElement);
    if (countTask === 1) {
        const taskTitle = document.querySelector(".task-title");
        taskTitle.appendChild(deleteButton);
        setupDeleteButton(); // Ensure only one delete listener exists
    }
}

// Function to display Task info when first click
function TaskInfo(){
    if(firstClick){
        const taskList = document.querySelector(".work");
        const taskInfo = document.createElement("div");
        taskInfo.classList.add("task-info");
        taskInfo.innerHTML =`
            <p>Name</p>
            <p class = "desc-mid">Description</p>
            <p>Due Date</p>
        `;
        taskList.appendChild(taskInfo);
    }
    firstClick = false;
    
}

function setupCloseButton(closeButton, newItem){
    closeButton.addEventListener("click", () => {
                newItem.remove();
                click = true;
            });
}

// Delete Task item info 
const deleteButton = document.createElement("button");
deleteButton.classList.add("deleteButton");
deleteButton.innerHTML = `<i class="fa-solid fa-trash"></i>`;
let clickDelete = false;

function deleteTask(taskElement) {
    const checkbox = taskElement.querySelector(".checkBox");
    const nameTask = taskElement.querySelector(".ppp");

    // Attach listener to the checkbox ONCE
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            nameTask.classList.add("strikeText");
            countTask++;

            if (countTask === 1 && !document.body.contains(deleteButton)) {
                const taskTitle = document.querySelector(".task-title");
                taskTitle.appendChild(deleteButton);
                setupDeleteButton(); // Safe to call only once
            }
        } else {
            nameTask.classList.remove("strikeText");
            countTask--;

            if (countTask === 0 && document.body.contains(deleteButton)) {
                deleteButton.remove();
            }
        }
    });
}

let deleteListenerAdded = false;
// Function to close pop-ups
function setupDeleteButton() {
    if (deleteListenerAdded) return;

    deleteButton.addEventListener("click", () => {
        const allTasks = document.querySelectorAll(".task-items");

        allTasks.forEach(task => {
            const checkbox = task.querySelector(".checkBox");

            if (checkbox && checkbox.checked) {
                const id = task.dataset.id;

                if (!id) {
                    console.warn("Task has no ID and was likely already deleted.");
                    return;
                }
                fetch(`https://miluz.onrender.com/tasks/${id}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            console.error("Backend error:", err);
                        });
                    } 
                    task.remove();
                    checkForTodayTasks();
                    countTask--;
                    if (countTask === 0) {
                        deleteButton.remove();
                        deleteListenerAdded = false;
                    }
                })
                .catch(error => {
                    console.error("Network error while deleting task", error);
                });
            }
        });
    });

    deleteListenerAdded = true;
}

function notifications() {
    const notificationIcon = document.querySelector(".notBtn");

    notificationIcon.addEventListener("click", () => {
        // Toggle logic
        let existing = document.querySelector(".notification-container");
        if (existing) {
            existing.remove();
            document.removeEventListener("click", handleOutsideClick);
            return;
        }

        // Get today's date in MM/DD/YYYY format
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        const todayStr = new Date().toLocaleDateString('en-US', options); 

        // Find all task elements
        const taskElements = document.querySelectorAll(".task-items");
        const todayTasks = [];

        taskElements.forEach((task, index) => {
            const dateText = task.querySelector(".date")?.textContent || "";
            const taskName = task.querySelector(".ppp")?.textContent || "Unnamed task";

            if (dateText.includes(todayStr)) {
                todayTasks.push(taskName);
            } 
        });

        // Create the notification box
        const notContainer = document.createElement("div");
        notContainer.className = "notification-container";

        if (todayTasks.length > 0) {
            notContainer.innerHTML = `
                <h3>🗓️ Tasks for <span>${todayStr}</span></h3>
                <div class="notification-tasks">
                    ${todayTasks.map(task => `
                        <div class="task-card">
                            <i class="fa-solid fa-bolt"></i>
                            <span class="task-text">${task}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            notContainer.innerHTML = `
                <h3>🗓️ Tasks for <span>${todayStr}</span></h3>
                <p class="empty-message">🎉 No tasks due today. Enjoy your time!</p>
            `;
}

        document.body.appendChild(notContainer);

        setTimeout(() => {
            document.addEventListener("click", handleOutsideClick);
        }, 0); // Delay to avoid immediately closing from the icon click

        function handleOutsideClick(e) {
            const isInside = notContainer.contains(e.target) || notificationIcon.contains(e.target);
            if (!isInside) {
                notContainer.remove();
                document.removeEventListener("click", handleOutsideClick);
            }
        }
    });
}

function checkForTodayTasks() {
    const taskElements = document.querySelectorAll(".task-items");
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const todayStr = new Date().toLocaleDateString('en-US', options);
    const bellDot = document.querySelector(".notif-dot");

    let hasTodayTask = false;

    taskElements.forEach(task => {
        const dateText = task.querySelector(".date")?.textContent || "";
        if (dateText.includes(todayStr)) {
            hasTodayTask = true;
        }
    });

    bellDot.style.display = hasTodayTask ? "block" : "none";
}

// Run it after tasks are rendered
notifications();

function searchBar() {
  const searchBar = document.querySelector(".input-field");
  const resultBanner = document.querySelector(".search-result-banner");

  searchBar.addEventListener("input", () => {
    const searchInput = searchBar.value.trim().toLowerCase();
    const taskElements = document.querySelectorAll(".task-items");

    let matchCount = 0;

    taskElements.forEach(task => {
      const taskP = task.querySelector(".ppp");
      const originalText = taskP.dataset.original || taskP.textContent;

      // Save original text only once
      if (!taskP.dataset.original) {
        taskP.dataset.original = originalText;
      }

      if (searchInput && originalText.toLowerCase().includes(searchInput)) {
        const regex = new RegExp(`(${searchInput})`, 'gi');
        const highlighted = originalText.replace(regex, '<mark>$1</mark>');
        taskP.innerHTML = highlighted;
        matchCount++;
      } else {
        taskP.innerHTML = originalText;
      }
    });

    // Only show results banner if user typed something
    if (searchInput) {
      resultBanner.classList.add("show");
      resultBanner.textContent = matchCount === 0
        ? "No results found ❌"
        : `${matchCount} result${matchCount > 1 ? "s" : ""} found 🔍`;
    } else {
      resultBanner.classList.remove("show");
      resultBanner.textContent = "";
    }
  });
}

searchBar();

// Function to display tasks already in the back end
function fetchTasks(){
    const btnConatiner = document.querySelector(".button-container");
    fetch(`https://miluz.onrender.com/tasks?user=${userId}`)
     .then(response => response.json())
     .then(data => {
        if(data.length > 0) {
            TaskInfo();
            data.forEach(task => {
                createTaskItem(task.title, task.description, task._id, task.dueDate, task.startStr, task.endStr);
                checkForTodayTasks();
            });
        } else{
            return;
        }
     })
}