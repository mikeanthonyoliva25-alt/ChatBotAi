const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', () => {
    const userMessage = userInput.value;
    if (userMessage.trim() !== '') {
        displayMessage(userMessage, 'user');
        userInput.value = '';
        generateResponse(userMessage);
    }
});

function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = sender === 'user' ? 'user-message' : 'ai-message';
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
}

function generateResponse(userMessage) {
    // Placeholder for AI response generation logic
    const aiResponse = `You said: "${userMessage}". This is where the AI would generate a response based on your input.`;
    displayMessage(aiResponse, 'ai');
}