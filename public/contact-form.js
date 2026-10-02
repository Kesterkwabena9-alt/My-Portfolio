const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

if (form && status) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('name')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      subject: document.getElementById('subject')?.value.trim() || '',
      message: document.getElementById('message')?.value.trim() || ''
    };

    const missing = Object.values(payload).some((value) => !value);
    if (missing) {
      status.textContent = 'Please fill in all fields before sending your message.';
      status.classList.remove('success');
      status.classList.add('error');
      return;
    }

    status.textContent = 'Sending your message...';
    status.classList.remove('error');
    status.classList.add('success');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        if (response.status === 405) {
          throw new Error(
            'The contact form endpoint returned HTTP 405 (Method Not Allowed). Check that POST /api/contact is routed to the Express API.'
          );
        }

        throw new Error(
          `The contact form endpoint returned an unexpected response (HTTP ${response.status}).`
        );
      }

      if (!result || typeof result !== 'object') {
        throw new Error(
          `The contact form endpoint returned an empty or invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong while sending your message.');
      }

      form.reset();
      status.textContent = result.message;
      status.classList.remove('error');
      status.classList.add('success');
    } catch (error) {
      status.textContent = error.message || 'Something went wrong while sending your message.';
      status.classList.remove('success');
      status.classList.add('error');
    }
  });
}
