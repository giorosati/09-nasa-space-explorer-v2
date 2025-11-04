// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Wait for the page to load then wire up the button.
// When the user clicks the button we fetch the JSON at `apodData`,
// pick image items, and replace the placeholder inside #gallery with
// simple image cards. This keeps the code beginner-friendly and uses
// const/let and template literals as requested.
	document.addEventListener('DOMContentLoaded', () => {
		// Did You Know facts (20 items). Pick one at random on load.
		const facts = [
			"The footprints on the Moon will likely remain for millions of years because the Moon has no atmosphere to erode them.",
			"A day on Venus (one rotation) is longer than a year on Venus (one orbit around the Sun).",
			"Neutron stars are so dense that a teaspoon of their material would weigh about a billion tons on Earth.",
			"Jupiter's Great Red Spot is a giant storm larger than Earth that has been raging for at least 300 years.",
			"There are more stars in the observable universe than grains of sand on all the Earth's beaches combined.",
			"A spoonful of the Sun's core would be far hotter than any temperature achievable on Earth—millions of degrees Celsius.",
			"Mars has the largest volcano in the solar system, Olympus Mons, which is about three times the height of Mount Everest.",
			"Space is not completely empty; it contains tiny amounts of gas, dust, and cosmic rays.",
			"Saturn's rings are made mostly of ice and rock and are surprisingly thin—often only tens of meters thick.",
			"Black holes can 'ring' like a bell when they merge, emitting gravitational waves detectable on Earth.",
			"Our Milky Way galaxy will collide with the Andromeda galaxy in about 4 billion years, but stars are so far apart collisions are unlikely.",
			"A year on Neptune lasts about 165 Earth years because it's so far from the Sun.",
			"Auroras on Earth are caused by charged particles from the Sun interacting with our magnetic field and atmosphere.",
			"The Hubble Space Telescope has provided images that helped determine the age of the universe at about 13.8 billion years.",
			"Pluto, once a planet, is now classified as a dwarf planet; it has five known moons, the largest being Charon.",
			"The International Space Station travels at about 28,000 kilometers per hour and orbits Earth roughly every 90 minutes.",
			"Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
			"Some exoplanets are 'hot Jupiters' — gas giants orbiting extremely close to their stars, with scorching temperatures.",
			"Comets are icy leftovers from the early solar system and can grow spectacular tails when they near the Sun.",
			"Venus spins in the opposite direction to most planets, so on Venus the Sun rises in the west and sets in the east."
		];

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
			// Pick a new random fact for this click
			const randomFact = facts[Math.floor(Math.random() * facts.length)];
			// If a fact box is already visible (we have a grid showing), update it immediately
			const existingFact = gallery.querySelector('.fact-box');
			if (existingFact) {
				existingFact.querySelector('p').textContent = randomFact;
			}
			// Provide quick UI feedback: show spinner inside the button
			btn.disabled = true;
			const originalText = btn.textContent;
			btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

			// Show a loading message in the gallery area and ensure it stays
			// visible for at least 3 seconds even if the fetch completes faster.
			const minShowMs = 1500;
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

					// Clear placeholder and show a random fact above the images
					gallery.innerHTML = '';
					const factBox = document.createElement('section');
					factBox.className = 'fact-box';
					factBox.innerHTML = `
						<h2>Did you know?</h2>
						<p>${randomFact}</p>
					`;
					gallery.appendChild(factBox);

				if (limited.length === 0) {
					gallery.innerHTML = '<div class="placeholder"><p>No images found in the feed.</p></div>';
					return;
				}

				// Create a simple card for each image (image on top, title, date)
				limited.forEach(item => {
					const card = document.createElement('article');
					card.className = 'apod-card';

					// Use safe fallbacks for missing fields
					const title = item.title || 'Untitled';
					const date = item.date || '';
					const mediaType = item.media_type || '';
					let thumbSrc = '';

					if (mediaType === 'video') {
						// Try to use a provided thumbnail, otherwise derive from YouTube URL
						thumbSrc = item.thumbnail_url || '';
						if (!thumbSrc && item.url) {
							// Detect YouTube video id to build a thumbnail URL
							const ytMatch = item.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
							if (ytMatch && ytMatch[1]) {
								thumbSrc = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
							}
						}
					} else {
						thumbSrc = item.url || '';
					}

					card.innerHTML = `
						<div class="img-wrap">
							<img src="${thumbSrc}" alt="${title}" />
							${mediaType === 'video' ? '<div class="play-overlay">▶</div>' : ''}
						</div>
						<div class="card-body">
							<h3>${title}</h3>
							<p class="date">${date}</p>
						</div>
					`;

					// Store extra fields on the card for easy access when opening modal
					card.dataset.url = item.url || '';
					card.dataset.title = title;
					card.dataset.date = date;
					card.dataset.explanation = item.explanation || '';
					card.dataset.media = mediaType;

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

		function openModal({url, title, date, explanation, media}){
			if (!modal) return;
			// Remove any existing video iframe
			const existingIframe = modal.querySelector('iframe');
			if (existingIframe) existingIframe.remove();
			// Show image or video depending on media type
			if (media === 'video') {
				// Hide modalImg and create iframe if possible
				modalImg.style.display = 'none';
				// Try to convert YouTube or generic video URLs to an embeddable src
				let embedSrc = '';
				if (url) {
					const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
					if (ytMatch && ytMatch[1]) {
						embedSrc = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
					} else if (url.includes('youtube.com/embed')) {
						embedSrc = url;
					}
				}
				if (embedSrc) {
					const iframe = document.createElement('iframe');
					iframe.src = embedSrc;
					iframe.width = '100%';
					iframe.height = '480';
					iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
					iframe.setAttribute('allowfullscreen', '');
					modal.querySelector('.modal-content').insertBefore(iframe, modal.querySelector('.modal-meta'));
				} else {
					// Fallback: show thumbnail image and provide a link in meta
					modalImg.style.display = '';
					modalImg.src = '';
				}
			} else {
				// ensure modalImg is visible and set to image URL
				modalImg.style.display = '';
				modalImg.src = url || '';
				modalImg.alt = title || '';
			}

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
			// remove any iframe if present (stop playback)
			const iframe = modal.querySelector('iframe');
			if (iframe) iframe.remove();
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