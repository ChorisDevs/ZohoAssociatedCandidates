// Initialize Zoho SDK and wait for the 'Load' event
ZSDK.Init().on('Load', function() {
    console.log("Zoho SDK Initialized");
    loadItems(); // Fetch candidates after SDK is initialized
    console.log("Second Initialized");
})

// Function to load items (candidates) from the Zoho API
function loadItems() {
    const config = {
        "Entity": "Candidates",
        "RecordID": "526649000000513036"
    };

    // ZOHO.RECRUIT.API.getAllRecords(config)
    //     .then(response => {
    //         console.log("Candidates fetched successfully:", response);
    //         // renderCandidates(response.data); // Call function to render candidates
    //     })
    //     .catch(error => {
    //         console.error("Error fetching candidates:", error);
    //     });
        ZOHO.RECRUIT.API.getRecord(config)
            .then(response => {
                console.log("Candidates fetched successfully:", response);
                // renderCandidates(response.data); // Call function to render candidates
            })
            .catch(error => {
                console.error("Error fetching candidates:", error);
            });
}

// Function to render the candidates (example)
// function renderCandidates(candidates) {
//     const candidateList = document.getElementById('associatedCandidates');
//     candidateList.innerHTML = ''; // Clear any existing candidates

//     if (candidates.length === 0) {
//         candidateList.innerHTML = '<p>No candidates available.</p>';
//         return;
//     }

//     candidates.forEach(candidate => {
//         const candidateItem = document.createElement('div');
//         candidateItem.classList.add('candidate-item');
//         candidateItem.innerHTML = `
//             <span class="candidate-name">${candidate.Full_Name}</span>
//             <br />
//             <span class="candidate-email">${candidate.Email || 'No Email Provided'}</span>
//         `;
//         candidateList.appendChild(candidateItem);
//     });
// }
