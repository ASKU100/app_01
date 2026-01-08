// st-integration.js - 精简版
(function() {
    'use strict';
    
    console.log('📱 催眠APP扩展集成开始加载...');
    
    // 检查是否在iframe中运行
    if (window !== window.parent) {
        console.log('脚本在iframe中运行，跳过初始化');
        return;
    }
    
    // 主通信接口
    const STInterface = {
        // 发送消息到SillyTavern
        sendUserMessage: async function(message) {
            console.log(`📤 发送消息: ${message.substring(0, 50)}...`);
            
            try {
                // 方法1：直接查找输入框
                const inputElement = this._findInputElement();
                if (inputElement) {
                    inputElement.value = message;
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    const sendButton = this._findSendButton();
                    if (sendButton) {
                        sendButton.click();
                        return { success: true, method: 'direct' };
                    } else {
                        // 尝试回车键
                        inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            bubbles: true
                        }));
                        return { success: true, method: 'keyboard' };
                    }
                }
                
                return { success: false, error: '未找到输入框' };
                
            } catch (error) {
                console.error('发送消息失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        // 从世界书条目获取角色
        getCharacters: async function() {
            console.log('📇 获取角色数据...');
            
            try {
                // 方法1：从世界书变量解析
                const characters = this._parseCharactersFromWorldInfo();
                if (characters.length > 0) {
                    console.log(`从世界书找到 ${characters.length} 个角色`);
                    return characters;
                }
                
                // 方法2：从当前聊天解析
                const chatCharacters = this._parseCharactersFromChat();
                if (chatCharacters.length > 0) {
                    console.log(`从聊天找到 ${chatCharacters.length} 个角色`);
                    return chatCharacters;
                }
                
                // 方法3：默认角色（完全回退）
                console.warn('使用默认角色列表');
                return this._getDefaultCharacters();
                
            } catch (error) {
                console.error('获取角色失败:', error);
                return this._getDefaultCharacters();
            }
        },
        
        // 解析世界书条目中的角色
        _parseCharactersFromWorldInfo: function() {
            const characters = [];
            
            try {
                // 方法1：尝试获取世界书元素
                const worldBookElements = document.querySelectorAll('[data-world-info], .world-book, .worldinfo');
                
                for (const element of worldBookElements) {
                    const text = element.textContent || element.innerText;
                    if (text.includes('角色:') || text.includes('角色/')) {
                        // 解析角色部分
                        const lines = text.split('\n');
                        let inRoleSection = false;
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            
                            if (line === '角色:' || line === '角色/') {
                                inRoleSection = true;
                                continue;
                            }
                            
                            if (inRoleSection && line.includes(':')) {
                                // 可能是新节开始
                                if (line === '任务:' || line === '系统:') {
                                    break;
                                }
                                
                                // 解析角色名和属性
                                const match = line.match(/^([^:]+):\s*(.+)$/);
                                if (match) {
                                    const name = match[1].trim();
                                    const props = match[2];
                                    
                                    characters.push({
                                        name: name,
                                        phone: this._generatePhoneNumber(name),
                                        status: 'online',
                                        avatar: this._generateAvatar(name),
                                        metadata: this._parseRoleProperties(props)
                                    });
                                }
                            }
                        }
                        break;
                    }
                }
                
            } catch (error) {
                console.warn('解析世界书失败:', error);
            }
            
            return characters;
        },
        
        // 从聊天解析角色
        _parseCharactersFromChat: function() {
            const characters = [];
            
            try {
                // 查找当前角色名
                const charName = this.getCurrentCharacter();
                if (charName) {
                    characters.push({
                        name: charName,
                        phone: this._generatePhoneNumber(charName),
                        status: 'online',
                        avatar: this._generateAvatar(charName)
                    });
                }
                
                // 查找其他角色卡
                const charElements = document.querySelectorAll('.character-item, .char-card, [data-character]');
                charElements.forEach(element => {
                    const name = element.textContent || element.getAttribute('data-character');
                    if (name && name.trim()) {
                        const charName = name.trim();
                        if (!characters.some(c => c.name === charName)) {
                            characters.push({
                                name: charName,
                                phone: this._generatePhoneNumber(charName),
                                status: 'offline',
                                avatar: this._generateAvatar(charName)
                            });
                        }
                    }
                });
                
            } catch (error) {
                console.warn('解析聊天角色失败:', error);
            }
            
            return characters;
        },
        
        // 默认角色
        _getDefaultCharacters: function() {
            return [
                { name: '西园寺爱丽莎', phone: '090-1234-0001', status: 'online', avatar: '👑' },
                { name: '月咏深雪', phone: '090-1234-0002', status: 'online', avatar: '❄️' },
                { name: '犬冢夏美', phone: '090-1234-0003', status: 'online', avatar: '🐕' }
            ];
        },
        
        // 解析角色属性
        _parseRoleProperties: function(props) {
            const metadata = {};
            
            try {
                // 简单解析：好感度、警戒度等
                const matches = props.match(/(好感度|警戒度|服从度):\s*(\d+)/g);
                if (matches) {
                    matches.forEach(match => {
                        const [key, value] = match.split(':');
                        if (key && value) {
                            metadata[key.trim()] = parseInt(value.trim());
                        }
                    });
                }
            } catch (error) {
                console.warn('解析角色属性失败:', error);
            }
            
            return metadata;
        },
        
        // 生成手机号
        _generatePhoneNumber: function(name) {
            const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const middle = String((hash * 13) % 10000).padStart(4, '0');
            const end = String((hash * 17) % 10000).padStart(4, '0');
            return `090-${middle}-${end}`;
        },
        
        // 生成头像
        _generateAvatar: function(name) {
            const avatars = ['👑', '❄️', '🐕', '👓', '🌸', '🎀', '🐱', '🦊', '🐰', '🦋'];
            const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return avatars[hash % avatars.length];
        },
        
        // 查找输入框
        _findInputElement: function() {
            const selectors = [
                '#send_textarea',
                'textarea[name="message"]',
                'textarea#message',
                '.chat-input textarea',
                '.message-input textarea',
                'textarea[placeholder*="消息"]',
                'textarea[placeholder*="输入"]',
                'textarea'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element.offsetWidth > 0 || element.offsetHeight > 0) {
                        return element;
                    }
                }
            }
            
            return null;
        },
        
        // 查找发送按钮
        _findSendButton: function() {
            const selectors = [
                '#send_but',
                'button[aria-label*="发送"]',
                '.send-button',
                '.submit-button',
                'button[onclick*="send"]'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element.offsetWidth > 0 || element.offsetHeight > 0) {
                        return element;
                    }
                }
            }
            
            return null;
        },
        
        // 获取当前角色名
        getCurrentCharacter: function() {
            try {
                const nameElements = document.querySelectorAll('.char-name, .character-name, h1, h2');
                for (const element of nameElements) {
                    const text = element.textContent || element.innerText;
                    if (text && text.trim() && text.length < 30) {
                        return text.trim();
                    }
                }
                
                return null;
            } catch (error) {
                return null;
            }
        }
    };
    
    // 监听来自扩展面板的消息
    window.addEventListener('message', function(event) {
        // 安全检查：只接受来自扩展面板的消息
        if (event.origin !== 'https://asku100.github.io') return;
        
        console.log('收到扩展消息:', event.data);
        
        const message = event.data;
        
        if (message.type === 'getCharacters') {
            // 获取角色并回复
            STInterface.getCharacters()
                .then(characters => {
                    event.source.postMessage({
                        type: 'charactersResponse',
                        id: message.id,
                        data: characters
                    }, event.origin);
                })
                .catch(error => {
                    event.source.postMessage({
                        type: 'error',
                        id: message.id,
                        error: error.message
                    }, event.origin);
                });
        } else if (message.type === 'sendMessage') {
            // 发送消息到聊天
            STInterface.sendUserMessage(message.data.message)
                .then(result => {
                    event.source.postMessage({
                        type: 'messageSent',
                        id: message.id,
                        success: result.success
                    }, event.origin);
                })
                .catch(error => {
                    event.source.postMessage({
                        type: 'error',
                        id: message.id,
                        error: error.message
                    }, event.origin);
                });
        } else if (message.type === 'testConnection') {
            // 测试连接
            event.source.postMessage({
                type: 'connectionTest',
                id: message.id,
                success: true
            }, event.origin);
        }
    });
    
    // 初始化
    window.STInterface = STInterface;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #hypnosis-extension-iframe {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✨ ST集成脚本加载完成');
    
})();
