const GRAPHQL_URL = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';

async function fetchProfile() {
    const token = localStorage.getItem('jwt');
    console.log('JWT from localStorage:', token);

    if (!token) {
        console.log('Not authenticated! Redirecting to login...');
        // window.location.href = 'login.html';
        return;
    }

    const query = `
    query {
        user {
            id
            login
            auditRatio
            xps {
                amount
                originEventId
                path
            }
            audits {
                id
                grade
                group {
                    id
                }
            }
        }
    }
    `;

    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        const responseData = await response.json();
        console.log('Response:', responseData);

        const { data, errors } = responseData;
        if (errors && errors.length > 0) throw new Error(errors[0].message);

        if (!data || !data.user || data.user.length === 0) {
            throw new Error('Invalid response structure');
        }

        const user = data.user[0];

        // Calculer le total des XP
        const totalXP = user.xps.reduce((sum, xp) => sum + xp.amount, 0);

        // Afficher les informations dans le HTML
        document.getElementById('profile-info').innerText = `Welcome, ${user.login} !`;
        document.getElementById('xp').innerText = `XP: ${totalXP}`;
        document.getElementById('auditRatio').innerText = `Audits Ratio: ${user.auditRatio}`;

        // Regrouper l'XP par projet
        const xpByProject = {};
        user.xps.forEach(xp => {
            const projectName = xp.path.split('/').pop();
            if (!xpByProject[projectName]) {
                xpByProject[projectName] = 0;
            }
            xpByProject[projectName] += xp.amount;
        });

        // Convertir en tableau exploitable
        const xpData = Object.entries(xpByProject).map(([project, xp]) => ({ project, xp }));
        console.log('XP par projet:', xpData);

        // Dessiner le graphique après avoir récupéré les données
        drawBarChart(xpData);
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        localStorage.removeItem('jwt');
        // window.location.href = 'login.html';
    }
}

window.onload = fetchProfile;

document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
});

function drawBarChart(data) {
    const svg = document.getElementById('xp-bar-chart');
    svg.innerHTML = ''; // Nettoyer le SVG

    const width = 600;
    const height = 300;
    const barPadding = 5;
    const barWidth = Math.max((width / data.length) - barPadding, 1); // Empêcher une largeur négative
    const maxXP = Math.max(...data.map(d => d.xp), 1); // Éviter une division par 0

    data.forEach((d, i) => {
        const barHeight = (d.xp / maxXP) * height;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', i * (width / data.length));
        rect.setAttribute('y', height - barHeight);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', 'blue');

        svg.appendChild(rect);

        // Ajouter les labels sous les barres
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', i * (width / data.length) + barWidth / 2);
        text.setAttribute('y', height - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10px');
        text.textContent = d.project;

        svg.appendChild(text);
    });
}
