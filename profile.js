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

		document.getElementById('profile-info').innerText = `Welcome, ${user.login} !`;

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
