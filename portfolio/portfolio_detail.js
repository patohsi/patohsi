function toggleNav() {
    document.getElementById('main-nav').classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const titleEl = document.querySelector('.detail-title');
    const descEl = document.querySelector('.detail-desc');
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

function bindZoomableImage() {
    const image = document.querySelector('.detail-img');
    if (!image) {
        return;
    }

    image.addEventListener('click', () => openLightbox(image.src, image.alt));
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



/* ===================================================================
   이미지가 여러 장인 작품: 큰 이미지 + 썸네일 줄 (방식 A)
   - ‹ › 버튼, 키보드 ← →, 썸네일 클릭으로 넘기기
   - 큰 이미지를 누르면 전체 화면으로 확대
   =================================================================== */
function buildGalleryViewer() {
    const grid = document.querySelector('.detail-image-grid');
    if (!grid) {
        return;
    }

    const originals = Array.from(grid.querySelectorAll('.detail-grid-img'));
    if (originals.length < 2) {
        return;
    }

    // 불러오지 못한 이미지는 빼고, 모두 불러온 뒤에 만든다
    const loaded = originals.map(img => new Promise(resolve => {
        if (img.complete) {
            resolve(img.naturalWidth > 0 ? img : null);
            return;
        }
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', () => resolve(null));
    }));

    Promise.all(loaded).then(list => {
        const images = list.filter(Boolean);
        if (images.length < 2) {
            return;
        }

        const viewer = document.createElement('div');
        viewer.className = 'gallery-viewer';
        viewer.innerHTML = `
            <div class="gv-stage">
                <img class="gv-main" alt="">
                <button type="button" class="gv-nav prev" aria-label="이전 이미지">&#8249;</button>
                <button type="button" class="gv-nav next" aria-label="다음 이미지">&#8250;</button>
                <span class="gv-count"></span>
            </div>
            <div class="gv-thumbs"></div>
        `;

        const main = viewer.querySelector('.gv-main');
        const count = viewer.querySelector('.gv-count');
        const thumbs = viewer.querySelector('.gv-thumbs');
        let index = 0;

        images.forEach((img, i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gv-thumb';
            button.setAttribute('aria-label', (i + 1) + '번째 이미지');
            const thumb = document.createElement('img');
            thumb.src = img.src;
            thumb.alt = '';
            button.appendChild(thumb);
            button.addEventListener('click', () => show(i));
            thumbs.appendChild(button);
        });

        function show(next) {
            index = (next + images.length) % images.length;
            main.src = images[index].src;
            main.alt = images[index].alt;
            count.textContent = (index + 1) + ' / ' + images.length;
            Array.from(thumbs.children).forEach((button, i) => button.classList.toggle('active', i === index));
            const active = thumbs.children[index];
            if (active && active.scrollIntoView) {
                thumbs.scrollTo({ left: active.offsetLeft - thumbs.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' });
            }
        }

        viewer.querySelector('.gv-nav.prev').addEventListener('click', () => show(index - 1));
        viewer.querySelector('.gv-nav.next').addEventListener('click', () => show(index + 1));
        main.addEventListener('click', () => openLightbox(main.src, main.alt));

        document.addEventListener('keydown', (event) => {
            if (document.body.classList.contains('lightbox-open')) {
                return;
            }
            if (event.key === 'ArrowLeft') show(index - 1);
            if (event.key === 'ArrowRight') show(index + 1);
        });

        grid.classList.add('has-viewer');
        grid.parentNode.insertBefore(viewer, grid);
        show(0);
    });
}


/* ===================================================================
   작품 상세: 태그 칩 + 이전/다음 작품 카드
   - art.html 의 카드 목록을 읽어서 같은 분류(그림/3D/부스) 안에서 이웃 작품을 찾는다
   - art.html 을 읽을 수 없으면(예: 파일로 직접 열기) 조용히 건너뛴다
   =================================================================== */
const DETAIL_CATEGORY_LABELS = { art: '일러스트', '3d': '3D', booth: '굿즈' };

async function buildDetailExtras() {
    const textBox = document.querySelector('.detail-text-box');
    if (!textBox) {
        return;
    }

    const parts = location.pathname.split('/');
    const here = parts.slice(-2).join('/');   // 예: 2026/work_01.html
    const year = parts[parts.length - 2];

    let cards = [];
    try {
        const response = await fetch('../art.html');
        if (!response.ok) {
            return;
        }
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        cards = Array.from(doc.querySelectorAll('.gallery-card'));
    } catch (error) {
        return;
    }

    const current = cards.find(card => card.getAttribute('href') === here);
    if (!current) {
        return;
    }

    // 1) 태그 칩 (분류 + 연도)
    const title = textBox.querySelector('.detail-title');
    if (title && !textBox.querySelector('.detail-tags')) {
        const tags = document.createElement('div');
        tags.className = 'detail-tags';
        const category = (current.dataset.category || '').toLowerCase();
        [DETAIL_CATEGORY_LABELS[category], /^\d{4}$/.test(year) ? year : ''].filter(Boolean).forEach(text => {
            const chip = document.createElement('span');
            chip.className = 'detail-tag';
            chip.textContent = text;
            tags.appendChild(chip);
        });
        textBox.insertBefore(tags, title);
    }

    // 2) 이전/다음 작품 (같은 분류 안에서)
    const same = cards.filter(card => card.dataset.category === current.dataset.category);
    const index = same.indexOf(current);
    const prev = same[index - 1];
    const next = same[index + 1];
    if (!prev && !next) {
        return;
    }

    const nav = document.createElement('div');
    nav.className = 'detail-nav';

    function makeCard(card, label) {
        const link = document.createElement('a');
        link.className = 'detail-nav-card';
        link.href = '../' + card.getAttribute('href');
        const img = card.querySelector('.card-img-box img');
        if (img && img.getAttribute('src')) {
            const thumb = document.createElement('img');
            thumb.src = '../' + img.getAttribute('src');
            thumb.alt = '';
            link.appendChild(thumb);
        }
        const small = document.createElement('small');
        small.textContent = label;
        const name = document.createElement('b');
        name.textContent = card.dataset.title || '';
        link.appendChild(small);
        link.appendChild(name);
        return link;
    }

    nav.appendChild(prev ? makeCard(prev, 'PREV') : document.createElement('span'));
    nav.appendChild(next ? makeCard(next, 'NEXT') : document.createElement('span'));
    textBox.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', () => {
    bindZoomableImage();
    buildGalleryViewer();
    buildDetailExtras();
});
