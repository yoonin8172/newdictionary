/*************************************************
 * FIREBASE SETUP
 *************************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

/*************************************************
 * FIREBASE CONFIG
 *************************************************/
const firebaseConfig = {
    apiKey: "AIzaSyBqFP3Bv8A4IalV5xEAPktSwbB8ezEPLOw",
    authDomain: "dictonary-ae651.firebaseapp.com",
    projectId: "dictonary-ae651",
    storageBucket: "dictonary-ae651.firebasestorage.app",
    messagingSenderId: "239536622728",
    appId: "1:239536622728:web:5960210cbd8d8eba4fa33d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/*************************************************
 * DOM
 *************************************************/
const homeSection = document.getElementById("home");
const resultSection = document.getElementById("result");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");
const suggestionList = document.getElementById("suggestionList");
const ghostText = document.getElementById("ghostText");

const wordTitle = document.getElementById("wordTitle");
const definitionList = document.getElementById("definitionList");

const addBtn = document.getElementById("addBtn");
const addForm = document.getElementById("addForm");
const definitionInput = document.getElementById("definitionInput");
const saveBtn = document.getElementById("saveBtn");

const homeBtn = document.getElementById("homeBtn");

const imageInput = document.getElementById("imageInput");
const clipBtn = document.querySelector(".attach-btn");
const imagePreview = document.getElementById("imagePreview");

/*************************************************
 * STATE
 *************************************************/
let selectedImageFile = null;
let currentSuggestions = [];
let currentSuggestionIndex = -1;
let originalInputValue = "";

/*************************************************
 * DEMO SUGGESTIONS
 *************************************************/
const demoSuggestions = {
    "사": ["사과", "사과하다", "사랑", "사용하다", "사자"],
    "가": ["가다", "가방", "가볍다", "가지", "가끔"]
};

/*************************************************
 * HELPERS
 *************************************************/
function showSearchStatus(msg) {
    searchStatus.textContent = msg;
    searchStatus.style.visibility = "visible";
}

function hideSearchStatus() {
    searchStatus.textContent = "";
    searchStatus.style.visibility = "hidden";
}

/*************************************************
 * FIRESTORE
 *************************************************/
async function wordExists(word) {
    const snap = await getDoc(doc(db, "words", word));
    return snap.exists();
}

async function loadEntries(word) {
    const q = query(
        collection(db, "words", word, "entries"),
        orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}

async function addTextEntry(word, text) {
    await addDoc(collection(db, "words", word, "entries"), {
        type: "text",
        content: text,
        createdAt: serverTimestamp()
    });
}

async function addImageEntry(word, file) {
    const imageRef = ref(storage, `words/${word}/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);

    await addDoc(collection(db, "words", word, "entries"), {
        type: "image",
        content: url,
        createdAt: serverTimestamp()
    });
}

/*************************************************
 * SEARCH
 *************************************************/
searchBtn.addEventListener("click", async () => {
    const word = searchInput.value.trim();
    if (!word) return;

    const exists = await wordExists(word);
    if (!exists) {
        showSearchStatus("사전에 등록되지 않은 단어입니다.");
        return;
    }

    hideSearchStatus();
    showResultPage(word);
});

/*************************************************
 * RESULT PAGE
 *************************************************/
async function showResultPage(word) {
    homeSection.style.display = "none";
    resultSection.style.display = "block";

    wordTitle.innerHTML = `
        <span class="word-text">${word}</span>
        <span class="word-stars">★★</span>
    `;

    addForm.style.display = "none";
    suggestionList.innerHTML = "";
    suggestionList.style.display = "none";
    ghostText.textContent = "";
    searchInput.classList.remove("hide-text");

    renderDefinitions(await loadEntries(word));
}

function renderDefinitions(entries) {
    definitionList.innerHTML = "";
    let index = 1;

    entries.forEach(item => {
        if (item.type === "text") {
            const div = document.createElement("div");
            div.innerHTML = `<span class="index">${index}</span> ${item.content}`;
            definitionList.appendChild(div);
            index++;
        }

        if (item.type === "image") {
            const img = document.createElement("img");
            img.src = item.content;
            img.className = "definition-image";
            definitionList.appendChild(img);
        }
    });
}

/*************************************************
 * ADD FORM TOGGLE
 *************************************************/
addBtn.addEventListener("click", () => {
    addForm.style.display =
        addForm.style.display === "block" ? "none" : "block";
    if (addForm.style.display === "block") {
        definitionInput.focus();
    }
});

/*************************************************
 * IMAGE
 *************************************************/
clipBtn.addEventListener("click", e => {
    e.preventDefault();
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    selectedImageFile = file;
    imagePreview.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
    imagePreview.style.display = "block";
});

/*************************************************
 * SAVE (저장 중 UX 추가)
 *************************************************/
saveBtn.addEventListener("click", async () => {
    const text = definitionInput.value.trim();
    const word = document.querySelector(".word-text").textContent;

    if (!text && !selectedImageFile) return;
    if (saveBtn.disabled) return;

    const originalText = saveBtn.textContent;
    saveBtn.textContent = "저장 중…";
    saveBtn.disabled = true;

    try {
        if (text) await addTextEntry(word, text);
        if (selectedImageFile) {
            await addImageEntry(word, selectedImageFile);
            selectedImageFile = null;
        }

        definitionInput.value = "";
        imageInput.value = "";
        imagePreview.innerHTML = "";
        imagePreview.style.display = "none";
        addForm.style.display = "none";

        renderDefinitions(await loadEntries(word));
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

/*************************************************
 * HOME
 *************************************************/
homeBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    homeSection.style.display = "flex";

    searchInput.value = "";
    ghostText.textContent = "";
    searchInput.classList.remove("hide-text");
    hideSearchStatus();
});

/*************************************************
 * SUGGESTIONS
 *************************************************/
function renderSuggestions(list) {
    suggestionList.innerHTML = "";
    currentSuggestions = list;
    currentSuggestionIndex = -1;

    list.forEach((word, index) => {
        const li = document.createElement("li");
        li.textContent = word;
        li.addEventListener("click", () => selectSuggestion(index));
        suggestionList.appendChild(li);
    });

    suggestionList.style.display = "block";
}

function updateSuggestionHighlight() {
    const items = suggestionList.querySelectorAll("li");

    items.forEach((li, i) => {
        li.classList.toggle("active", i === currentSuggestionIndex);
    });

    if (currentSuggestionIndex >= 0) {
        const suggestion = currentSuggestions[currentSuggestionIndex];
        searchInput.classList.add("hide-text");

        ghostText.textContent = suggestion.startsWith(originalInputValue)
            ? originalInputValue + suggestion.slice(originalInputValue.length)
            : suggestion;
    } else {
        ghostText.textContent = "";
        searchInput.classList.remove("hide-text");
    }
}

function selectSuggestion(index) {
    searchInput.value = currentSuggestions[index];
    ghostText.textContent = "";
    searchInput.classList.remove("hide-text");
    suggestionList.innerHTML = "";
    suggestionList.style.display = "none";
    searchBtn.click();
}

/*************************************************
 * INPUT + KEYBOARD
 *************************************************/
searchInput.addEventListener("input", () => {
    originalInputValue = searchInput.value;
    ghostText.textContent = "";
    searchInput.classList.remove("hide-text");

    suggestionList.innerHTML = "";
    suggestionList.style.display = "none";
    currentSuggestions = [];
    currentSuggestionIndex = -1;

    if (searchInput.value.length !== 1) return;
    const list = demoSuggestions[searchInput.value];
    if (list) renderSuggestions(list);
});

searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        currentSuggestionIndex >= 0
            ? selectSuggestion(currentSuggestionIndex)
            : searchBtn.click();
        return;
    }

    if (currentSuggestions.length > 0) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            currentSuggestionIndex =
                (currentSuggestionIndex + 1) % currentSuggestions.length;
            updateSuggestionHighlight();
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            currentSuggestionIndex =
                (currentSuggestionIndex - 1 + currentSuggestions.length) %
                currentSuggestions.length;
            updateSuggestionHighlight();
        }
    }
});
