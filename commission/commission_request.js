/* ===================================================================
   커미션 신청서 페이지 (request.html) 전용 스크립트
   - 커미션 종류: 태그 단일 선택
   - 추가 옵션: +버튼으로 여러 개 추가/제거
   - 작성 내용 -> Web3Forms -> patohsi 이메일로 전송
   =================================================================== */

// TODO: https://web3forms.com 에서 받은 Access Key로 교체하세요. (키는 공개되어도 되는 값입니다)
const WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_ACCESS_KEY';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

let selectedAddons = []; // { label, value } 목록, 같은 종류 중복 추가 가능

const MESSAGES = {
    ko: {
        sending: '보내는 중입니다…',
        done: '신청서가 전달되었습니다. 확인 후 입력하신 이메일로 연락드리겠습니다.',
        fail: '전송에 실패했습니다. 잠시 후 다시 시도하거나 X(DM)로 연락해 주세요.',
        noKey: '아직 전송 설정이 되어 있지 않습니다. (관리자: commission_request.js 의 Access Key 를 입력해 주세요)',
        type: '커미션 종류를 선택해 주세요.',
    },
    en: {
        sending: 'Sending…',
        done: 'Your request has been sent. I will email you after reviewing it.',
        fail: 'Failed to send. Please try again later or contact me via X (DM).',
        noKey: 'Sending is not configured yet. (Admin: set the Access Key in commission_request.js)',
        type: 'Please choose a commission type.',
    },
};

function currentLang() {
    const active = document.querySelector('.lang-btn.active');
    return active && /EN/i.test(active.textContent) ? 'en' : 'ko';
}

document.addEventListener('DOMContentLoaded', () => {
    setupTypeTags();
    setupAddonButtons();

    const sendBtn = document.getElementById('sendRequestBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendRequest);
    }
});

/* --- 커미션 종류: 태그 단일 선택 --- */
function setupTypeTags() {
    const group = document.getElementById('typeTagGroup');
    const hiddenInput = document.getElementById('reqType');
    if (!group || !hiddenInput) return;

    group.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            group.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            hiddenInput.value = chip.dataset.value;
            group.closest('.form-row').classList.remove('has-error');
        });
    });
}

/* --- 추가 옵션: +버튼으로 여러 개 추가 --- */
function setupAddonButtons() {
    const addButtons = document.querySelectorAll('.addon-add-btn');
    const selectedGroup = document.getElementById('addonSelected');
    if (!addButtons.length || !selectedGroup) return;

    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAddons.push({ label: btn.dataset.label, value: btn.dataset.value });
            renderAddonChips();
        });
    });

    renderAddonChips();
}

function renderAddonChips() {
    const selectedGroup = document.getElementById('addonSelected');
    selectedGroup.innerHTML = '';

    selectedAddons.forEach((addon, index) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip addon-chip';
        chip.innerHTML = `${addon.label} <button type="button" class="addon-remove-btn" aria-label="제거">×</button>`;
        chip.querySelector('.addon-remove-btn').addEventListener('click', () => {
            selectedAddons.splice(index, 1);
            renderAddonChips();
        });
        selectedGroup.appendChild(chip);
    });
}

function getFormValues() {
    const form = document.getElementById('requestForm');
    return {
        name: form.reqName.value.trim(),
        email: form.reqEmail.value.trim(),
        contact: form.reqContact.value.trim(),
        type: form.reqType.value,
        addons: selectedAddons.map(a => a.value),
        character: form.reqChar.value.trim(),
        deadline: form.reqDeadline.value.trim(),
        reference: form.reqRef.value.trim(),
        note: form.reqNote.value.trim(),
    };
}

function setStatus(text, ok) {
    const el = document.getElementById('formStatus');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('form-hint-success', !!ok);
}

async function sendRequest() {
    const form = document.getElementById('requestForm');
    const sendBtn = document.getElementById('sendRequestBtn');
    const typeRow = document.getElementById('typeTagGroup').closest('.form-row');
    const msg = MESSAGES[currentLang()];

    if (!form.reportValidity()) {
        return;
    }
    if (!form.reqType.value) {
        typeRow.classList.add('has-error');
        typeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setStatus(msg.type, false);
        return;
    }
    if (WEB3FORMS_ACCESS_KEY.indexOf('REPLACE_') === 0) {
        setStatus(msg.noKey, false);
        return;
    }

    const d = getFormValues();
    const summary = [
        `이름/닉네임: ${d.name}`,
        `이메일: ${d.email}`,
        `연락처: ${d.contact}`,
        `커미션 종류: ${d.type}`,
        `추가 옵션: ${d.addons.length ? d.addons.join(', ') : '-'}`,
        `캐릭터/리퀘스트 내용:\n${d.character}`,
        `희망 마감일: ${d.deadline || '-'}`,
        `레퍼런스 링크: ${d.reference || '-'}`,
        `추가 메모: ${d.note || '-'}`,
    ].join('\n\n');

    const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `[커미션 신청] ${d.type} - ${d.name}`,
        from_name: d.name,
        email: d.email, // 메일에서 바로 답장할 수 있게 reply-to 로 사용됨
        message: summary,
        botcheck: form.botcheck.checked,
    };

    sendBtn.disabled = true;
    setStatus(msg.sending, false);

    try {
        const res = await fetch(WEB3FORMS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.success) {
            setStatus(msg.done, true);
            setTimeout(() => { sendBtn.disabled = false; }, 5000);
            form.reset();
            selectedAddons = [];
            renderAddonChips();
            form.reqType.value = '';
            document.querySelectorAll('#typeTagGroup .tag-chip').forEach(c => c.classList.remove('active'));
        } else {
            setStatus(msg.fail, false);
            sendBtn.disabled = false;
        }
    } catch (err) {
        setStatus(msg.fail, false);
        sendBtn.disabled = false;
    }
}
