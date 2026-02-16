const seedData = [
  {
    id: crypto.randomUUID(),
    name: "김민준",
    className: "2반",
    number: "13",
    guardianName: "김지연",
    primaryPhone: "010-1234-5678",
    address: "서울시 강동구 천호동 00-00",
    note: "수학 보충 관심. 방과후 16:00 이후 연락 권장",
    tags: ["방과후", "상담필요"],
    extraContacts: ["부: 010-9988-7766", "학생: 010-2233-1122"],
    group: "상담"
  },
  {
    id: crypto.randomUUID(),
    name: "이서윤",
    className: "2반",
    number: "21",
    guardianName: "이동훈",
    primaryPhone: "010-8888-1212",
    address: "서울시 송파구 잠실동 00-00",
    note: "알레르기 약 복용",
    tags: ["건강"],
    extraContacts: ["모: 010-7878-3434"],
    group: "건강"
  },
  {
    id: crypto.randomUUID(),
    name: "박도현",
    className: "3반",
    number: "7",
    guardianName: "박수미",
    primaryPhone: "010-4545-9898",
    address: "서울시 마포구 상암동 00-00",
    note: "등하교 버스 이용",
    tags: ["통학"],
    extraContacts: ["조부모: 010-2020-3030"],
    group: "통학"
  }
];

const state = {
  students: [...seedData],
  filtered: [...seedData]
};

const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");
const groupFilter = document.getElementById("groupFilter");
const csvInput = document.getElementById("csvInput");
const cardList = document.getElementById("cardList");
const detailModal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const cardTemplate = document.getElementById("cardTemplate");

function toTel(phone = "") {
  return phone.replace(/[^\d+]/g, "");
}

function populateFilters() {
  const classes = [...new Set(state.students.map((s) => s.className).filter(Boolean))].sort();
  const groups = [...new Set(state.students.map((s) => s.group).filter(Boolean))].sort();

  classFilter.innerHTML = `<option value="all">전체 반</option>${classes
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("")}`;

  groupFilter.innerHTML = `<option value="all">전체 그룹</option>${groups
    .map((g) => `<option value="${g}">${g}</option>`)
    .join("")}`;
}

function matchesSearch(student, term) {
  if (!term) return true;
  const haystack = [
    student.name,
    student.className,
    student.number,
    student.note,
    student.guardianName
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedClass = classFilter.value;
  const selectedGroup = groupFilter.value;

  state.filtered = state.students.filter((student) => {
    const classOk = selectedClass === "all" || student.className === selectedClass;
    const groupOk = selectedGroup === "all" || student.group === selectedGroup;
    return classOk && groupOk && matchesSearch(student, term);
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
    card.querySelector(".primary-contact").textContent = `주 연락처(${student.guardianName}): ${student.primaryPhone}`;

    const callButton = card.querySelector(".call-button");
    const smsButton = card.querySelector(".sms-button");
    callButton.href = `tel:${toTel(student.primaryPhone)}`;
    smsButton.href = `sms:${toTel(student.primaryPhone)}`;

    [callButton, smsButton].forEach((button) => {
      button.addEventListener("click", (event) => {
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

function showDetail(student) {
  detailContent.innerHTML = `
    <h3>${student.name} · ${student.className} ${student.number}번</h3>
    <div class="detail-grid">
      <div><strong>주 보호자</strong>: ${student.guardianName} (${student.primaryPhone})</div>
      <div><strong>주소</strong>: ${student.address || "-"}</div>
      <div><strong>메모</strong>: ${student.note || "-"}</div>
      <div><strong>그룹</strong>: ${student.group || "-"}</div>
      <div>
        <strong>태그</strong>:
        <div class="tag-list">${(student.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("") || "-"}</div>
      </div>
      <div>
        <strong>추가 연락처</strong>:
        <ul>
          ${(student.extraContacts || []).map((c) => `<li>${c}</li>`).join("") || "<li>-</li>"}
        </ul>
      </div>
    </div>
  `;
  detailModal.showModal();
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
  const required = ["name", "className", "number", "guardianName", "primaryPhone"];

  required.forEach((key) => {
    if (!headers.includes(key)) {
      throw new Error(`필수 헤더 누락: ${key}`);
    }
  });

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
    return {
      id: crypto.randomUUID(),
      name: row.name,
      className: row.className,
      number: row.number,
      guardianName: row.guardianName,
      primaryPhone: row.primaryPhone,
      address: row.address || "",
      note: row.note || "",
      group: row.group || "",
      tags: row.tags ? row.tags.split("|").map((x) => x.trim()).filter(Boolean) : [],
      extraContacts: row.extraContacts
        ? row.extraContacts.split("|").map((x) => x.trim()).filter(Boolean)
        : []
    };
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
groupFilter.addEventListener("change", applyFilters);

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

populateFilters();
renderCards();
