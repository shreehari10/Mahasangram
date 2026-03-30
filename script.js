// Configuration
const CONFIG = {
    SHEET_ID: "1_jFRHiXdki9X6AihCc2ew9_qskSFnYXlNDpKnxsMIxA", // Replace with your Google Sheet ID
    API_BASE: 'https://opensheet.elk.sh',
    DEPARTMENTS: ['IT', 'MECH', 'CIVIL', 'A&R', 'COMP', 'AI&DS', 'MBA', 'ENTC', 'ECE', 'ELECT'],
    SPORTS: [
        { name: 'Cricket', icon: '🏏' },
        { name: 'Tug of War', icon: '🤝' },
        { name: 'Kho-Kho', icon: '🏃' },
        { name: 'Chess', icon: '♟️' },
        { name: 'Shotput', icon: '🏅' },
        { name: 'Volleyball', icon: '🏐' },
        { name: 'Kabbadi', icon: '🤸' },
        { name: 'Football', icon: '⚽' },
        { name: 'Badminton', icon: '🏸' },
        { name: 'Relay', icon: '🏃' }
    ]
};

// Utility Functions
function showLoading(element) {
    element.innerHTML = `
        <div class="data-loading">
            <div class="spinner"></div>
            <p>Loading data...</p>
        </div>
    `;
}

function showError(element, message) {
    element.innerHTML = `<div class="error-message">${message}</div>`;
}

async function fetchData(sheetName) {
    try {
        const url = `${CONFIG.API_BASE}/${CONFIG.SHEET_ID}/${sheetName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return null;
    }
}

// HOME PAGE - Leaderboard
async function initLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    showLoading(container);

    const data = await fetchData('Leaderboard');
    
    if (!data || data.length === 0) {
        showError(container, 'No leaderboard data available. Please check your Sheet ID.');
        return;
    }

    // Sort by score descending
    const sorted = [...data].sort((a, b) => {
        return (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0);
    });

    // Build table
    let html = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Department</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;

    sorted.forEach((row, index) => {
        const rank = index + 1;
        let highlightClass = '';
        let rankClass = '';

        if (rank === 1) {
            highlightClass = 'highlight-row-1';
            rankClass = 'rank-1';
        } else if (rank === 2) {
            highlightClass = 'highlight-row-2';
            rankClass = 'rank-2';
        } else if (rank === 3) {
            highlightClass = 'highlight-row-3';
            rankClass = 'rank-3';
        }

        let rankBadge;
          if (rank === 1) rankBadge = "🥇";
            else if (rank === 2) rankBadge = "🥈";
                else if (rank === 3) rankBadge = "🥉";
                  else rankBadge = rank;
        
        html += `
            <tr class="${highlightClass}">
                <td><strong>${rank}</strong></td>
                <td>${row.Department || 'N/A'}</td>
                <td><strong>${row.Score || 0}</strong></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// SPORTS PAGE - Buttons and Results
async function initSports() {
    const buttonsContainer = document.getElementById('sports-buttons-container');
    const resultsSection = document.getElementById('results-section');
    
    if (!buttonsContainer) return;

    // Create sport buttons
    let html = '';
    CONFIG.SPORTS.forEach(sport => {
        html += `
            <button class="sport-btn" data-sport="${sport.name}">
                <div class="sport-btn-icon">${sport.icon}</div>
                <div class="sport-btn-name">${sport.name}</div>
            </button>
        `;
    });
    buttonsContainer.innerHTML = html;

    // Fetch all sports data once
    const allSportsData = await fetchData('Sports');
    if (!allSportsData) {
        resultsSection.innerHTML = '<div class="error-message">Unable to load sports data. Please check your Sheet ID.</div>';
        return;
    }

    // Add click handlers to sport buttons
    document.querySelectorAll('.sport-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const sport = btn.dataset.sport;
            displaySportResults(sport, allSportsData);
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function displaySportResults(sportName, allData) {
    const resultsSection = document.getElementById('results-section');
    
    // Filter data for this sport
    const sportData = allData.filter(row => 
    row.Sport && row.Sport.trim().toLowerCase() === sportName.trim().toLowerCase()
);
    if (sportData.length === 0) {
        resultsSection.innerHTML = `
            <div class="error-message">
                No results available for ${sportName}
            </div>
        `;
        return;
    }

    // Separate boys and girls
    const boysData = sportData.filter(row => row.Category === 'Boys');
    const girlsData = sportData.filter(row => row.Category === 'Girls');

    let html = `<h2>🏅 ${sportName} Results</h2><div class="tables-container">`;

    // Boys table
    if (boysData.length > 0) {
        html += buildResultsTable('Boys', boysData);
    }

    // Girls table
    if (girlsData.length > 0) {
        html += buildResultsTable('Girls', girlsData);
    }

    // If no data for either gender
    if (boysData.length === 0 && girlsData.length === 0) {
        html += '<div class="error-message">No results available for this sport</div>';
    }

    html += '</div>';
    resultsSection.innerHTML = html;
}

function buildResultsTable(category, data) {
    // Sort by position
    const sorted = [...data].sort((a, b) => {
        const posA = parseInt(a.Position) || 999;
        const posB = parseInt(b.Position) || 999;
        return posA - posB;
    });

    const positions = ['1st', '2nd', '3rd'];
    let html = `
        <div class="result-table">
            <h3>${category}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Department</th>
                    </tr>
                </thead>
                <tbody>
    `;

    sorted.forEach(row => {
        const position = parseInt(row.Position) || 0;
        const positionText = position <= 3 ? positions[position - 1] : position + 'th';
        const posClass = position <= 3 ? `position-${position}` : 'position-other';
        
        html += `
            <tr>
                <td><span class="position-badge ${posClass}">${position}</span></td>
                <td>${row.Department || 'N/A'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    return html;
}

// Page initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

function initPage() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    
    if (filename.includes('sports')) {
        initSports();
    } else {
        initLeaderboard();
    }
}
