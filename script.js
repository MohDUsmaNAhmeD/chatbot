// Constants and element selections
const API_KEY =  '';
// your API key 'Api key'
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendMessage = document.getElementById('sendMessage');
const newChatBtn = document.getElementById('newChatBtn');
const clearChatBtn = document.getElementById('clearChat');
const toggleThemeBtn = document.getElementById('toggleTheme');
const suggestionsArea = document.getElementById('suggestions');
let isTyping = false;
let typingTimeout;
let lastUserMessage = '';
let lastBotResponse = '';
document.getElementById('logout').addEventListener('click', function() {
    // Remove the token from local storage
    localStorage.removeItem('token');
    
    // Redirect to the login page
    window.location.href = 'login.html';
});
const allSuggestions = [
    "What are the latest advancements in AI?",
    "Explain quantum computing",
    "How can I improve my productivity?",
    "Tell me an interesting science fact",
    "What's the future of blockchain?",
    "Explain string theory in simple terms",
    "Give me a programming tip",
    "How do I improve my leadership skills?"
];

// Function to add a message to the chat area

// Function to add a message to the chat area
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'} animate__animated animate__fadeInUp`;

    if (isUser) {
        messageDiv.textContent = content;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    } else {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-animation';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messageDiv.appendChild(typingDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        messageDiv.appendChild(contentDiv);

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'message-controls';
        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = 'Pause';
        pauseBtn.onclick = () => toggleTyping(messageDiv);
        const regenerateBtn = document.createElement('button');
        regenerateBtn.textContent = 'Regenerate';
        regenerateBtn.onclick = regenerateResponse;
        controlsDiv.appendChild(pauseBtn);
        controlsDiv.appendChild(regenerateBtn);
        messageDiv.appendChild(controlsDiv);

        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Simulate typing effect
        currentMessageDiv = messageDiv;
        isTyping = true;
        setTimeout(() => {
            typeText(content, contentDiv, 20);
        }, 500);
    }
}

// Function to format bot messages
function formatBotMessage(content) {
    // Convert code blocks (```code```) to <pre><code>
    content = content.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

    // Convert inline code (`code`) to <code>
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold (**bold**) to <strong>
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert italic (_italic_) to <em>
    content = content.replace(/_(.+?)_/g, '<em>$1</em>');

    // Convert headings (# Heading) to <h2>, (## Heading) to <h3>, etc.
    content = content.replace(/^###\s(.+)/gm, '<h4>$1</h4>');
    content = content.replace(/^##\s(.+)/gm, '<h3>$1</h3>');
    content = content.replace(/^#\s(.+)/gm, '<h2>$1</h2>');

    // Convert bullet points
    content = content.replace(/^-\s(.+)/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert numbered lists
    content = content.replace(/^\d+\.\s(.+)/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    // Convert line breaks to <br> tags
    content = content.replace(/\n/g, '<br>');

    return `<div class="formatted-content">${content}</div>`;
}
// Function to update suggestions
function updateSuggestions() {
    suggestionsArea.innerHTML = '';
    const shuffledSuggestions = allSuggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
    shuffledSuggestions.forEach(suggestion => {
        const chip = document.createElement('div');
        chip.className = 'suggestion-chip animate__animated animate__fadeIn';
        chip.textContent = suggestion;
        chip.addEventListener('click', () => {
            userInput.value = suggestion;
            handleUserMessage();
        });
        suggestionsArea.appendChild(chip);
    });
}

function showLoadingDots() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-dots animate__animated animate__fadeIn';
    loadingDiv.innerHTML = `
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
    `;
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return loadingDiv;
}

// Function to get Gemini response
async function getGeminiResponse(message) {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
        })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Function to handle user message

// Modified handleUserMessage function
async function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    lastUserMessage = message;
    addMessage(message, true);
    userInput.value = '';
    suggestionsArea.innerHTML = '';

    const loadingDots = showLoadingDots();

    try {
        const response = await getGeminiResponse(message);
        loadingDots.remove();
        lastBotResponse = response;
        addMessage(response);
        updateSuggestions();
    } catch (error) {
        loadingDots.remove();
        addMessage("I apologize, but I encountered an issue processing your request. Could you please try again?");
        console.error('Error:', error);
    }
}

async function regenerateResponse() {
    if (currentMessageDiv) {
        currentMessageDiv.remove();
    }
    const loadingDots = showLoadingDots();

    try {
        const response = await getGeminiResponse(lastUserMessage);
        loadingDots.remove();
        lastBotResponse = response;
        addMessage(response);
    } catch (error) {
        loadingDots.remove();
        addMessage("I apologize, but I encountered an issue regenerating the response. Could you please try again?");
        console.error('Error:', error);
    }
}

// Function to toggle typing
function toggleTyping(messageDiv) {
    isTyping = !isTyping;
    const pauseBtn = messageDiv.querySelector('.message-controls button');
    if (pauseBtn) {
        pauseBtn.textContent = isTyping ? 'Pause' : 'Resume';
    }
    if (isTyping) {
        const contentDiv = messageDiv.querySelector('.message-content');
        typeText(lastBotResponse, contentDiv, 20);
    } else {
        clearTimeout(typingTimeout);
    }
}
// Function to simulate typing animation
function typeText(text, container, speed) {
    const formattedContent = formatBotMessage(text);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedContent;
    const textNodes = getAllTextNodes(tempDiv);
    let currentNodeIndex = 0;
    let currentCharIndex = 0;

    function typeNextChar() {
        if (!isTyping) return;

        if (currentNodeIndex < textNodes.length) {
            const currentNode = textNodes[currentNodeIndex];
            const currentText = currentNode.textContent;

            if (currentCharIndex < currentText.length) {
                const char = currentText[currentCharIndex];
                const charSpan = document.createElement('span');
                charSpan.textContent = char;
                charSpan.style.opacity = '0';
                container.appendChild(charSpan);

                setTimeout(() => {
                    charSpan.style.opacity = '1';
                }, 20);

                currentCharIndex++;
            } else {
                currentNodeIndex++;
                currentCharIndex = 0;
                if (currentNodeIndex < textNodes.length) {
                    container.appendChild(document.createElement('br'));
                }
            }

            typingTimeout = setTimeout(typeNextChar, speed);
        } else {
            container.innerHTML = formattedContent; // Replace with fully formatted content
            chatArea.scrollTop = chatArea.scrollHeight;

            // Remove controls when typing is complete
            if (currentMessageDiv) {
                const controlsDiv = currentMessageDiv.querySelector('.message-controls');
                if (controlsDiv) {
                    controlsDiv.remove();
                }
                currentMessageDiv = null;
            }
        }
    }

    typeNextChar();
}

// Helper function to get all text nodes
function getAllTextNodes(node) {
    const textNodes = [];
    const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let currentNode;
    while (currentNode = walk.nextNode()) {
        textNodes.push(currentNode);
    }
    return textNodes;
}

// Event listeners
sendMessage.addEventListener('click', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
});

newChatBtn.addEventListener('click', () => {
    chatArea.innerHTML = '<div class="bot-message chat-message animate__animated animate__fadeInUp">Welcome to a new chat! How can I help you today?</div>';
    updateSuggestions();
});

clearChatBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
        chatArea.innerHTML = '<div class="bot-message chat-message animate__animated animate__fadeInUp">Chat cleared. How else can I assist you?</div>';
        updateSuggestions();
    }
});

toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-theme'));
});

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
        switch (item.id) {
            case 'newChat':
                newChatBtn.click();
                break;
            case 'viewHistory':
            case 'createAgent':
            case 'playground':
                alert(`${item.id.charAt(0).toUpperCase() + item.id.slice(1)} feature is under development.`);
                break;
            case 'toggleTheme':
                toggleThemeBtn.click();
                break;
            default:
                console.log('Unknown sidebar action');
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-theme');
    }
    updateSuggestions();

});
