document.addEventListener('DOMContentLoaded', () => {
    const guideSections = document.querySelectorAll('.guide-section');
    const navButtons = document.querySelectorAll('.guide-navigation .btn');

    // Function to show a specific guide section
    window.showGuideSection = (sectionId) => {
        // Hide all sections
        guideSections.forEach(section => {
            section.classList.add('hidden');
        });

        // Deactivate all navigation buttons
        navButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show the selected section
        const selectedSection = document.getElementById(`guide-${sectionId}`);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
        }

        // Activate the corresponding navigation button
        const activeButton = document.querySelector(`.guide-navigation button[onclick="showGuideSection('${sectionId}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    };

    // Show the 'getting-started' section by default on page load
    showGuideSection('getting-started');
});
