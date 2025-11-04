// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Wait for the page to load then wire up the button.
// When the user clicks the button we fetch the JSON at `apodData`,
// pick image items, and replace the placeholder inside #gallery with
// simple image cards. This keeps the code beginner-friendly and uses
// const/let and template literals as requested.
	document.addEventListener('DOMContentLoaded', () => {
		const btn = document.getElementById('getImageBtn');
		const gallery = document.getElementById('gallery');

		// Modal elements (present in index.html)
		const modal = document.getElementById('modal');
		const modalImg = document.getElementById('modal-img');
		const modalTitle = document.getElementById('modal-title');
		const modalDate = document.getElementById('modal-date');
		const modalExplanation = document.getElementById('modal-explanation');
		const modalClose = modal ? modal.querySelector('.modal-close') : null;

		if (!btn || !gallery) return; // nothing to do if DOM structure changed

		btn.addEventListener('click', async () => {
			// Provide quick UI feedback: show spinner inside the button
			btn.disabled = true;
			const originalText = btn.textContent;
			btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

			// Show a loading message in the gallery area and ensure it stays
			// visible for at least 3 seconds even if the fetch completes faster.
			const minShowMs = 3000;
			const start = Date.now();
			gallery.innerHTML = '<div class="placeholder"><p>🔄 Loading space photos…</p></div>';

			try {
				const res = await fetch(apodData);
				if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
				const data = await res.json();

				// Wait the remaining time so the loading message is visible for
				// at least `minShowMs` milliseconds.
				const elapsed = Date.now() - start;
				if (elapsed < minShowMs) await new Promise(r => setTimeout(r, minShowMs - elapsed));

				// data is expected to be an array of APOD-like objects. We will
				// filter for items that look like images (media_type === 'image' or
				// a url that ends with a common image extension).
				const images = Array.isArray(data)
					? data.filter(item => item && (item.media_type === 'image' || /\.(jpg|jpeg|png|gif)$/i.test(item.url || '')))
					: [];

				// Limit to 12 items
				const limited = images.slice(0, 12);

				// Clear placeholder and show results
				gallery.innerHTML = '';

				if (limited.length === 0) {
					gallery.innerHTML = '<div class="placeholder"><p>No images found in the feed.</p></div>';
					return;
				}

				// Create a simple card for each image (image on top, title, date)
				limited.forEach(item => {
					const card = document.createElement('article');
					card.className = 'apod-card';

					// Use safe fallbacks for missing fields
					const imgSrc = item.url || '';
					const title = item.title || 'Untitled';
					const date = item.date || '';

					card.innerHTML = `
						<div class="img-wrap">
							<img src="${imgSrc}" alt="${title}" />
						</div>
						<div class="card-body">
							<h3>${title}</h3>
							<p class="date">${date}</p>
						</div>
					`;

					// Store extra fields on the card for easy access when opening modal
					card.dataset.url = imgSrc;
					card.dataset.title = title;
					card.dataset.date = date;
					card.dataset.explanation = item.explanation || '';

					gallery.appendChild(card);
				});

				// Delegate click events from gallery to open modal when a card is clicked
				gallery.addEventListener('click', (ev) => {
					const card = ev.target.closest('.apod-card');
					if (!card) return;
					openModal({
						url: card.dataset.url,
						title: card.dataset.title,
						date: card.dataset.date,
						explanation: card.dataset.explanation,
					});
				});
			} catch (err) {
				// Ensure the loading message is visible for at least the minimum
				const elapsedErr = Date.now() - start;
				if (elapsedErr < minShowMs) await new Promise(r => setTimeout(r, minShowMs - elapsedErr));
				// Friendly error message for students
				gallery.innerHTML = `<div class="placeholder"><p>Error fetching images: ${err.message}</p></div>`;
			} finally {
				btn.disabled = false;
				btn.textContent = originalText;
			}
		});

		// ------------------ Modal helpers ------------------

		function openModal({url, title, date, explanation}){
			if (!modal) return;
			modalImg.src = url || '';
			modalImg.alt = title || '';
			modalTitle.textContent = title || '';
			modalDate.textContent = date || '';
			modalExplanation.textContent = explanation || '';
			modal.classList.add('show');
			modal.setAttribute('aria-hidden', 'false');
			document.body.style.overflow = 'hidden';
		}

		function closeModal(){
			if (!modal) return;
			modal.classList.remove('show');
			modal.setAttribute('aria-hidden', 'true');
			// remove image src to free memory
			modalImg.src = '';
			document.body.style.overflow = '';
		}

		// Close button
		if (modalClose) modalClose.addEventListener('click', closeModal);

		// Close when clicking on the overlay (but not when clicking inside modal-inner)
		if (modal) modal.addEventListener('click', (e) => {
			if (e.target === modal) closeModal();
		});

		// Close on Escape
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') closeModal();
		});

	});