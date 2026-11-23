/* ===================================================================
   이력서 뷰어: "이력서 보기" 버튼을 누르면 페이지를 이동하지 않고 이력서가 위에서 펼쳐진다.
   - 메인(.about-btn)과 프로필(.resume-btn-intro / openResume())에서 같이 쓴다.
   - 이력서 이미지는 profile/assets/resume/ 에 있다. 쪽을 늘리려면 PAGES 에 파일을 추가한다.
   =================================================================== */
(function () {
    // 프로필 페이지에서는 받은 PDF 원본 그대로(2쪽), 그 밖의 페이지(메인 등)에서는 Patohsi 이력서(1쪽)를 보여 준다
    var IS_PROFILE = /\/profile\//.test(location.pathname);
    var PAGES = IS_PROFILE ? ['resume_orig_p1.webp', 'resume_orig_p2.webp'] : ['resume_p1.webp'];

    // 이 스크립트(assets/resume_viewer.js) 위치로 사이트 루트를 계산한다
    var me = document.currentScript;
    var base = me ? me.src.replace(/assets\/resume_viewer\.js.*$/, '') : '';
    var dir = base + 'profile/assets/resume/';

    var css = document.createElement('style');
    css.textContent = [
        '.rv-wrap{position:fixed;inset:0;z-index:5000;display:none;}',
        '.rv-wrap.open{display:block;}',
        '.rv-back{position:absolute;inset:0;background:rgba(10,10,12,.82);opacity:0;transition:opacity .3s;}',
        '.rv-wrap.show .rv-back{opacity:1;}',
        '.rv-sheet{position:absolute;left:50%;top:0;bottom:0;width:min(920px,100%);transform:translateX(-50%);overflow-y:auto;padding:56px 14px 40px;box-sizing:border-box;-webkit-overflow-scrolling:touch;}',
        '.rv-paper{transform-origin:top center;transform:scaleY(.04);opacity:0;transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .35s;}',
        '.rv-wrap.show .rv-paper{transform:scaleY(1);opacity:1;}',
        '.rv-paper img{display:block;width:100%;height:auto;background:#fff;border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,.5);margin-bottom:16px;}',
        '.rv-close{position:fixed;top:12px;right:14px;z-index:2;padding:9px 18px;border:1px solid #3a3a42;border-radius:999px;background:rgba(20,20,23,.9);color:#fff;font:800 .85rem "Noto Sans KR",sans-serif;cursor:pointer;}',
        '.rv-close:hover{background:#304ffe;}'
    ].join('');
    document.head.appendChild(css);

    var wrap = document.createElement('div');
    wrap.className = 'rv-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<div class="rv-back"></div><button type="button" class="rv-close">닫기 ✕</button><div class="rv-sheet"><div class="rv-paper"></div></div>';
    var paper = wrap.querySelector('.rv-paper');
    PAGES.forEach(function (f, i) {
        var img = document.createElement('img');
        img.alt = '이력서 ' + (i + 1) + '쪽';
        img.src = dir + f;
        paper.appendChild(img);
    });
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(wrap); });
    if (document.body) document.body.appendChild(wrap);

    function open() {
        wrap.classList.add('open');
        wrap.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        wrap.querySelector('.rv-sheet').scrollTop = 0;
        requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('show'); }); });
    }
    function close() {
        wrap.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(function () { wrap.classList.remove('open'); wrap.setAttribute('aria-hidden', 'true'); }, 350);
    }
    window.openResume = open;
    window.closeResume = close;

    wrap.querySelector('.rv-back').addEventListener('click', close);
    wrap.querySelector('.rv-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) close(); });

    // 메인의 "이력서 보기" 링크는 페이지 이동 대신 이력서를 펼친다
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.about-btn[href*="#resume"]');
        if (a) { e.preventDefault(); open(); }
    });

    // 프로필 주소에 #resume 이 붙어 있으면 바로 펼친다
    if (location.hash === '#resume') window.addEventListener('load', open);
})();
