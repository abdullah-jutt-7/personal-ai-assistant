const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const conversationList = document.getElementById("conversationList");
const newChatBtn = document.getElementById("newChatBtn");

let currentConversation = [];
let currentConversationId = null;
let chatCounter = 0; // Tracks sidebar numbering like Chat 1, 2, 3

// ---------- Append message ----------
function appendMessage(sender, message, typing=false) {
    const div = document.createElement("div");
    div.classList.add(typing ? "typing-msg" : sender === "user" ? "user-msg" : "ai-msg");

    if (!typing && sender === "ai") {
        div.innerHTML = marked.parse(message);
    } else {
        div.innerHTML = typing ? `<span>🤖<span class="typing-dots"><span>typing be patient...</span></span></span>`
                               : `<span>${message}</span>`;
    }

    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
    return div;
}

// ---------- Send message ----------
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (!currentConversationId) {
        alert("Please start a new chat or select an existing conversation first.");
        return;
    }

    console.log('hitting the button');
    appendMessage("user", message);
    currentConversation.push({ sender:"user", message });
    userInput.value = "";

    const typingDiv = appendMessage("ai", "", true);

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, conversation_id: currentConversationId })
        });
        const data = await response.json();
        typingDiv.remove();

        appendMessage("ai", data.response || "AI did not respond!");
        currentConversation.push({ sender:"ai", message: data.response });

    } catch (err) {
        typingDiv.remove();
        appendMessage("ai", "Error: Could not connect to AI backend.");
        console.error(err);
    }
}

// ---------- Load all conversations ----------
async function loadConversations() {
    const res = await fetch("http://127.0.0.1:5000/api/conversations");
    const data = await res.json();
    conversationList.innerHTML = "";
    chatCounter = 0;

    data.forEach(conv => {
        chatCounter++;
        const li = document.createElement("li");
        li.textContent = conv.title || `Chat ${conv.conversation_id}`;
        li.dataset.id = conv.conversation_id;

        li.onclick = () => switchConversation(conv.conversation_id);
        conversationList.appendChild(li);
    });
}

// ---------- Switch conversation (with reload) ----------
async function switchConversation(conversation_id) {
    // reload page to clear chat area
    location.href = window.location.pathname + `?conversation_id=${conversation_id}`;
}

// ---------- Load specific conversation ----------
async function loadChat(conversation_id) {
    const res = await fetch(`http://127.0.0.1:5000/api/conversations/${conversation_id}`);
    const data = await res.json();

    chatbox.innerHTML = "";
    data.forEach(msg => appendMessage(msg.sender, msg.message));

    currentConversation = data;
    currentConversationId = conversation_id;
}

// ---------- New chat ----------
newChatBtn.addEventListener("click", async () => {
    chatbox.innerHTML = "";
    currentConversation = [];

    const res = await fetch("http://127.0.0.1:5000/api/new_conversation", { method: "POST" });
    const data = await res.json();
    currentConversationId = data.conversation_id;

    chatCounter++;
    const li = document.createElement("li");
    li.textContent = `New Chat...`;
    li.dataset.id = currentConversationId;
    li.onclick = () => switchConversation(currentConversationId);
    conversationList.appendChild(li);
});

// ---------- Send on Enter ----------
userInput.addEventListener("keypress", function(e){
    if(e.key === "Enter") sendMessage();
});

// ---------- Initialize ----------
window.addEventListener("load", async () => {
    await loadConversations();

    // If URL has conversation_id query, load it
    const urlParams = new URLSearchParams(window.location.search);
    const convId = urlParams.get("conversation_id");
    if (convId) loadChat(convId);
});

// ---------- Upload File & Pseudo-Training Logic ----------
const uploadInput = document.getElementById("uploadInput");
const trainBtn = document.getElementById("trainBtn");
const trainingStatusContainer = document.getElementById("trainingStatusContainer");
const trainingStatusText = document.getElementById("trainingStatusText");
const trainingTimeText = document.getElementById("trainingTimeText");
const trainProgressBar = document.getElementById("trainProgressBar");

let pollingInterval = null;

if (uploadInput) {
    uploadInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            const res = await fetch("http://127.0.0.1:5000/api/upload_dataset", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert("File parsed and successfully appended to training dataset!");
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (err) {
            alert("Upload error.");
            console.error(err);
        }
    });
}

if (trainBtn) {
    trainBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("http://127.0.0.1:5000/api/start_training", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                trainingStatusContainer.style.display = "block";
                pollTraining();
                pollingInterval = setInterval(pollTraining, 2000);
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Training start error.");
            console.error(err);
        }
    });
}

async function pollTraining() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/training_status");
        const data = await res.json();
        
        trainingStatusText.textContent = data.status || "Training...";
        trainingTimeText.textContent = data.time_left || "";
        trainProgressBar.style.width = data.progress + "%";
        
        if (data.status === "Completed") {
            clearInterval(pollingInterval);
            setTimeout(() => {
                trainingStatusContainer.style.display = "none";
                trainProgressBar.style.width = "0%";
            }, 5000);
        }
    } catch (err) {
        console.error("Polling error", err);
    }
}
