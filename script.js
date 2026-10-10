const gallery = document.querySelector('#gallery');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
let imageNames = [];
let activeIndex = 0;
let lastFocusedElement;

async function loadGallery() {
  try {
    const source = getImageSource();
    const response = await fetch(source);
    if (!response.ok) throw new Error(`No se pudo leer images/: ${response.status}`);

    const entries = source === 'images/'
      ? [...new DOMParser().parseFromString(await response.text(), 'text/html').querySelectorAll('a')]
          .map((link) => ({ type: 'file', name: decodeURIComponent(link.getAttribute('href') || '') }))
      : await response.json();
    imageNames = entries
      .filter((entry) => entry.type === 'file' && /\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort((first, second) => first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }));

    imageNames.forEach((name, index) => addGalleryItem(name, index));
  } catch (error) {
    gallery.innerHTML = '<p class="gallery-error">No se han podido cargar las imágenes.</p>';
    console.error(error);
  }
}

function getImageSource() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'images/';
  }

  return 'https://api.github.com/repos/daniel-gdg/MueblesDeMiCasa/contents/images?ref=master';
}

function addGalleryItem(name, index) {
  const button = document.createElement('button');
  const image = document.createElement('img');
  button.className = 'gallery-item';
  button.type = 'button';
  button.setAttribute('aria-label', `Ampliar imagen ${index + 1}`);
  image.src = `images/${name}`;
  image.alt = `Mueble ${index + 1}`;
  image.loading = index < 8 ? 'eager' : 'lazy';
  button.append(image);
  button.addEventListener('click', () => openLightbox(index, button));
  gallery.append(button);
}

loadGallery();

function openLightbox(index, sourceElement) {
  activeIndex = index;
  lastFocusedElement = sourceElement || document.activeElement;
  updateLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  lastFocusedElement?.focus();
}

function updateLightbox() {
  const name = imageNames[activeIndex];
  lightboxImage.src = `images/${name}`;
  lightboxImage.alt = `Mueble ${activeIndex + 1}`;
  lightboxCaption.textContent = `${activeIndex + 1} / ${imageNames.length}`;
}

function moveImage(step) {
  activeIndex = (activeIndex + step + imageNames.length) % imageNames.length;
  updateLightbox();
}

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', () => moveImage(-1));
document.querySelector('.lightbox-next').addEventListener('click', () => moveImage(1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') moveImage(-1);
  if (event.key === 'ArrowRight') moveImage(1);
});