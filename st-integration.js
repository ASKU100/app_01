// 更新您的 st-integration.js 文件
(function() {
    'use strict';
    
    // 创建通信桥梁 - 增强版
    window.STInterface = {
        sendUserMessage: function(message) {
            console.log('📱 扩展发送消息:', message);
            
            // 方法1：尝试各种可能的输入框
            const inputSelectors = [
                '#send_textarea',
                'textarea[name="message"]',
                '.meshrp-text-input',
                '.chat-input',
                '.message-input',
                'textarea'
            ];
            
            let inputFound = null;
            for (const selector of inputSelectors) {
                const input = document.querySelector(selector);
                if (input && input.offsetParent !== null) {
                    inputFound = input;
                    break;
                }
            }
            
            if (inputFound) {
                // 设置消息
                inputFound.value = message;
                inputFound.dispatchEvent(new Event('input', { bubbles: true }));
                inputFound.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 触发发送按钮
                setTimeout(() => {
                    const sendSelectors = [
                        '#send_but',
                        'button[aria-label="发送"]',
                        '.meshrp-send-button',
                        '.send-button',
                        'button:contains("发送")'
                    ];
                    
                    for (const selector of sendSelectors) {
                        const btn = document.querySelector(selector);
                        if (btn && btn.offsetParent !== null) {
                            btn.click();
                            console.log('✅ 消息已发送');
                            return true;
                        }
                    }
                    
                    // 如果找不到按钮，尝试回车键
                    const keyEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    });
                    inputFound.dispatchEvent(keyEvent);
                    
                }, 100);
                return true;
            }
            
            console.warn('⚠️ 未找到输入框');
            return false;
        },
        
        getCharacterResponse: function(callback) {
            // 监听AI回复
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            // 检查是否是AI消息
                            if (node.nodeType === 1) {
                                const aiSelectors = [
                                    '.mes_text:not(:has(.mes_name))',
                                    '.message-ai',
                                    '.ai-response',
                                    '[class*="ai"]:not([class*="user"])'
                                ];
                                
                                let aiMessage = null;
                                for (const selector of aiSelectors) {
                                    const element = node.querySelector?.(selector) || 
                                                   (node.matches?.(selector) ? node : null);
                                    if (element) {
                                        aiMessage = element.textContent || element.innerText;
                                        break;
                                    }
                                }
                                
                                if (aiMessage && !aiMessage.includes('[玩家]') && !aiMessage.includes('User:')) {
                                    callback(aiMessage.trim());
                                }
                            }
                        });
                    }
                });
            });
            
            // 观察消息容器
            const containerSelectors = [
                '#meshrp-chat',
                '.chat-container',
                '.messages-container',
                '#chat'
            ];
            
            for (const selector of containerSelectors) {
                const container = document.querySelector(selector);
                if (container) {
                    observer.observe(container, { 
                        childList: true, 
                        subtree: true,
                        characterData: true 
                    });
                    console.log('🔍 开始监听AI回复');
                    break;
                }
            }
        },
        
        // 新功能：获取当前角色
        getCurrentCharacter: function() {
            const nameSelectors = [
                '.char_name',
                '.character-name',
                '.name-display',
                'h1, h2, h3'
            ];
            
            for (const selector of nameSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent && element.textContent.length < 50) {
                    return element.textContent.trim();
                }
            }
            return null;
        },
        
        // 新功能：显示通知
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#48bb78' : type === 'warning' ? '#ed8936' : type === 'error' ? '#f56565' : '#4299e1'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 99999;
                font-size: 14px;
                animation: slideIn 0.3s ease;
            `;
            
            notification.textContent = `📱 ${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
            // 添加动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    console.log('✨ 催眠APP扩展集成已加载 - 增强版');
    
    // 自动注入CSS样式（可选）
    const style = document.createElement('style');
    style.textContent = `
        .hypnosis-extension-btn {
            position: fixed;
            bottom: 90px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 22px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .hypnosis-extension-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
    `;
    document.head.appendChild(style);
    
})();
