function toggleNav() {
    const navBar = document.getElementById('main-nav');
    navBar.classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function ensureLightbox() {
    let lightbox = document.getElementById('image-lightbox');

    if (lightbox) {
        return lightbox;
    }

    lightbox = document.createElement('div');
    lightbox.id = 'image-lightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-backdrop" data-close-lightbox="true"></div>
        <div class="lightbox-content">
            <button type="button" class="lightbox-close" aria-label="닫기" data-close-lightbox="true">&times;</button>
            <img class="lightbox-image" alt="">
            <div class="lightbox-caption"></div>
        </div>
    `;

    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.closeLightbox === 'true') {
            closeLightbox();
        }
    });

    return lightbox;
}

function buildCaption(alt) {
    const esc = (t) => String(t || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const titleEl = document.querySelector('.post-main-title');
    const descEl = document.querySelector('.post-text p');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const desc = descEl ? descEl.textContent.replace(/\s+/g, ' ').trim() : '';
    let html = '';
    if (alt && alt !== title) html += '<span>' + esc(alt) + '</span>';
    if (title) html = '<b>' + esc(title) + '</b>' + html;
    if (desc) html += '<span>' + esc(desc) + '</span>';
    return html;
}

function openLightbox(src, alt) {
    const lightbox = ensureLightbox();
    const image = lightbox.querySelector('.lightbox-image');

    image.src = src;
    image.alt = alt || '';
    lightbox.querySelector('.lightbox-caption').innerHTML = buildCaption(alt);
    lightbox.classList.add('open');
    document.body.classList.add('lightbox-open');
}

function closeLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (!lightbox) {
        return;
    }

    lightbox.classList.remove('open');
    document.body.classList.remove('lightbox-open');
}

function bindZoomableImages() {
    const images = document.querySelectorAll('.post-image');
    images.forEach((image) => {
        image.addEventListener('click', () => openLightbox(image.src, image.alt));
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLightbox();
    }
});

document.addEventListener('click', function (event) {
    const navWrapper = document.querySelector('.bottom-nav-wrapper');
    const navBar = document.getElementById('main-nav');

    if (navWrapper && !navWrapper.contains(event.target) && navBar.classList.contains('active')) {
        navBar.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', bindZoomableImages);
