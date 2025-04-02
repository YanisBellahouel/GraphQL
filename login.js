const AUTH_URL = 'https://zone01normandie.org/api/auth/signin';

document.getElementById('login-form').addEventListener('submit', async (event) => {
	event.preventDefault();

	const usernameOrEmail = document.getElementById('usernameOrEmail').value;
	const password = document.getElementById('password').value;

	const credentials = btoa(`${usernameOrEmail}:${password}`);

	try {
		const response = await fetch(AUTH_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${credentials}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Invalid credentials');
		}

		// Lire la réponse JSON
		const data = await response.json();
		console.log('Response data:', data);

		const token = data ? data : null;
		console.log('Token received:', token);

		if (token) {
			localStorage.setItem('jwt', token);
			console.log('JWT stored successfully!');
			window.location.href = 'profile.html';
		} else {
			throw new Error('No valid token received');
		}
	} catch (error) {
		console.error('Login failed:', error.message);
		alert('Login failed: ' + error.message);
	}
});
