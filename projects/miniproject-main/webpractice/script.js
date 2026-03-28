// 1. Navigation Logic
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.learning-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent jump to anchor
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Hide all sections
        sections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('fade-in');
        });
        
        // Show target section
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        targetSection.style.display = 'block';
        
        // Trigger reflow to restart animation
        void targetSection.offsetWidth; 
        targetSection.classList.add('fade-in');
    });
});

// 2. Interactive Playground Logic
const practiceForm = document.getElementById('practice-form');
const consoleOutput = document.getElementById('console-output');

// Utility to write to our mock terminal
function logToConsole(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const line = document.createElement('div');
    
    // Style differently based on input level
    if (type === 'error') {
        line.style.color = '#ff5f56';
    } else if (type === 'success') {
        line.style.color = '#fffb00';
    }

    line.innerHTML = `<span style="color:#888">[${timestamp}]</span> > ${message}`;
    consoleOutput.appendChild(line);
    
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// 3. Form Submission Event Listener
practiceForm.addEventListener('submit', (e) => {
    e.preventDefault(); // crucial to stop page reload

    // Grab values using DOM standard querying
    const nameInput = document.getElementById('dev-name').value;
    const skillInput = document.getElementById('dev-skill').value;

    logToConsole(`Execution triggered by <strong>${nameInput}</strong>.`);
    logToConsole(`Analyzing skill level: ${skillInput}...`);

    // Basic async demonstration mimicking a real-world processing delay
    setTimeout(() => {
        if (skillInput === 'Beginner') {
            logToConsole('You are just starting out! The HTML, CSS, & JS fundamentals here will build your foundation.', 'success');
        } else if (skillInput === 'Intermediate') {
            logToConsole('Solid progress. Focus on exploring Grid, Flexbox, and advanced component states.', 'success');
        } else {
            logToConsole('Advanced status recognized. Excellent work keeping your fundamentals sharp!', 'success');
        }
        
        // We log out an object representing the data gathered
        const devObject = {
            developer: nameInput,
            tier: skillInput,
            status: "active"
        };
        
        logToConsole(`Data Package: JSON.stringify(${JSON.stringify(devObject)})`, 'success');
        
    }, 800);
});

// On load greeting
window.addEventListener('load', () => {
    setTimeout(() => {
        logToConsole('DOM Fully Loaded.');
        logToConsole('Awaiting Interaction...');
    }, 500);
});
