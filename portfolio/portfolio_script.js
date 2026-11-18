/* ===================================================================
   포트폴리오 갤러리 (art.html)
   - ?section=art | booth | 3d  로 구역을 나눈다 (기본: art)
   - 구역별로 연도/태그/보기 방식을 기억해서, 작품을 보고 돌아와도 보던 자리로 돌아온다
   =================================================================== */
const SECTIONS = {
    art:   { categories: ['art'],   kicker: 'ART',      title: 'ART',   desc: '일러스트 · 캐릭터 디자인 · 포스터', defaultTag: 'illust', tabs: true },
    booth: { categories: ['booth'], kicker: 'ART',      title: 'ART',   desc: '외부 행사 부스에서 선보인 작업', defaultTag: '', tabs: true },
    commission: { categories: ['commission'], kicker: 'COMMISSION', title: 'COMMISSION', desc: '커미션 · 리퀘스트로 그린 작업', defaultTag: 'free', tabs: false, forceTags: ['free', 'paid'] },
    '3d':  { categories: ['3d'],    kicker: '3D WORKS', title: '3D',    desc: '3D 작업을 모아서 보여줍니다', defaultTag: '3d', tabs: false },
};

const TAG_LABELS = {
    free: '무료', paid: '유료', illust: '일러스트', character: '캐릭터 디자인', poster: '포스터',
    unreal: 'UNREAL', unity: 'UNITY', '3d': '3D',
};

const sectionParam = new URLSearchParams(location.search).get('section');
const CURRENT_SECTION = SECTIONS[sectionParam] ? sectionParam : 'art';
const GALLERY_STATE_KEY = 'patohsi_gallery_state_' + CURRENT_SECTION;

let currentYear = null; // 저장된 상태가 없으면 가장 최근 연도로 자동 설정됨
let currentCategory = 'all'; // 태그 필터 값
let currentView = 'grid'; // 'masonry'(모아보기) | 'grid'(목록보기) — 기본값: 목록보기

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.gallery-card')) {
        setupSection();
        addYearCounts();
        buildLatestBento();
        buildTagFilter();
        restoreGalleryState();
        renderGallery();
        setupLightbox();
    }
});

function sectionItems() {
    const cats = SECTIONS[CURRENT_SECTION].categories;
    return Array.from(document.querySelectorAll('.gallery-card'))
        .filter(item => cats.includes((item.dataset.category || '').toLowerCase()));
}

function itemTags(item) {
    const raw = (item.dataset.tags || '').trim();
    if (raw) return raw.toLowerCase().split(/\s+/);
    const def = SECTIONS[CURRENT_SECTION].defaultTag;
    return def ? [def] : [];
}

// 구역 제목/설명/탭 + 이 구역에 작품이 있는 연도 버튼만 남긴다
function setupSection() {
    const meta = SECTIONS[CURRENT_SECTION];
    document.getElementById('sectionKicker').textContent = meta.kicker;
    document.getElementById('sectionTitle').textContent = meta.title;
    document.getElementById('sectionDesc').textContent = meta.desc;
    document.title = 'Patohsi - ' + meta.title;

    const tabs = document.getElementById('sectionTabs');
    tabs.hidden = !meta.tabs;
    tabs.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.section === CURRENT_SECTION));

    const years = new Set(sectionItems().map(item => item.dataset.year));
    document.querySelectorAll('.year-btn').forEach(btn => {
        btn.hidden = !years.has(btn.dataset.filter);
    });
}

// 작품의 태그(data-tags)에서 필터 버튼을 만든다. 태그가 2종류 미만이면 필터를 숨긴다.
function buildTagFilter() {
    const box = document.getElementById('tagFilter');
    const tags = new Set();
    (SECTIONS[CURRENT_SECTION].forceTags || []).forEach(t => tags.add(t));
    sectionItems().forEach(item => itemTags(item).forEach(t => tags.add(t)));
    if (tags.size < 2) {
        box.hidden = true;
        return;
    }
    const make = (value, label) => '<button class="cat-btn subtle-btn" data-filter="' + value + '" onclick="setFilter(\'' + value + '\', \'category\')">' + label + '</button>';
    box.innerHTML = make('all', 'ALL') + Array.from(tags).map(t => make(t, TAG_LABELS[t] || t.toUpperCase())).join('');
    box.hidden = false;
}

// 목록으로 돌아왔을 때(뒤로가기) 또는 새로고침해도 직전에 보던 연도/태그/뷰를 유지한다.
function restoreGalleryState() {
    let saved = null;
    try {
        saved = JSON.parse(sessionStorage.getItem(GALLERY_STATE_KEY));
    } catch (e) {
        saved = null;
    }

    const yearButtons = Array.from(document.querySelectorAll('.year-btn')).filter(b => !b.hidden);
    const availableYears = yearButtons.map(b => b.dataset.filter);

    if (saved && saved.year && availableYears.includes(saved.year)) {
        currentYear = saved.year;
        currentCategory = saved.category || 'all';
        currentView = saved.view || 'grid';
    } else {
        // 저장된 값이 없거나(첫 방문) 더 이상 존재하지 않는 연도라면 최신 연도를 기본값으로
        currentYear = getLatestYear(yearButtons);
        currentCategory = 'all';
        currentView = 'grid';
    }

    if (!document.querySelector('#tagFilter .cat-btn[data-filter="' + currentCategory + '"]')) {
        currentCategory = 'all';
    }

    updateActiveButtons('.year-btn', currentYear || '');
    updateActiveButtons('#tagFilter .cat-btn', currentCategory);

    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.classList.toggle('view-masonry', currentView === 'masonry');
    galleryGrid.classList.toggle('view-grid', currentView === 'grid');
    document.getElementById('viewMasonryBtn').classList.toggle('active', currentView === 'masonry');
    document.getElementById('viewGridBtn').classList.toggle('active', currentView === 'grid');
}

function getLatestYear(yearButtons) {
    let latestYear = null;
    yearButtons.forEach(button => {
        const year = button.dataset.filter;
        if (latestYear === null || year > latestYear) {
            latestYear = year;
        }
    });
    return latestYear;
}

function saveGalleryState() {
    try {
        sessionStorage.setItem(GALLERY_STATE_KEY, JSON.stringify({
            year: currentYear,
            category: currentCategory,
            view: currentView,
        }));
    } catch (e) {
        // sessionStorage를 쓸 수 없는 환경(프라이빗 모드 등)이면 조용히 무시
    }
}

function setViewMode(mode) {
    currentView = mode;
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.classList.toggle('view-masonry', mode === 'masonry');
    galleryGrid.classList.toggle('view-grid', mode === 'grid');

    document.getElementById('viewMasonryBtn').classList.toggle('active', mode === 'masonry');
    document.getElementById('viewGridBtn').classList.toggle('active', mode === 'grid');

    saveGalleryState();
}

function setFilter(value, type) {
    if (type === 'year') {
        currentYear = value;
        updateActiveButtons('.year-btn', value);
    } else if (type === 'category') {
        currentCategory = value;
        updateActiveButtons('#tagFilter .cat-btn', value);
    }

    saveGalleryState();
    renderGallery();
}

function updateActiveButtons(selectorOrElements, value) {
    const buttons = typeof selectorOrElements === 'string'
        ? document.querySelectorAll(selectorOrElements)
        : selectorOrElements;
    buttons.forEach(button => {
        const buttonValue = (button.dataset.filter || '').toLowerCase();
        button.classList.toggle('active', buttonValue === String(value).toLowerCase());
    });
}

function getFilteredItems() {
    return sectionItems().filter(item => {
        const yearMatch = item.dataset.year === currentYear;
        const tagMatch = currentCategory === 'all' || itemTags(item).includes(currentCategory.toLowerCase());
        return yearMatch && tagMatch;
    });
}

// 필터에 맞는 카드를 전부 표시한다(페이지 제한 없음) — 필터를 바꿨을 때
// 일부 카드가 다음 페이지에 가려져 안 보이는 문제를 막기 위함.
function renderGallery() {
    const allItems = document.querySelectorAll('.gallery-card');
    if (!allItems.length) {
        return;
    }

    const filteredItems = new Set(getFilteredItems());

    allItems.forEach(item => {
        item.style.display = filteredItems.has(item) ? 'flex' : 'none';
    });

    // 보여줄 작품이 없는 칸(예: 유료)은 안내 문구를 띄운다
    const grid = document.getElementById('gallery-grid');
    let empty = document.getElementById('galleryEmpty');
    if (!empty && grid) {
        empty = document.createElement('p');
        empty.id = 'galleryEmpty';
        empty.className = 'gallery-empty';
        empty.textContent = '작업물을 준비하고 있어요.';
        grid.parentNode.insertBefore(empty, grid.nextSibling);
    }
    if (empty) empty.hidden = filteredItems.size > 0;
}


/* ---- 연도 버튼에 작품 수 표시 + 최신작 벤토 ---- */
function addYearCounts() {
    const items = sectionItems();
    document.querySelectorAll('.year-btn').forEach(btn => {
        if (btn.hidden || btn.querySelector('small')) return;
        const n = items.filter(i => i.dataset.year === btn.dataset.filter).length;
        const small = document.createElement('small');
        small.textContent = n + ' works';
        btn.appendChild(small);
    });
}

// 카드의 날짜(2026.01.05)로 최신순 정렬해서 위쪽에 큰 1장 + 작은 6장을 보여준다.
function buildLatestBento() {
    const box = document.getElementById('latestBento');
    const grid = document.getElementById('latestGrid');
    if (!box || !grid) return;

    const dateOf = item => (item.querySelector('.card-date')?.textContent || '').trim();
    const items = sectionItems()
        .filter(item => item.querySelector('.card-img-box img[src]'))
        .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));

    if (items.length < 7) {
        box.hidden = true;
        return;
    }

    grid.innerHTML = '';
    items.slice(0, 7).forEach((item, i) => {
        const link = document.createElement('a');
        link.className = 'latest-item' + (i === 0 ? ' big' : '');
        link.href = item.getAttribute('href');
        const img = document.createElement('img');
        img.src = item.querySelector('.card-img-box img').getAttribute('src');
        img.alt = item.dataset.title || '';
        link.appendChild(img);
        if (i === 0) {
            const label = document.createElement('span');
            label.textContent = dateOf(item).replace(/\./g, '.') + ' · 최신작';
            link.appendChild(label);
        }
        grid.appendChild(link);
    });
    box.hidden = false;
}

/* --- 라이트박스: 모아보기(masonry) 뷰에서 카드를 클릭하면 이미지를 전체로 보여줌 --- */
let lightboxItems = [];
let lightboxIndex = 0;

function setupLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <button class="lightbox-close" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
        <button class="lightbox-nav prev" aria-label="이전"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="lightbox-nav next" aria-label="다음"><i class="fa-solid fa-chevron-right"></i></button>
        <figure class="lightbox-figure">
            <img src="" alt="">
            <figcaption class="lightbox-caption">
                <div class="lb-title"></div>
                <div class="lb-date"></div>
            </figcaption>
        </figure>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });
    overlay.querySelector('.lightbox-nav.prev').addEventListener('click', () => stepLightbox(-1));
    overlay.querySelector('.lightbox-nav.next').addEventListener('click', () => stepLightbox(1));

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
    });

    document.getElementById('gallery-grid').addEventListener('click', (e) => {
        if (currentView !== 'masonry') return;
        const card = e.target.closest('.gallery-card');
        if (!card) return;

        e.preventDefault();
        lightboxItems = Array.from(document.querySelectorAll('.gallery-card'))
            .filter(item => item.style.display !== 'none');
        lightboxIndex = lightboxItems.indexOf(card);
        openLightbox();
    });
}

function openLightbox() {
    const overlay = document.querySelector('.lightbox-overlay');
    renderLightboxItem();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const overlay = document.querySelector('.lightbox-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function stepLightbox(direction) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
    renderLightboxItem();
}

function renderLightboxItem() {
    const card = lightboxItems[lightboxIndex];
    if (!card) return;

    const overlay = document.querySelector('.lightbox-overlay');
    const img = card.querySelector('.card-img-box img');
    const date = card.querySelector('.card-date');
    const title = card.dataset.title || '';

    overlay.querySelector('.lightbox-figure img').src = img ? img.src : '';
    overlay.querySelector('.lb-title').textContent = title;
    overlay.querySelector('.lb-date').textContent = date ? date.textContent : '';
}

function toggleNav() {
    document.getElementById('main-nav').classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', function (event) {
    const navWrapper = document.querySelector('.bottom-nav-wrapper');
    const navBar = document.getElementById('main-nav');

    if (navWrapper && !navWrapper.contains(event.target) && navBar.classList.contains('active')) {
        navBar.classList.remove('active');
    }
});
