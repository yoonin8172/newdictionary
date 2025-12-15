/*************************************************
 * DEMO DICTIONARY DATA
 * (기존에 존재하는 단어만 다룸)
 *************************************************/

const dictionaryData = {
    "밤": [
        { type: "text", content: "해가 진 뒤부터 해가 뜨기 전까지의 시간." },
        { type: "text", content: "생각이 많아지는 시간대." },
        { type: "image", content: "https://via.placeholder.com/300x180?text=night" }
    ],
    "사전": [
        { type: "text", content: "단어의 뜻을 풀이해 놓은 책." },
        { type: "text", content: "완성된 의미를 제공한다고 믿게 만드는 형식." }
    ]
};

/*************************************************
 * DOM ELEMENTS
 *************************************************/

const homeSection = document.getElementById("home");
const resultSection = document.getElementById("result");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");

const wordTitle = document.getElementById("wordTitle");
const definitionList = document.getElementById("definitionList");

const addBtn = document.getElementById("addBtn");
const addForm = document.getElementById("addForm");
const definitionInput = document.getElementById("definitionInput");
const saveBtn = document.getElementById("saveBtn");

const homeBtn = document.getElementById("homeBtn");

/*************************************************
 * SEARCH ACTION
 *************************************************/

searchBtn.addEventListener("click", () => {
    const word = searchInput.value.trim();
    if (!word) return;

    // 사전에 없는 단어
    if (!dictionaryData[word]) {
        searchStatus.textContent = "사전에 등록되지 않은 단어입니다.";
        searchStatus.style.visibility = "visible";

        return;
    }

    // 검색 성공
    searchStatus.style.visibility = "hidden";

    showResultPage(word);
});

/*************************************************
 * ENTER KEY SEARCH (with subtle feedback)
 *************************************************/

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const bar = document.querySelector(".search-bar");

        // 아주 잠깐 눌린 느낌
        bar.classList.add("searching");

        setTimeout(() => {
            bar.classList.remove("searching");
            searchBtn.click();
        }, 120);
    }
});

/*************************************************
 * SHOW RESULT PAGE
 *************************************************/

function showResultPage(word) {
    homeSection.style.display = "none";
    resultSection.style.display = "block";

    wordTitle.textContent = word;

    renderDefinitions(word);

    // 정의 추가 폼은 항상 닫힌 상태
    addForm.style.display = "none";
}

/*************************************************
 * RENDER DEFINITIONS
 *************************************************/

function renderDefinitions(word) {
    definitionList.innerHTML = "";

    const items = dictionaryData[word];

    items.forEach((item, index) => {
        if (item.type === "text") {
            const div = document.createElement("div");
            div.innerHTML = `<span class="index">${index + 1}</span> ${item.content}`;
            definitionList.appendChild(div);
        }

        if (item.type === "image") {
            const img = document.createElement("img");
            img.src = item.content;
            img.style.maxWidth = "100%";
            img.style.margin = "12px 0";
            definitionList.appendChild(img);
        }
    });
}

/*************************************************
 * TOGGLE ADD FORM
 *************************************************/

addBtn.addEventListener("click", () => {
    addForm.style.display =
        addForm.style.display === "none" ? "block" : "none";
});

/*************************************************
 * SAVE NEW DEFINITION
 *************************************************/

saveBtn.addEventListener("click", () => {
    const text = definitionInput.value.trim();
    if (!text) return;

    const word = wordTitle.textContent;

    dictionaryData[word].push({
        type: "text",
        content: text
    });

    definitionInput.value = "";
    addForm.style.display = "none";

    renderDefinitions(word);
});

/*************************************************
 * HOME BUTTON ACTION
 *************************************************/

homeBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    homeSection.style.display = "flex";

    searchInput.value = "";
    searchStatus.style.display = "none";
});
