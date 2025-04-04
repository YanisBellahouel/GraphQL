const GRAPHQL_URL = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';

async function fetchProfile() {
	const token = localStorage.getItem('jwt');
	console.log('JWT from localStorage:', token);

	if (!token) {
		console.log('Not authenticated! Redirecting to login...');
		window.location.href = 'login.html';
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

		const totalXP = user.xps.reduce((sum, xp) => sum + xp.amount, 0);

		document.getElementById('profile-info').innerText = `Welcome, ${user.login} !`;
		document.getElementById('xp').innerText = `XP: ${totalXP}`;
		document.getElementById('auditRatio').innerText = `Audits Ratio: ${user.auditRatio}`;

		const xpByProject = {};
		user.xps.forEach(xp => {
			const projectName = xp.path.split('/').pop();
			if (!xpByProject[projectName]) {
				xpByProject[projectName] = 0;
			}
			xpByProject[projectName] += xp.amount;
		});

		const xpData = Object.entries(xpByProject).map(([project, xp]) => ({ project, xp }));
		console.log('XP par projet:', xpData);

		drawBarChart(xpData);
		const xpProgressData = processXPForChart(user.xps);
		console.log('Progression XP:', xpProgressData);
		drawLineChart(xpProgressData);

	} catch (error) {
		console.error('Error fetching profile:', error.message);
		localStorage.removeItem('jwt');
		window.location.href = 'login.html';
	}
}

window.onload = fetchProfile;

document.getElementById('logout-button').addEventListener('click', () => {
	localStorage.removeItem('jwt');
	window.location.href = 'login.html';
});

function drawBarChart(data) {
	const svg = document.getElementById('xp-bar-chart');
	svg.innerHTML = '';

	const baseWidth = 800;
	const barHeight = 30;
	const barSpacing = 10;
	const height = data.length * (barHeight + barSpacing) + 50;

	const maxXP = Math.max(...data.map(d => d.xp));
	const width = Math.max(baseWidth, maxXP * 2);

	svg.setAttribute('width', width);
	svg.setAttribute('height', height);

	data.forEach((d, i) => {
		const maxBarWidth = 1000;
		const scaleFactor = 0.5;
		const barWidth = Math.min((d.xp / maxXP) * (width - 100) * scaleFactor, maxBarWidth);


		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', 100);
		rect.setAttribute('y', i * (barHeight + barSpacing));
		rect.setAttribute('width', barWidth);
		rect.setAttribute('height', barHeight);
		rect.setAttribute('fill', 'blue');

		svg.appendChild(rect);

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', 95);
		text.setAttribute('y', i * (barHeight + barSpacing) + barHeight / 2);
		text.setAttribute('text-anchor', 'end');
		text.setAttribute('alignment-baseline', 'middle');
		text.setAttribute('font-size', '14px');
		text.textContent = d.project;

		svg.appendChild(text);

		const xpText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		xpText.setAttribute('x', 100 + barWidth + 5);
		xpText.setAttribute('y', i * (barHeight + barSpacing) + barHeight / 2);
		xpText.setAttribute('alignment-baseline', 'middle');
		xpText.setAttribute('font-size', '12px');
		xpText.textContent = d.xp;

		svg.appendChild(xpText);
	});
}
