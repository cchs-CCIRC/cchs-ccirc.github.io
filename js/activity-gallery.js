(() => {
  const dialog = document.getElementById('galleryLightbox');
  if (!dialog) return;
  const photos = [...document.querySelectorAll('[data-gallery-index]')];
  const image = document.getElementById('lightboxImage');
  const caption = document.getElementById('lightboxCaption');
  const count = document.getElementById('lightboxCount');
  const close = dialog.querySelector('.lightbox-close');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  const items = photos.map((button) => {
    const img = button.querySelector('img');
    const title = button.querySelector('.photo-overlay strong');
    return { src: img.getAttribute('src'), alt: img.alt, title: title ? title.textContent : img.alt };
  });
  let active = 0;
  let lastTrigger = null;
  function show(index) {
    active = (index + items.length) % items.length;
    const item = items[active];
    image.src = item.src; image.alt = item.alt; caption.textContent = item.title;
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  }
  photos.forEach((button) => button.addEventListener('click', () => {
    lastTrigger = button; show(Number(button.dataset.galleryIndex));
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }));
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(active + 1); }
  });
})();
