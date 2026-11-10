// 네비게이션 토글
function toggleNav() {
    const navBar = document.getElementById('main-nav');
    navBar.classList.toggle('active');
}

// 스크롤 탑
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 외부 클릭 시 네비게이션 닫기
document.addEventListener('click', function (event) {
    const navWrapper = document.querySelector('.bottom-nav-wrapper');
    const navBar = document.getElementById('main-nav');

    if (navWrapper && !navWrapper.contains(event.target) && navBar.classList.contains('active')) {
        navBar.classList.remove('active');
    }
});

// 이력서 팝업
function openResume() {
    const modal = document.getElementById('resumeModal');
    if (!modal) return;
    modal.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';
}

function closeResume() {
    const modal = document.getElementById('resumeModal');
    if (!modal) return;
    modal.classList.add('is-hidden');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeResume();
});

// 메인 페이지 "이력서 보기" 링크(#resume)로 들어오면 이력서 팝업을 바로 연다
if (location.hash === '#resume') {
    window.addEventListener('load', openResume);
}


// 프로필 탭: TOOLS / PIPELINE / HISTORY (주소 뒤에 #pipeline, #history 를 붙이면 해당 탭으로 열림)
(function () {
    const tabs = document.querySelectorAll('.ptab');
    const panels = document.querySelectorAll('.tab-panel');
    if (!tabs.length) return;

    function showTab(name) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
        panels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    }

    tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

    const hash = location.hash.replace('#', '');
    if (['tools', 'pipeline', 'history'].indexOf(hash) !== -1) {
        showTab(hash);
    }
})();
