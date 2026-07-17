const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get('error') == 'not-available') {
    document.querySelector('#error-title').innerText = 'Flash File Not Available';
    document.querySelector('#error-inner-text').innerText = 'is not available from';
}