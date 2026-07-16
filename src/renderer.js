const clipboardList = document.querySelector("#clipboard-list");
const searchInput = document.querySelector("#search-input");
const clearButton = document.querySelector("#clear-button");
const pauseButton = document.querySelector("#pause-button");


let isPaused = false;
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
            copiedAt: new Date(),
            pinned: false
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
            pinned: entry.pinned ?? false,
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

    const filteredHistory = history
        .filter((entry) =>
            entry.text.toLowerCase().includes(searchQuery)
    )
    .sort((a, b) => {
        if (a.pinned !== b.pinned){
            return Number(b.pinned) - Number(a.pinned);
        }

        return b.copiedAt.getTime() - a.copiedAt.getTime();
    });

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

        if (entry.pinned){
            card.classList.add("is-pinned");
        }

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


        const pinButton = document.createElement("button");
        pinButton.type = "button";
        pinButton.className = "pin-button";
        pinButton.textContent = entry.pinned ? "Unpin" : "Pin";
        pinButton.classList.toggle("is-active", entry.pinned);
        pinButton.setAttribute(
            "aria-label",
            entry.pinned
                ? "Unpin clipboard entry"
                : "Pin clipboard entry"
        );

        pinButton.addEventListener("click", async () => {
            entry.pinned = !entry.pinned;

            await saveHistory();
            renderHistory();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            history = history.filter((item) => item.id !== entry.id);

            if (entry.text === lastClipboardText){
                lastClipboardText = await window.clipflow.getClipboardText();
            }

            await saveHistory();
            renderHistory();
        });

        const actions = document.createElement("div");
        actions.className = "clipboard-actions";

        actions.append(pinButton, copyButton, deleteButton);
        footer.append(time, actions);

        card.append(content, footer);
        clipboardList.append(card);
    }
}

async function checkClipboard() {
    
    if (isPaused){
        return;
    }

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
    history = history.filter((entry) => entry.pinned);


    searchQuery = "";
    searchInput.value = "";


    await saveHistory();
    renderHistory();
});

pauseButton.addEventListener("click", async () => {
    isPaused = !isPaused;

    if (!isPaused){
        const currentClipboard = 
            await window.clipflow.getClipboardText();

        lastClipboardText = currentClipboard.trim();
    }

    pauseButton.textContent = isPaused
        ? "Resume"
        : "Pause";

    pauseButton.setAttribute(
        "aria-pressed",
        String(isPaused)
    );

    pauseButton.classList.toggle(
        "is-paused",
        isPaused
    );
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

