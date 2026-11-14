const gallery = document.querySelector('#gallery');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
let imageItems = [];
let activeIndex = 0;
let lastFocusedElement;

async function loadGallery() {
  try {
    const groups = await loadImageGroups();
    let imageIndex = 0;

    groups.forEach((group, groupIndex) => {
      if (groupIndex > 0) addGalleryDivider();
      group.images.forEach((src) => {
        imageItems.push({ src });
        addGalleryItem(src, imageIndex);
        imageIndex += 1;
      });
    });
  } catch (error) {
    gallery.innerHTML = '<p class="gallery-error">No se han podido cargar las imágenes.</p>';
    console.error(error);
  }
}

async function loadImageGroups() {
  const source = getImageSource();
  const entries = await fetchDirectory(source);
  const groups = [];

  for (const entry of sortEntries(entries)) {
    if (entry.type === 'dir') {
      const folderEntries = await fetchDirectory(entry.url);
      const images = collectImages(folderEntries);
      if (images.length > 0) groups.push({ images });
    } else if (isImage(entry.name)) {
      groups.push({ images: [getImageUrl(entry)] });
    }
  }

  return groups;
}

async function fetchDirectory(source) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`No se pudo leer ${source}: ${response.status}`);

  if (source === 'images/' || source.startsWith('images/')) {
    return [...new DOMParser().parseFromString(await response.text(), 'text/html').querySelectorAll('a')]
      .map((link) => {
        const href = link.getAttribute('href') || '';
        const decodedHref = decodeURIComponent(href);
        const isDirectory = decodedHref.endsWith('/');
        const name = decodedHref.replace(/\/$/, '').split('/').pop() || '';
        return { type: isDirectory ? 'dir' : 'file', name, url: `${source}${href}` };
      });
  }

  return response.json();
}

function collectImages(entries) {
  return sortEntries(entries)
    .filter((entry) => entry.type === 'file' && isImage(entry.name))
    .map(getImageUrl);
}

function getImageUrl(entry) {
  return entry.download_url || entry.url;
}

function sortEntries(entries) {
  return [...entries].sort((first, second) => (first.name || '').localeCompare(second.name || '', undefined, {
    numeric: true,
    sensitivity: 'base'
  }));
}

function isImage(name) {
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(name);
}

function getImageSource() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'images/';
  }

  return 'https://api.github.com/repos/daniel-gdg/MueblesDeMiCasa/contents/images?ref=master';
}

function addGalleryItem(src, index) {
  const button = document.createElement('button');
  const image = document.createElement('img');
  button.className = 'gallery-item';
  button.type = 'button';
  button.setAttribute('aria-label', `Ampliar imagen ${index + 1}`);
  image.src = src;
  image.alt = `Mueble ${index + 1}`;
  image.loading = index < 8 ? 'eager' : 'lazy';
  button.append(image);
  button.addEventListener('click', () => openLightbox(index, button));
  gallery.append(button);
}

function addGalleryDivider() {
  const divider = document.createElement('div');
  divider.className = 'gallery-divider';
  divider.setAttribute('aria-hidden', 'true');
  gallery.append(divider);
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
  const item = imageItems[activeIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = `Mueble ${activeIndex + 1}`;
  lightboxCaption.textContent = `${activeIndex + 1} / ${imageItems.length}`;
}

function moveImage(step) {
  activeIndex = (activeIndex + step + imageItems.length) % imageItems.length;
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