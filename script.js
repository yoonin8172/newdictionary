/*************************************************
 * FIREBASE SETUP (CDN 방식)
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
 * DOM ELEMENTS (기존 이름 유지)
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
const searchBar = document.querySelector(".search-bar");

const imageInput = document.getElementById("imageInput");
const clipBtn = document.querySelector(".clip");
const imagePreview = document.getElementById("imagePreview");

/*************************************************
 * STATE
 *************************************************/
let selectedImageFile = null;

/*************************************************
 * UI HELPERS
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
 * FIRESTORE: 단어 존재 여부 확인
 *************************************************/
async function wordExists(word) {
    const wordRef = doc(db, "words", word);
    const snap = await getDoc(wordRef);
    return snap.exists();
}

/*************************************************
 * FIRESTORE: 정의 불러오기
 *************************************************/
async function loadEntries(word) {
    const entriesRef = collection(db, "words", word, "entries");
    const q = query(entriesRef, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}

/*************************************************
 * FIRESTORE: 텍스트 정의 저장
 *************************************************/
async function addTextEntry(word, text) {
    const entriesRef = collection(db, "words", word, "entries");
    await addDoc(entriesRef, {
        type: "text",
        content: text,
        createdAt: serverTimestamp()
    });
}

/*************************************************
 * STORAGE + FIRESTORE: 이미지 정의 저장
 *************************************************/
async function addImageEntry(word, file) {
    const filename = `${Date.now()}_${file.name}`;
    const imageRef = ref(storage, `words/${word}/${filename}`);

    await uploadBytes(imageRef, file);
    const imageURL = await getDownloadURL(imageRef);

    const entriesRef = collection(db, "words", word, "entries");
    await addDoc(entriesRef, {
        type: "image",
        content: imageURL,
        createdAt: serverTimestamp()
    });
}

/*************************************************
 * SEARCH ACTION
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
    await showResultPage(word);
});

/*************************************************
 * ENTER KEY SEARCH
 *************************************************/
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchBar.classList.add("searching");
        setTimeout(() => {
            searchBar.classList.remove("searching");
            searchBtn.click();
        }, 120);
    }
});

/*************************************************
 * SHOW RESULT PAGE
 *************************************************/
async function showResultPage(word) {
    homeSection.style.display = "none";
    resultSection.style.display = "block";

    wordTitle.textContent = word;
    addForm.style.display = "none";

    const entries = await loadEntries(word);
    renderDefinitions(entries);
}

/*************************************************
 * RENDER DEFINITIONS (텍스트 + 이미지)
 *************************************************/
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
            img.classList.add("definition-image");
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
 * IMAGE SELECT → PREVIEW ONLY
 *************************************************/
clipBtn.addEventListener("click", (e) => {
    e.preventDefault();
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    selectedImageFile = file;

    imagePreview.innerHTML = "";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    imagePreview.appendChild(img);
    imagePreview.style.display = "block";
});

/*************************************************
 * SAVE (TEXT + IMAGE)
 *************************************************/
saveBtn.addEventListener("click", async () => {
    const text = definitionInput.value.trim();
    const word = wordTitle.textContent;

    if (!text && !selectedImageFile) return;

    if (text) {
        await addTextEntry(word, text);
    }

    if (selectedImageFile) {
        await addImageEntry(word, selectedImageFile);
        selectedImageFile = null;
    }

    // 초기화
    definitionInput.value = "";
    imageInput.value = "";
    imagePreview.innerHTML = "";
    imagePreview.style.display = "none";

    addForm.style.display = "none";

    const entries = await loadEntries(word);
    renderDefinitions(entries);
});

/*************************************************
 * HOME BUTTON
 *************************************************/
homeBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    homeSection.style.display = "flex";

    searchInput.value = "";
    hideSearchStatus();
});
