/* 공용: 뒤로가기 버튼은 "방금 보던 이전 페이지"로 돌아간다.
   - 사이트 안에서 이 페이지로 들어왔다면 브라우저의 뒤로가기(history.back)로 이동
     (그래서 보던 연도·스크롤 위치도 그대로 돌아온다)
   - 주소를 직접 열었거나 다른 사이트에서 들어와서 이전 페이지가 없으면
     버튼에 적힌 링크(상위 페이지)로 이동한다 */
(function () {
    var SELECTOR = '[data-back], .detail-back-btn, .post-back-btn, .dev-back, .archive-home-link, .back-btn, .intro-back';

    function cameFromThisSite() {
        if (!document.referrer || window.history.length < 2) {
            return false;
        }
        try {
            return new URL(document.referrer).origin === window.location.origin;
        } catch (error) {
            return false;
        }
    }

    document.addEventListener('click', function (event) {
        var link = event.target.closest(SELECTOR);
        if (!link || event.defaultPrevented) {
            return;
        }
        // 새 탭 열기(ctrl/cmd/가운데 클릭)는 그대로 둔다
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
            return;
        }
        if (cameFromThisSite()) {
            event.preventDefault();
            window.history.back();
        }
    });
})();
