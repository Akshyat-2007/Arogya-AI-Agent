// Chat Handler for Nutrition Agent
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatWindow = document.getElementById('chatWindow');
    const memberSelect = document.getElementById('chatMemberSelect');

    let currentMemberId = memberSelect ? memberSelect.value : null;

    // Load Initial Chats
    if (currentMemberId) {
        loadChatHistory(currentMemberId);
    }

    // Switch member context
    if (memberSelect) {
        memberSelect.addEventListener('change', (e) => {
            currentMemberId = e.target.value;
            // Update URL query param quietly or reload
            const url = new URL(window.location);
            url.searchParams.set('member_id', currentMemberId);
            window.history.pushState({}, '', url);
            loadChatHistory(currentMemberId);
        });
    }

    // Submit message handler
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageText = chatInput.value.trim();
            if (!messageText || !currentMemberId) return;

            // Clear input
            chatInput.value = '';

            // 1. Add User bubble to chat window
            appendMessage('user', messageText);
            scrollToBottom();

            // 2. Add Typing Indicator
            const typingIndicator = appendTypingIndicator();
            scrollToBottom();

            try {
                const response = await fetch(`/api/members/${currentMemberId}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageText }),
                });

                const data = await response.json();
                
                // Remove Typing Indicator
                typingIndicator.remove();

                if (response.ok) {
                    // 3. Add Agent bubble to chat window
                    appendMessage('agent', data.agent_message.message);
                } else {
                    appendMessage('agent', `⚠️ Error: ${data.error || 'Failed to process message.'}`);
                }
            } catch (err) {
                if (typingIndicator) typingIndicator.remove();
                appendMessage('agent', `⚠️ Failed to reach the server. Please check your connection.`);
                console.error(err);
            }
            scrollToBottom();
        });
    }

    // Fetch and render chat history
    async function loadChatHistory(memberId) {
        chatWindow.innerHTML = '<div class="text-center opacity-75 py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading chat history...</div>';
        
        try {
            const response = await fetch(`/api/members/${memberId}/chats`);
            const chats = await response.json();
            
            chatWindow.innerHTML = '';
            
            if (chats.length === 0) {
                chatWindow.innerHTML = `
                    <div class="text-center opacity-75 my-5">
                        <i class="fas fa-comments fa-3x mb-3 text-grad-primary"></i>
                        <p class="h5">Start your conversation!</p>
                        <p class="small text-secondary">Ask Arogya AI anything about diets, recipes, macros, or weight management.</p>
                    </div>
                `;
            } else {
                chats.forEach(chat => {
                    appendMessage(chat.sender, chat.message);
                });
            }
            scrollToBottom();
        } catch (err) {
            chatWindow.innerHTML = '<div class="alert alert-danger mx-3 my-3">Failed to load chat history.</div>';
            console.error(err);
        }
    }

    // Helper: Append a message bubble to window
    function appendMessage(sender, text) {
        const container = document.createElement('div');
        container.className = `chat-bubble-container ${sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        // Parse markdown formatting
        bubble.innerHTML = parseMarkdown(text);
        
        container.appendChild(bubble);
        chatWindow.appendChild(container);
    }

    // Helper: Append typing indicator
    function appendTypingIndicator() {
        const container = document.createElement('div');
        container.className = 'chat-bubble-container agent';
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        
        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        
        bubble.appendChild(dots);
        container.appendChild(bubble);
        chatWindow.appendChild(container);
        return container;
    }

    // Helper: Scroll chat window to bottom
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Vanilla Markdown Parser (handles headers, bold, bullet lists, basic tables, linebreaks)
    function parseMarkdown(md) {
        if (!md) return '';
        
        let html = md;
        
        // Escape HTML to prevent injection (excluding what we format)
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Restore formatting chars
        // Parse Tables (very basic markdown table support)
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHtml = '<div class="table-responsive"><table class="table table-sm my-2">';
                }
                
                const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
                
                // Check if it's separator line
                if (line.includes('---')) {
                    continue; 
                }
                
                const isHeader = !line.includes('---') && (i === 0 || !lines[i-1].trim().startsWith('|'));
                
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    const tag = isHeader ? 'th' : 'td';
                    tableHtml += `<${tag}>${parseInlineMarkdown(cell)}</${tag}>`;
                });
                tableHtml += '</tr>';
            } else {
                if (inTable) {
                    inTable = false;
                    tableHtml += '</table></div>';
                    lines[i-1] = tableHtml; // replace last table line with fully assembled table
                }
            }
        }
        if (inTable) {
            tableHtml += '</table></div>';
            lines[lines.length - 1] = tableHtml;
        }
        
        html = lines.join('\n');

        // Parse Block Elements (Headers and Lists)
        const linesBlock = html.split('\n');
        let inList = false;
        
        for (let i = 0; i < linesBlock.length; i++) {
            let line = linesBlock[i];
            
            // Skip table blocks that were parsed
            if (line.startsWith('<div class="table-responsive">') || line.startsWith('<tr>') || line.startsWith('</table>')) {
                continue;
            }

            // Headers
            if (line.startsWith('### ')) {
                linesBlock[i] = `<h5 class="mt-3 mb-2 font-heading font-weight-bold text-grad-primary">${line.substring(4)}</h5>`;
            } else if (line.startsWith('## ')) {
                linesBlock[i] = `<h4 class="mt-3 mb-2 font-heading font-weight-bold text-grad-primary">${line.substring(3)}</h4>`;
            } else if (line.startsWith('# ')) {
                linesBlock[i] = `<h3 class="mt-3 mb-2 font-heading font-weight-bold text-grad-primary">${line.substring(2)}</h3>`;
            }
            // Bullet Lists
            else if (line.startsWith('* ') || line.startsWith('- ')) {
                let content = line.substring(2);
                if (!inList) {
                    inList = true;
                    linesBlock[i] = `<ul class="mb-2"><li>${parseInlineMarkdown(content)}</li>`;
                } else {
                    linesBlock[i] = `<li>${parseInlineMarkdown(content)}</li>`;
                }
            } else {
                if (inList) {
                    inList = false;
                    linesBlock[i-1] = linesBlock[i-1] + '</ul>';
                }
                // Regular Paragraph line, if not empty
                if (line.trim() !== '') {
                    // Check if line contains a warning/disclaimer and style it
                    if (line.includes('Disclaimer:') || line.includes('warning') || line.includes('⚠️')) {
                        linesBlock[i] = `<p class="small text-warning border-start border-warning ps-2 py-1 my-2 bg-warning-subtle rounded-end">${parseInlineMarkdown(line)}</p>`;
                    } else {
                        linesBlock[i] = `<p class="mb-2">${parseInlineMarkdown(line)}</p>`;
                    }
                }
            }
        }
        
        if (inList) {
            linesBlock[linesBlock.length - 1] = linesBlock[linesBlock.length - 1] + '</ul>';
        }

        return linesBlock.join('\n');
    }

    // Helper: Inline Markdown (bold, italic, code)
    function parseInlineMarkdown(text) {
        return text
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Code
            .replace(/`(.*?)`/g, "<code>$1</code>");
    }
});
