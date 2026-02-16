function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const seedData = [
  {
    id: makeId(),
    name: "김민준",
    className: "2반",
    number: "13",
    studentPhone: "010-2233-1122",
    guardian1Name: "김지연",
    guardian1Phone: "010-1234-5678",
    guardian2Name: "김정우",
    guardian2Phone: "010-9988-7766",
    address: "서울시 강동구 천호동 00-00",
    note: "수학 보충 관심. 방과후 16:00 이후 연락 권장",
    tags: ["방과후", "상담필요"]
  },
  {
    id: makeId(),
    name: "이서윤",
    className: "2반",
    number: "21",
    studentPhone: "010-2121-4545",
    guardian1Name: "이동훈",
    guardian1Phone: "010-8888-1212",
    guardian2Name: "최미경",
    guardian2Phone: "010-7878-3434",
    address: "서울시 송파구 잠실동 00-00",
    note: "알레르기 약 복용",
    tags: ["건강"]
  },
  {
    id: makeId(),
    name: "박도현",
    className: "3반",
    number: "7",
    studentPhone: "010-8881-3000",
    guardian1Name: "박수미",
    guardian1Phone: "010-4545-9898",
    guardian2Name: "박민철",
    guardian2Phone: "010-2020-3030",
    address: "서울시 마포구 상암동 00-00",
    note: "등하교 버스 이용",
    tags: ["통학"]
  }
];

const state = {
  students: [...seedData],
  filtered: [...seedData]
};

const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");
const tagFilter = document.getElementById("tagFilter");
const csvInput = document.getElementById("csvInput");
const cardList = document.getElementById("cardList");
const detailModal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const cardTemplate = document.getElementById("cardTemplate");

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toTel(phone = "") {
  return phone.replace(/[^\d+]/g, "");
}

function setActionLink(button, scheme, phone) {
  const sanitizedPhone = toTel(phone);
  if (!sanitizedPhone) {
    button.removeAttribute("href");
    button.setAttribute("aria-disabled", "true");
    button.classList.add("disabled");
    return;
  }

  button.href = `${scheme}:${sanitizedPhone}`;
  button.classList.remove("disabled");
  button.removeAttribute("aria-disabled");
}

function normalizeTags(tagsValue) {
  if (Array.isArray(tagsValue)) {
    return [...new Set(tagsValue.map((tag) => String(tag).trim()).filter(Boolean))];
  }
  return [];
}

function normalizeStudent(raw) {
  const guardian1Name = raw.guardian1Name || raw.guardianName || "";
  const guardian1Phone = raw.guardian1Phone || raw.primaryPhone || "";

  return {
    id: raw.id || makeId(),
    name: raw.name || "",
    className: raw.className || "",
    number: raw.number || "",
    studentPhone: raw.studentPhone || raw.studentPhoneNumber || raw.student_phone || raw.primaryPhone || "",
    guardian1Name,
    guardian1Phone,
    guardian2Name: raw.guardian2Name || "",
    guardian2Phone: raw.guardian2Phone || "",
    address: raw.address || "",
    note: raw.note || "",
    tags: normalizeTags(raw.tags)
  };
}

function populateFilters() {
  const prevClass = classFilter.value;
  const prevTag = tagFilter.value;

  const classes = [...new Set(state.students.map((s) => s.className).filter(Boolean))].sort();
  const tags = [...new Set(state.students.flatMap((s) => s.tags || []).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ko")
  );

  classFilter.innerHTML = `<option value="all">전체 반</option>${classes
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("")}`;

  tagFilter.innerHTML = `<option value="all">전체 태그</option>${tags
    .map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
    .join("")}`;

  classFilter.value = classes.includes(prevClass) ? prevClass : "all";
  tagFilter.value = tags.includes(prevTag) ? prevTag : "all";
}

function matchesSearch(student, term) {
  if (!term) return true;
  const haystack = [
    student.name,
    student.className,
    student.number,
    student.note,
    student.guardian1Name,
    student.guardian2Name,
    student.studentPhone,
    ...(student.tags || [])
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedClass = classFilter.value;
  const selectedTag = tagFilter.value;

  state.filtered = state.students.filter((student) => {
    const classOk = selectedClass === "all" || student.className === selectedClass;
    const tagOk = selectedTag === "all" || (student.tags || []).includes(selectedTag);
    return classOk && tagOk && matchesSearch(student, term);
  });

  renderCards();
}

function renderCards() {
  cardList.innerHTML = "";

  if (state.filtered.length === 0) {
    cardList.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.filtered.forEach((student) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".student-name").textContent = student.name;
    card.querySelector(".student-class-number").textContent = `${student.className} ${student.number}번`;
    card.querySelector(".primary-contact").textContent = `연락처: ${student.studentPhone || "-"}`;

    const callButton = card.querySelector(".call-button");
    const smsButton = card.querySelector(".sms-button");
    setActionLink(callButton, "tel", student.studentPhone);
    setActionLink(smsButton, "sms", student.studentPhone);

    [callButton, smsButton].forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.classList.contains("disabled")) {
          event.preventDefault();
        }
        event.stopPropagation();
      });
    });

    const openDetail = () => showDetail(student);
    card.addEventListener("click", openDetail);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail();
      }
    });

    fragment.appendChild(card);
  });

  cardList.appendChild(fragment);
}

function guardianActionRow(label, phone) {
  if (!phone) {
    return `
      <div class="guardian-row">
        <p class="guardian-title">${escapeHtml(label)}</p>
        <p class="guardian-empty">등록된 전화번호가 없습니다.</p>
      </div>
    `;
  }

  const tel = toTel(phone);
  return `
    <div class="guardian-row">
      <p class="guardian-title">${escapeHtml(label)}: ${escapeHtml(phone)}</p>
      <div class="guardian-actions">
        <a class="button call-button" href="tel:${tel}">전화</a>
        <a class="button sms-button" href="sms:${tel}">문자</a>
      </div>
    </div>
  `;
}

function renderEditableTags(student) {
  const tags = student.tags || [];
  if (!tags.length) {
    return `<p class="guardian-empty">등록된 태그가 없습니다.</p>`;
  }

  return tags
    .map(
      (tag) => `
      <span class="editable-tag">
        <span>${escapeHtml(tag)}</span>
        <button type="button" class="tag-remove" data-tag="${escapeHtml(tag)}" aria-label="${escapeHtml(tag)} 삭제">×</button>
      </span>
    `
    )
    .join("");
}

function bindTagEditor(student) {
  const addInput = detailContent.querySelector("#newTagInput");
  const addButton = detailContent.querySelector("#addTagButton");
  const tagContainer = detailContent.querySelector("#editableTagList");

  function rerenderTagSection() {
    tagContainer.innerHTML = renderEditableTags(student);
    populateFilters();
    applyFilters();
  }

  addButton?.addEventListener("click", () => {
    const nextTag = addInput.value.trim();
    if (!nextTag) return;

    if (!student.tags.includes(nextTag)) {
      student.tags.push(nextTag);
      student.tags.sort((a, b) => a.localeCompare(b, "ko"));
      rerenderTagSection();
    }
    addInput.value = "";
    addInput.focus();
  });

  addInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addButton?.click();
    }
  });

  tagContainer?.addEventListener("click", (event) => {
    const button = event.target.closest(".tag-remove");
    if (!button) return;
    const targetTag = button.dataset.tag;
    student.tags = student.tags.filter((tag) => tag !== targetTag);
    rerenderTagSection();
  });
}

function showDetail(student) {
  detailContent.innerHTML = `
    <h3>${escapeHtml(student.name)} · ${escapeHtml(student.className)} ${escapeHtml(student.number)}번</h3>
    <div class="detail-grid">
      <div><strong>학생 전화</strong>: ${escapeHtml(student.studentPhone || "-")}</div>
      <div><strong>주소</strong>: ${escapeHtml(student.address || "-")}</div>
      <div>
        <strong>보호자 연락</strong>
        <div class="guardian-contact-list">
          ${guardianActionRow(student.guardian1Name || "보호자 1", student.guardian1Phone)}
          ${guardianActionRow(student.guardian2Name || "보호자 2", student.guardian2Phone)}
        </div>
      </div>
      <div class="tag-editor">
        <strong>태그</strong>
        <div id="editableTagList" class="editable-tag-list">${renderEditableTags(student)}</div>
        <div class="tag-create-row">
          <input id="newTagInput" type="text" placeholder="새 태그 입력" />
          <button id="addTagButton" type="button" class="button secondary small">추가</button>
        </div>
      </div>
    </div>

    <section class="memo-editor">
      <label for="detailMemo"><strong>메모</strong></label>
      <textarea id="detailMemo" class="memo-input" rows="5" placeholder="자유롭게 메모를 입력하세요.">${escapeHtml(
        student.note || ""
      )}</textarea>
    </section>
  `;

  const memoInput = detailContent.querySelector("#detailMemo");
  memoInput?.addEventListener("input", (event) => {
    student.note = event.target.value;
    applyFilters();
  });

  bindTagEditor(student);

  if (typeof detailModal.showModal === "function") {
    detailModal.showModal();
  } else {
    detailModal.setAttribute("open", "");
  }
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV 데이터가 충분하지 않습니다.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const required = ["name", "className", "number"];

  required.forEach((key) => {
    if (!headers.includes(key)) {
      throw new Error(`필수 헤더 누락: ${key}`);
    }
  });

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));

    return normalizeStudent({
      id: makeId(),
      name: row.name,
      className: row.className,
      number: row.number,
      studentPhone: row.studentPhone,
      guardian1Name: row.guardian1Name || row.guardianName,
      guardian1Phone: row.guardian1Phone || row.primaryPhone,
      guardian2Name: row.guardian2Name,
      guardian2Phone: row.guardian2Phone,
      address: row.address,
      note: row.note,
      tags: row.tags ? row.tags.split("|").map((x) => x.trim()).filter(Boolean) : []
    });
  });
}

function setCsvError(message = "") {
  let errorEl = document.querySelector(".csv-upload .error");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.className = "error";
    document.querySelector(".csv-upload").appendChild(errorEl);
  }
  errorEl.textContent = message;
}

searchInput.addEventListener("input", applyFilters);
classFilter.addEventListener("change", applyFilters);
tagFilter.addEventListener("change", applyFilters);

csvInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCsv(text);
    state.students = rows;
    populateFilters();
    applyFilters();
    setCsvError("");
  } catch (error) {
    setCsvError(error.message || "CSV 파일 처리 중 오류가 발생했습니다.");
  } finally {
    csvInput.value = "";
  }
});

state.students = state.students.map(normalizeStudent);
state.filtered = [...state.students];
populateFilters();
renderCards();
