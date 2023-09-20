<script>
let loginForm = document.querySelector('.login form');
loginForm.onsubmit = event => {
    event.preventDefault();
    
    const formData = new URLSearchParams();
    formData.append('username', loginForm.querySelector('#username').value);
    formData.append('password', loginForm.querySelector('#password').value);

    fetch(loginForm.action, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        .then(response => response.text())
        .then(result => {
            if (result.toLowerCase().includes('success')) {
                window.location.href = 'map';
            } else {
				document.querySelector('.msg').innerHTML = "<div class='alert alert-danger text-center'>" + result + "</div>";
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
};

		</script>