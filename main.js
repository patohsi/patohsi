/* 메인 페이지: 스크롤하면 .fx 요소가 아래에서 위로 페이드인 (index.html 전용) */
(function () {
    var items = document.querySelectorAll('.fx');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('in'); });
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(function (el) { io.observe(el); });
})();

/* 페이지 맨 아래까지 내려가면 하단 메뉴 바가 자동으로 펼쳐지고, 위로 올라오면 접힌다 */
(function () {
    var nav = document.getElementById('main-nav');
    if (!nav) return;
    var autoOpened = false;

    function atBottom() {
        var scrollBottom = window.scrollY + window.innerHeight;
        return scrollBottom >= document.documentElement.scrollHeight - 80;
    }

    function check() {
        if (atBottom()) {
            if (!autoOpened) {
                nav.classList.add('active');
                autoOpened = true;
            }
        } else if (autoOpened) {
            nav.classList.remove('active');
            autoOpened = false;
        }
    }

    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
})();


/* ===================================================================
   그림 / 3D / 개발 최신 탭: portfolio 페이지에서 가장 최신 항목을 읽어 채운다
   (읽지 못하면 index.html 에 적어 둔 기본값이 그대로 보인다)
   =================================================================== */
(function loadLatestTabs() {
    function fill(id, data) {
        var tile = document.getElementById(id);
        if (!tile || !data) return;
        tile.href = data.href;
        var img = tile.querySelector('img');
        if (img && data.img) { img.style.display = ''; img.src = data.img; }
        tile.querySelector('.lt-title').textContent = data.title;
        tile.querySelector('.lt-meta').textContent = data.meta;
    }

    function parse(text) {
        return new DOMParser().parseFromString(text, 'text/html');
    }

    function latestOf(doc, category) {
        var cards = Array.prototype.slice.call(doc.querySelectorAll('.gallery-card'))
            .filter(function (c) { return (c.dataset.category || '').toLowerCase() === category; });
        function date(c) { return (c.querySelector('.card-date') || {}).textContent || ''; }
        cards.sort(function (a, b) { return date(b).trim().localeCompare(date(a).trim()); });
        var card = cards[0];
        if (!card) return null;
        var img = card.querySelector('.card-img-box img');
        return {
            href: 'portfolio/' + card.getAttribute('href'),
            img: img && img.getAttribute('src') ? 'portfolio/' + img.getAttribute('src') : '',
            title: card.dataset.title || '',
            meta: date(card).trim()
        };
    }

    fetch('portfolio/art.html').then(function (r) { return r.ok ? r.text() : ''; }).then(function (text) {
        if (!text) return;
        var doc = parse(text);
        fill('latestArt', latestOf(doc, 'art'));
        fill('latest3d', latestOf(doc, '3d'));
    }).catch(function () {});

    fetch('portfolio/dev.html').then(function (r) { return r.ok ? r.text() : ''; }).then(function (text) {
        if (!text) return;
        var card = parse(text).querySelector('.dev-card');
        if (!card) return;
        var img = card.querySelector('img');
        var name = card.querySelector('.dev-name');
        var tag = card.querySelector('.dev-tags');
        var href = card.getAttribute('href');
        fill('latestDev', {
            href: /^https?:/.test(href) ? href : 'portfolio/' + href,
            img: img && img.getAttribute('src') ? 'portfolio/' + img.getAttribute('src') : '',
            title: name ? name.childNodes[0].textContent.trim() : '',
            meta: tag ? tag.textContent.trim() : ''
        });
    }).catch(function () {});
})();


/* ===================================================================
   HERO_SLIDESHOW: 첫 화면 슬라이드 (이미지/영상 + 글 + 버튼이 함께 바뀜)
   =================================================================== */
(function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    if (!slides.length) return;

    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var timerBar = document.querySelector('.timer-bar');
    var current = 0;
    var timer = null;
    var DEFAULT_DURATION = 6000;

    function mediaOf(slide) {
        return slide.querySelector('video');
    }

    function restartTimerBar(duration) {
        if (!timerBar) return;
        timerBar.classList.remove('timer-animate');
        void timerBar.offsetWidth;
        timerBar.style.animationDuration = (duration / 1000) + 's';
        timerBar.classList.add('timer-animate');
    }

    function schedule() {
        clearTimeout(timer);
        var duration = parseInt(slides[current].dataset.duration, 10) || DEFAULT_DURATION;
        restartTimerBar(duration);
        timer = setTimeout(function () { show(current + 1); }, duration);
    }

    function show(index) {
        var video = mediaOf(slides[current]);
        slides[current].classList.remove('active');
        if (video) video.pause();

        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        video = mediaOf(slides[current]);
        if (video) {
            video.currentTime = 0;
            var played = video.play();
            if (played && played.catch) played.catch(function () {});
        }

        dots.forEach(function (dot, i) { dot.classList.toggle('active', i === current); });
        schedule();
    }

    dots.forEach(function (dot) {
        dot.addEventListener('click', function () { show(parseInt(dot.dataset.slide, 10)); });
    });

    // 시작: 첫 슬라이드가 영상이면 재생
    var firstVideo = mediaOf(slides[0]);
    if (firstVideo) {
        var p = firstVideo.play();
        if (p && p.catch) p.catch(function () {});
    }
    schedule();
})();
