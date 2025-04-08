const GRAPHQL_URL = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';

async function fetchProfile() {
	const token = localStorage.getItem('jwt');
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
			transactions {
				userId
				eventId
				amount
				createdAt
				type
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
		const { data, errors } = responseData;
		if (errors && errors.length > 0) throw new Error(errors[0].message);

		const user = data.user[0];
		const totalXP = user.xps.reduce((sum, xp) => sum + xp.amount, 0);

		document.getElementById('profile-info').innerText = `Welcome, ${user.login} !`;
		document.getElementById('xp').innerText = `XP: ${totalXP}`;
		document.getElementById('auditRatio').innerText = `Audits Ratio: ${user.auditRatio}`;

		const xpByProject = {};
		user.xps.forEach(xp => {
			const projectName = xp.path.split('/').pop();
			if (projectName === 'piscine-go' || projectName === 'piscine-js') {
				return;
			}
			if (!xpByProject[projectName]) xpByProject[projectName] = 0;
			xpByProject[projectName] += xp.amount;
		});

		const xpData = Object.entries(xpByProject).map(([project, xp]) => ({ project, xp }));

		const xpTransactions = user.transactions
			.filter(t => t.type === 'xp')
			.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

		let total = 0;
		const xpCumulative = xpTransactions.map(t => {
			total += t.amount;
			return {
				date: new Date(t.createdAt),
				xp: total
			};
		});

		const sampled = xpCumulative.filter((_, i) => i % 20 === 0);

		const smoothed = smoothData(sampled);

		drawBarChart(xpData);
		drawXPOverTime(smoothed);

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
		const barWidth = Math.min((d.xp / maxXP) * (width - 100) * 0.5, 1000);

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

function drawXPOverTime(data) {
	const svg = document.getElementById('xp-line-chart');
	svg.innerHTML = '';

	if (data.length === 0) {
		console.error('No data available for XP Over Time chart.');
		return;
	}

	const width = 800;
	const height = 400;
	const padding = 60;

	svg.setAttribute('width', width);
	svg.setAttribute('height', height);

	const maxXP = Math.max(...data.map(d => d.xp));
	const minDate = data[0].date;
	const maxDate = data[data.length - 1].date;

	const xScale = d => ((d - minDate) / (maxDate - minDate)) * (width - 2 * padding) + padding;
	const yScale = xp => height - padding - (xp / maxXP) * (height - 2 * padding);

	for (let i = 0; i < data.length - 1; i++) {
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', xScale(data[i].date));
		line.setAttribute('y1', yScale(data[i].xp));
		line.setAttribute('x2', xScale(data[i + 1].date));
		line.setAttribute('y2', yScale(data[i + 1].xp));
		line.setAttribute('stroke', 'blue');
		line.setAttribute('stroke-width', 2);
		svg.appendChild(line);
	}

	data.forEach(d => {
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', xScale(d.date));
		circle.setAttribute('cy', yScale(d.xp));
		circle.setAttribute('r', 4);
		circle.setAttribute('fill', 'red');
		svg.appendChild(circle);
	});

	const dateCount = 5;
	for (let i = 0; i <= dateCount; i++) {
		const ratio = i / dateCount;
		const date = new Date(minDate.getTime() + ratio * (maxDate - minDate));
		const x = xScale(date);

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', x);
		text.setAttribute('y', height - padding + 20);
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('font-size', '12px');
		text.textContent = date.toLocaleDateString('fr-FR');
		svg.appendChild(text);
	}
}

function smoothData(data, windowSize = 5) {
	return data.map((d, i, arr) => {
		const start = Math.max(0, i - Math.floor(windowSize / 2));
		const end = Math.min(arr.length, i + Math.ceil(windowSize / 2));
		const subset = arr.slice(start, end);
		const avgXP = subset.reduce((sum, d) => sum + d.xp, 0) / subset.length;
		return { date: d.date, xp: avgXP };
	});
}
