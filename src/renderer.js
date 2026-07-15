const clipboardList = document.querySelector("#clipboard-list");

const history = [];
let lastClipboardText = "";

function addClipboardEntry(text){
    const cleanedText = text.trim();

    if (!cleanedText || cleanedText === lastClipboardText){
        return;
    }

    lastClipboardText = cleanedText;

    history.unshift({
        id: crypto.randomUUID(),
        text: cleanedText,
        copiedAt: new Date()
    });

    renderHistory();
}

function renderHistory(){
    clipboardList.innerHTML = "";

    if (history.length === 0){
        clipboardList.innerHTML = `
            <div class="empty-state">
                <h2>No clipboard history yet</h2>
                <p>Copy some text to create your first entry.</p>
            </div>
        `;
        return;
    }

    for (const entry of history){
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
        addClipboardEntry(text);
    }catch (error) {
        console.error("Could not read clipboard:", error);
    }
}

renderHistory();
checkClipboard();
setInterval(checkClipboard, 750);

