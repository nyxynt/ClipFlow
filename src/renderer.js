const clipboardList = document.querySelector("#clipboard-list");
const searchInput = document.querySelector("#search-input");
const clearButton = document.querySelector("#clear-button");

let searchQuery = "";



let history = [];
let lastClipboardText = "";

async function addClipboardEntry(text){
    const cleanedText = text.trim();

    if (!cleanedText || cleanedText === lastClipboardText){
        return;
    }

    lastClipboardText = cleanedText;

    const existingIndex = history.findIndex(
        (entry) => entry.text === cleanedText
    );

    if (existingIndex !== -1){
        const [existingEntry] = history.splice(existingIndex, 1);

        history.unshift({
            ...existingEntry,
            copiedAt: new Date()
        });
    }else {
        history.unshift({
            id: crypto.randomUUID(),
            text: cleanedText,
            copiedAt: new Date()
    });
}




    await saveHistory();
    renderHistory();
}


async function saveHistory() {
    const serializableHistory = history.map((entry) => ({
        ...entry,
        copiedAt: entry.copiedAt.toISOString()
    }));

    await window.clipflow.saveHistory(serializableHistory);
}

async function loadHistory() {
    const savedHistory = await window.clipflow.loadHistory();

    history = Array.isArray(savedHistory)
        ? savedHistory.map((entry) => ({
            ...entry,
            copiedAt: new Date(entry.copiedAt)
        }))
        : [];

    lastClipboardText = history.length > 0
        ? history[0].text
        : "";

    renderHistory();
}


function renderHistory(){
    clipboardList.innerHTML = "";

    const filteredHistory = history.filter((entry) => 
        entry.text.toLowerCase().includes(searchQuery)
    );

    const hasSearchQuery = searchQuery.length > 0;

    if (filteredHistory.length === 0){
        clipboardList.innerHTML = `
            <div class="empty-state">
                <h2>
                    ${hasSearchQuery
                        ? "No matching entries"
                        : "No clipboard history yet"}
                </h2>

                <p>
                    ${hasSearchQuery
                        ? "Try searching for something else."
                        : "Copy some text to create your first entry."}
                </p>
            </div>
        `;

        return;
    }

    for (const entry of filteredHistory){
        const card = document.createElement("article");
        card.className = "clipboard-entry";

        const content = document.createElement("p");
        content.className = "clipboard-content";
        content.textContent = entry.text;

        const footer = document.createElement("div");
        footer.className = "clipboard-footer";


        const time = document.createElement("small");
        time.textContent = entry.copiedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.textContent = "Copy";

        copyButton.addEventListener("click", async () => {
            await window.clipflow.writeClipboardText(entry.text);

            copyButton.textContent = "Copied";

            setTimeout(() => {
                copyButton.textContent = "Copy";

            }, 1000);
        });

        footer.append(time, copyButton);
        card.append(content, footer);
        clipboardList.append(card);
    }
}

async function checkClipboard() {
    try {
        const text = await window.clipflow.getClipboardText();
        await addClipboardEntry(text);
    }catch (error) {
        console.error("Could not read clipboard:", error);
    }
}

searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderHistory();
});

clearButton.addEventListener("click", async () => {
    history = [];
    searchQuery = "";
    searchInput.value = "";


    await saveHistory();
    renderHistory();
});


document.addEventListener("keydown", (event) => {
    const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

    if (isSearchShortcut){
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
    }

    if (event.key === "Escape" && document.activeElement === searchInput){
        searchInput.value = "";
        searchQuery = "";
        searchInput.blur();
        renderHistory();
    }
});


async function init() {
    try {
        await loadHistory();
        await checkClipboard();

        setInterval(checkClipboard, 750);
    } catch (error) {
        console.error("Could not initialize ClipFlow:", error);
    }
}

init();

