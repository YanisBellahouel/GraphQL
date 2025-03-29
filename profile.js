const GRAPHQL_URL = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';

async function fetchProfile() {

	const token = localStorage.getItem('jwt');
	console.log('JWT from localStorage:', token);

	if (!token) {
		console.log('Not authenticated! Redirecting to login...');
		// window.location.href = 'login.html';
		// return;
	}

	const query = `
		query {
			user {
				id
				login
				xp
				grades {
					project
					grade
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

		const { data, errors } = await response.json();
		if (errors) throw new Error(errors[0].message);

		displayProfile(data.user);
	} catch (error) {
		console.log('Error fetching profile: ' + error.message);
		localStorage.removeItem('jwt');
		// window.location.href = 'login.html';
	}
}

function displayProfile(user) {
	document.getElementById('username').textContent = user.login;
	document.getElementById('xp').textContent = `XP: ${user.xp}`;

	const gradesList = document.getElementById('grades');
	user.grades.forEach(g => {
		const li = document.createElement('li');
		li.textContent = `${g.project}: ${g.grade}`;
		gradesList.appendChild(li);
	});
}

window.onload = fetchProfile;

function generateXPGraph(user) {
	const svg = document.getElementById('xpGraph');
	const width = svg.clientWidth;
	const height = svg.clientHeight;
	const padding = 20;

	const xpData = user.grades.map(g => g.grade);
	const labels = user.grades.map(g => g.project);
	const maxXP = Math.max(...xpData, 100);

	// Création du chemin SVG
	let path = `M${padding},${height - padding}`;
	xpData.forEach((xp, index) => {
		const x = (index + 1) * (width / xpData.length);
		const y = height - (xp / maxXP) * (height - 2 * padding);
		path += ` L${x},${y}`;
	});

	// Ajoute le chemin SVG pour la courbe
	svg.innerHTML = `<path d="${path}" stroke="blue" fill="none" stroke-width="2" />`;
}

function generatePieChart(user) {
	const svg = document.getElementById('gradePie');
	const width = svg.clientWidth;
	const height = svg.clientHeight;
	const radius = Math.min(width, height) / 2;
	const total = user.grades.length;
	let angle = 0;

	// Création des sections du camembert
	user.grades.forEach((g, i) => {
		const sliceAngle = (2 * Math.PI * (1 / total));
		const x1 = width / 2 + radius * Math.cos(angle);
		const y1 = height / 2 + radius * Math.sin(angle);
		angle += sliceAngle;
		const x2 = width / 2 + radius * Math.cos(angle);
		const y2 = height / 2 + radius * Math.sin(angle);

		const path = `
			M${width / 2},${height / 2}
			L${x1},${y1}
			A${radius},${radius} 0 0,1 ${x2},${y2}
			Z
		`;

		const color = `hsl(${i * (360 / total)}, 70%, 60%)`; // Couleur dynamique
		const slice = document.createElementNS("http://www.w3.org/2000/svg", "path");
		slice.setAttribute("d", path);
		slice.setAttribute("fill", color);
		svg.appendChild(slice);
	});
}

// Modifier la fonction displayProfile pour appeler les graphiques
function displayProfile(user) {
	document.getElementById('username').textContent = user.login;
	document.getElementById('xp').textContent = `XP: ${user.xp}`;

	const gradesList = document.getElementById('grades');
	user.grades.forEach(g => {
		const li = document.createElement('li');
		li.textContent = `${g.project}: ${g.grade}`;
		gradesList.appendChild(li);
	});

	generateXPGraph(user);
	generatePieChart(user);
}

