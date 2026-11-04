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
