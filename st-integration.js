// SillyTavern集成脚本
// 在SillyTavern中通过用户脚本或扩展加载

(function() {
    'use strict';
    
    // 创建通信桥梁
    window.STInterface = {
        sendUserMessage: function(message) {
            // 找到SillyTavern的输入框
            const input = document.querySelector('#send_textarea, textarea[name="message"], .meshrp-text-input');
            if (input) {
                // 设置消息
                input.value = message;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 触发发送按钮
                setTimeout(() => {
                    const sendBtn = document.querySelector('#send_but, button[aria-label="发送"], .meshrp-send-button');
                    if (sendBtn) {
                        sendBtn.click();
                    }
                }, 100);
                return true;
            }
            return false;
        },
        
        getCharacterResponse: function(callback) {
            // 监听新消息（简化版）
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.classList && node.classList.contains('meshrp-message')) {
                                // 找到AI回复
                                const aiMsg = node.querySelector('.mes_text, .message-content');
                                if (aiMsg && !aiMsg.textContent.includes('[玩家]')) {
                                    callback(aiMsg.textContent);
                                }
                            }
                        });
                    }
                });
            });
            
            // 观察消息容器
            const container = document.querySelector('#meshrp-chat, .chat-container');
            if (container) {
                observer.observe(container, { childList: true, subtree: true });
            }
        }
    };
    
    console.log('催眠APP扩展集成已加载');
})();