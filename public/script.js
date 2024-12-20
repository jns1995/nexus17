// para sa infonav //
document.getElementById('phoneIcon').addEventListener('click', function(event) { 
    event.preventDefault(); // Prevent the default link behavior
    const infoNav = document.querySelector('.info-nav');

    // Get the position of the icon
    const rect = this.getBoundingClientRect();
    const distanceBelow = 5; // Distance below the icon

    // Toggle display of infoNav
    if (infoNav.style.display === 'none' || infoNav.style.display === '') {
        infoNav.style.display = 'flex'; // Show the info-nav
        this.classList.add('phone-icon-active'); // Add active class

        // Set the position of infoNav
        infoNav.style.right = '8px'; // Align to the right edge of the viewport
        infoNav.style.top = `${rect.bottom + distanceBelow}px`; // Position 5px below the icon
    } else {
        infoNav.style.display = 'none'; // Hide the info-nav
        this.classList.remove('phone-icon-active'); // Remove active class
    }
});

// Optional: Close the info-nav when clicking outside
document.addEventListener('click', (event) => {
    const infoNav = document.querySelector('.info-nav');
    if (!event.target.closest('#phoneIcon') && !infoNav.contains(event.target)) {
        infoNav.style.display = 'none'; // Hide the info-nav
        document.getElementById('phoneIcon').classList.remove('phone-icon-active'); // Remove active class
    }
});




// para sa notif nav
document.getElementById('notifIcon').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    const notifNav = document.querySelector('.notif-nav');
    const rect = this.getBoundingClientRect();
    const distanceBelow = 5;

    if (notifNav.style.display === 'none' || notifNav.style.display === '') {
        notifNav.style.display = 'flex'; // Show the notif-nav
        notifNav.style.right = '8px'; // Align to the right edge
        notifNav.style.top = `${rect.bottom + distanceBelow}px`; // Position below the icon
        this.classList.add('notif-icon-active'); // Add active class
    } else {
        notifNav.style.display = 'none'; // Hide the notif-nav
        this.classList.remove('notif-icon-active'); // Remove active class
    }
});

// Optional: Close the info-nav when clicking outside
document.addEventListener('click', (event) => {
    const notifNav = document.querySelector('.notif-nav');
    if (!event.target.closest('#notifIcon') && !notifNav.contains(event.target)) {
        notifNav.style.display = 'none'; // Hide the info-nav
        document.getElementById('notifIcon').classList.remove('notif-icon-active'); // Remove active class
    }
});



// para sa notif nav
document.getElementById('userIcon').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    const userOption = document.querySelector('.userOption');
    const rect = this.getBoundingClientRect();
    const distanceBelow = 9;

    if (userOption.style.display === 'none' || userOption.style.display === '') {
        userOption.style.display = 'flex'; // Show the notif-nav
        userOption.style.right = '8px'; // Align to the right edge
        userOption.style.top = `${rect.bottom + distanceBelow}px`; // Position below the icon
        this.classList.add('user-icon-active'); // Add active class
    } else {
        userOption.style.display = 'none'; // Hide the notif-nav
        this.classList.remove('user-icon-active'); // Remove active class
    }
});

// Optional: Close the info-nav when clicking outside
document.addEventListener('click', (event) => {
    const userOption= document.querySelector('.userOption');
    if (!event.target.closest('#userIcon') && !userOption.contains(event.target)) {
        userOption.style.display = 'none'; // Hide the info-nav
        document.getElementById('userIcon').classList.remove('user-icon-active'); // Remove active class
    }
});


// MAKE NEW ANNOUCEMENT //
const notificationDiv = document.querySelector('.sub.bottom');

document.getElementById('newAnnIcon').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior

    if (notificationDiv.style.display === 'none' || notificationDiv.style.display === '') {
        notificationDiv.style.display = 'flex'; // Show the div
        this.classList.add('user-icon-active'); // Add active class
    } else {
        notificationDiv.style.display = 'none'; // Hide the div
        this.classList.remove('user-icon-active'); // Remove active class
    }
});

// Close the div when clicking the close icon
document.getElementById('xIcon').addEventListener('click', function(event) {
    notificationDiv.style.display = 'none'; // Hide the div
    document.getElementById('newAnnIcon').classList.remove('user-icon-active'); // Remove active class
});

// Optional: Close the div when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('#newAnnIcon') && !notificationDiv.contains(event.target)) {
        notificationDiv.style.display = 'none'; // Hide the div
        document.getElementById('newAnnIcon').classList.remove('user-icon-active'); // Remove active class
    }
});


//**********new employeeeee */
const createDiv = document.querySelector('.createDiv');

    document.getElementById('newEmpIcon').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior

        if (createDiv.style.display === 'none' || createDiv.style.display === '') {
            createDiv.style.display = 'block'; // Show the div
            this.classList.add('user-icon-active'); // Add active class
        } else {
            createDiv.style.display = 'none'; // Hide the div
            this.classList.remove('user-icon-active'); // Remove active class
        }
    });

    // Close the div when clicking the close icon
    document.getElementById('formClose').addEventListener('click', function(event) {
        createDiv.style.display = 'none'; // Hide the div
        document.getElementById('newEmpIcon').classList.remove('user-icon-active'); // Remove active class
    });

    // Optional: Close the div when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#newEmpIcon') && !createDiv.contains(event.target)) {
            createDiv.style.display = 'none'; // Hide the div
            document.getElementById('newEmpIcon').classList.remove('user-icon-active'); // Remove active class
        }
    });
