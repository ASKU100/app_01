// st-integration.js - 催眠APP与SillyTavern集成脚本
(function() {
    'use strict';
    
    console.log('📱 催眠APP扩展集成开始加载...');
    
    // ================================
    // 配置
    // ================================
    const CONFIG = {
        appName: '催眠APP扩展',
        version: '1.1.0', // 更新版本号
        debug: true,
        timeout: 10000, // 10秒超时
        retryDelay: 500, // 重试延迟
        maxRetries: 10   // 最大重试次数
    };
    
    // ================================
    // 核心通信桥梁
    // ================================
    const STInterface = {
        // 发送消息到SillyTavern（优先使用酒馆助手API）
        sendUserMessage: async function(message, metadata = {}) {
            console.log(`📤 发送消息: ${message.substring(0, 50)}...`);
            
            try {
                // 方法1：优先使用酒馆助手API（更稳定）
                if (await this._trySendViaTavernHelper(message, metadata)) {
                    this.showNotification('消息已发送（通过酒馆助手）', 'success');
                    return { success: true, method: 'tavern-helper' };
                }
                
                // 方法2：回退到DOM操作
                if (this._trySendViaDOM(message)) {
                    this.showNotification('消息已发送（通过DOM）', 'success');
                    return { success: true, method: 'dom' };
                }
                
                // 方法3：尝试其他可能的输入框
                if (this._tryAlternativeMethods(message)) {
                    this.showNotification('消息已发送（通过备选方法）', 'success');
                    return { success: true, method: 'alternative' };
                }
                
                this.showNotification('发送失败：未找到输入框', 'error');
                return { success: false, error: '未找到输入框' };
                
            } catch (error) {
                console.error('发送消息时出错:', error);
                this.showNotification(`发送失败: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // 尝试通过酒馆助手API发送消息
        _trySendViaTavernHelper: async function(message, metadata) {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    if (CONFIG.debug) console.warn('⚠️ 酒馆助手未找到，跳过API发送');
                    return false;
                }
                
                const TH = window.parent.TavernHelper;
                
                // 创建聊天消息
                await TH.createChatMessages([{
                    role: 'user',
                    message: message,
                    data: {
                        source: 'hypnosis_app',
                        type: 'sms',
                        timestamp: new Date().toISOString(),
                        ...metadata
                    }
                }]);
                
                // 延迟后触发AI回复
                setTimeout(() => {
                    TH.triggerSlash('/trigger').catch(e => {
                        console.warn('触发AI回复失败:', e);
                    });
                }, 300);
                
                return true;
                
            } catch (error) {
                console.warn('酒馆助手API发送失败:', error);
                return false;
            }
        },
        
        // 通过DOM操作发送消息
        _trySendViaDOM: function(message) {
            try {
                // 常见输入框选择器（按优先级排序）
                const inputSelectors = [
                    '#send_textarea',
                    'textarea[name="message"]',
                    'textarea#message',
                    '.chat-input textarea',
                    '.message-input',
                    '.mes_text:last-child textarea',
                    'textarea[placeholder*="消息"]',
                    'textarea[placeholder*="输入"]'
                ];
                
                let inputElement = null;
                
                // 查找可用的输入框
                for (const selector of inputSelectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        if (this._isVisible(element)) {
                            inputElement = element;
                            break;
                        }
                    }
                    if (inputElement) break;
                }
                
                if (!inputElement) {
                    console.warn('未找到可见的输入框');
                    return false;
                }
                
                // 设置消息
                inputElement.value = message;
                
                // 触发事件
                this._dispatchEvent(inputElement, 'input');
                this._dispatchEvent(inputElement, 'change');
                
                // 查找并点击发送按钮
                const sendButton = this._findSendButton();
                if (sendButton) {
                    sendButton.click();
                    console.log('✅ 通过DOM发送成功');
                    return true;
                }
                
                // 如果找不到按钮，尝试模拟回车键
                console.log('尝试模拟回车键发送');
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true,
                    cancelable: true
                });
                inputElement.dispatchEvent(enterEvent);
                
                return true;
                
            } catch (error) {
                console.error('DOM发送失败:', error);
                return false;
            }
        },
        
        // 备选发送方法
        _tryAlternativeMethods: function(message) {
            try {
                // 方法1：尝试execCommand（旧浏览器）
                if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
                    document.activeElement.value = message;
                    document.execCommand('insertText', false, message);
                    return true;
                }
                
                // 方法2：尝试contenteditable区域
                const editable = document.querySelector('[contenteditable="true"]');
                if (editable) {
                    editable.textContent = message;
                    editable.dispatchEvent(new Event('input', { bubbles: true }));
                    return true;
                }
                
                return false;
            } catch (error) {
                console.warn('备选方法失败:', error);
                return false;
            }
        },
        
        // 查找发送按钮
        _findSendButton: function() {
            const buttonSelectors = [
                '#send_but',
                'button[aria-label*="发送"]',
                'button:contains("发送")',
                '.send-button',
                '.submit-button',
                '.btn-send',
                'button[title*="发送"]'
            ];
            
            for (const selector of buttonSelectors) {
                try {
                    const buttons = document.querySelectorAll(selector);
                    for (const button of buttons) {
                        if (this._isVisible(button)) {
                            return button;
                        }
                    }
                } catch (e) {
                    // 忽略选择器错误
                }
            }
            
            // 尝试通过文本内容查找
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                if (button.textContent && button.textContent.includes('发送') && this._isVisible(button)) {
                    return button;
                }
            }
            
            return null;
        },
        
        // 检查元素是否可见
        _isVisible: function(element) {
            if (!element) return false;
            return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        },
        
        // 触发DOM事件
        _dispatchEvent: function(element, eventName) {
            const event = new Event(eventName, {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
        },
        
        // ================================
        // 角色管理 - 增强版
        // ================================
        
        // 获取角色列表（从[initvar]变量）
        getCharacters: async function() {
            try {
                console.log('📇 开始获取角色列表...');
                
                // 方法1：尝试从酒馆助手变量直接获取
                const directChars = await this._getCharactersDirectFromTavern();
                if (directChars && directChars.length > 0) {
                    console.log(`✅ 直接加载了 ${directChars.length} 个角色`);
                    return directChars;
                }
                
                // 方法2：尝试从酒馆助手API获取
                const apiChars = await this._getCharactersFromTavernHelper();
                if (apiChars && apiChars.length > 0) {
                    console.log(`✅ 通过API加载了 ${apiChars.length} 个角色`);
                    return apiChars;
                }
                
                // 方法3：从聊天记录中提取角色
                const extractedChars = await this._extractCharactersFromChat();
                if (extractedChars.length > 0) {
                    console.log(`✅ 从聊天记录提取了 ${extractedChars.length} 个角色`);
                    return extractedChars;
                }
                
                // 方法4：备用方案：从DOM解析
                const fallbackCharacters = this._getCharactersFromDOM();
                if (fallbackCharacters.length > 0) {
                    console.log(`📇 从DOM加载了 ${fallbackCharacters.length} 个角色`);
                    return fallbackCharacters;
                }
                
                // 默认角色（完全回退）
                console.warn('使用默认角色列表');
                return this._getDefaultCharacters();
                
            } catch (error) {
                console.error('获取角色失败:', error);
                return this._getDefaultCharacters();
            }
        },
        
        // 从酒馆助手变量直接获取角色
        _getCharactersDirectFromTavern: async function() {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    throw new Error('酒馆助手未找到');
                }
                
                const TH = window.parent.TavernHelper;
                
                // 等待酒馆助手初始化
                await this._waitForTavernHelper();
                
                // 获取聊天变量 - 使用更可靠的变量访问方式
                let variables;
                try {
                    variables = TH.getVariables({ type: 'chat' });
                } catch (e) {
                    // 尝试备用方法
                    variables = TH.getChatVariables ? TH.getChatVariables() : null;
                }
                
                if (!variables) {
                    throw new Error('未获取到变量');
                }
                
                console.log('获取到的变量结构:', variables);
                
                // 尝试多种可能的变量路径
                let roleData = null;
                
                // 路径1: stat_data.角色
                if (variables.stat_data && variables.stat_data.角色) {
                    roleData = variables.stat_data.角色;
                }
                // 路径2: stat_data.characters
                else if (variables.stat_data && variables.stat_data.characters) {
                    roleData = variables.stat_data.characters;
                }
                // 路径3: 直接查找角色数据
                else if (variables.角色) {
                    roleData = variables.角色;
                }
                // 路径4: characters
                else if (variables.characters) {
                    roleData = variables.characters;
                }
                // 路径5: 查找任何包含"角色"或"character"的键
                else {
                    const keys = Object.keys(variables);
                    for (const key of keys) {
                        if (key.includes('角色') || key.includes('character')) {
                            roleData = variables[key];
                            break;
                        }
                    }
                }
                
                if (!roleData) {
                    throw new Error('未找到角色变量');
                }
                
                const characters = [];
                
                // 转换格式 - 处理数组或对象格式
                if (Array.isArray(roleData)) {
                    roleData.forEach((item, index) => {
                        const name = item.name || item.名称 || `角色${index + 1}`;
                        characters.push({
                            name: name,
                            phone: this._generatePhoneNumber(name),
                            status: this._generateStatus(name),
                            avatar: this._generateAvatar(name),
                            metadata: {
                                好感度: item.好感度 || item.favor || 0,
                                警戒度: item.警戒度 || item.alertness || 0,
                                服从度: item.服从度 || item.obedience || 0,
                                ...item
                            }
                        });
                    });
                } else {
                    // 对象格式
                    Object.entries(roleData).forEach(([name, data]) => {
                        characters.push({
                            name: name,
                            phone: this._generatePhoneNumber(name),
                            status: this._generateStatus(name),
                            avatar: this._generateAvatar(name),
                            metadata: {
                                好感度: data.好感度 || data.favor || 0,
                                警戒度: data.警戒度 || data.alertness || 0,
                                服从度: data.服从度 || data.obedience || 0,
                                ...data
                            }
                        });
                    });
                }
                
                return characters;
                
            } catch (error) {
                console.warn('从酒馆助手直接获取角色失败:', error.message);
                return null;
            }
        },
        
        // 从酒馆助手API获取角色
        _getCharactersFromTavernHelper: async function() {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    throw new Error('酒馆助手未找到');
                }
                
                const TH = window.parent.TavernHelper;
                
                // 等待酒馆助手初始化
                await this._waitForTavernHelper();
                
                // 获取聊天变量
                const variables = TH.getVariables({ type: 'chat' });
                if (!variables || !variables.stat_data || !variables.stat_data.角色) {
                    throw new Error('未找到角色变量');
                }
                
                const roleData = variables.stat_data.角色;
                const characters = [];
                
                // 转换格式
                Object.entries(roleData).forEach(([name, data]) => {
                    characters.push({
                        name: name,
                        phone: this._generatePhoneNumber(name),
                        status: this._generateStatus(name),
                        avatar: this._generateAvatar(name),
                        metadata: {
                            好感度: data.好感度 || 0,
                            警戒度: data.警戒度 || 0,
                            服从度: data.服从度 || 0
                        }
                    });
                });
                
                return characters;
                
            } catch (error) {
                console.warn('从酒馆助手API获取角色失败:', error.message);
                return null;
            }
        },
        
        // 从聊天记录中提取角色
        _extractCharactersFromChat: async function() {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    return [];
                }
                
                const TH = window.parent.TavernHelper;
                const characters = [];
                const foundNames = new Set();
                
                // 获取最近的聊天消息
                const recentMessages = TH.getChatMessages(-10, { include_swipes: false });
                
                if (!recentMessages || recentMessages.length === 0) {
                    return [];
                }
                
                // 在最近的AI回复中查找角色名
                const aiMessages = recentMessages.filter(msg => msg.role === 'assistant');
                
                for (const msg of aiMessages) {
                    const text = msg.message || '';
                    
                    // 使用正则表达式查找可能的角色名（中文名格式）
                    const nameRegex = /([\u4e00-\u9fa5]{2,4})/g;
                    const matches = text.match(nameRegex);
                    
                    if (matches) {
                        // 去重并添加到通讯录
                        const excludeWords = ['主角', '玩家', '系统', '消息', '回复', '对话', '自己', '你们'];
                        
                        matches.forEach(name => {
                            if (!excludeWords.includes(name) && !foundNames.has(name)) {
                                foundNames.add(name);
                                characters.push({
                                    name: name,
                                    phone: this._generatePhoneNumber(name),
                                    status: 'online',
                                    avatar: this._generateAvatar(name),
                                    metadata: {}
                                });
                            }
                        });
                    }
                }
                
                return characters;
                
            } catch (error) {
                console.warn('从聊天记录提取角色失败:', error);
                return [];
            }
        },
        
        // 从DOM解析角色
        _getCharactersFromDOM: function() {
            const characters = [];
            
            try {
                // 尝试从角色卡列表获取
                const charElements = document.querySelectorAll([
                    '.character-card',
                    '.char-item',
                    '.avatar-container',
                    '.character-avatar',
                    '.character-portrait',
                    '[data-character]'
                ].join(','));
                
                charElements.forEach((element, index) => {
                    const name = this._extractCharacterName(element);
                    if (name && name.length > 0) {
                        characters.push({
                            name: name,
                            phone: this._generatePhoneNumber(name),
                            status: index < 2 ? 'online' : 'offline', // 简单状态分配
                            avatar: this._generateAvatar(name)
                        });
                    }
                });
                
            } catch (error) {
                console.warn('DOM解析角色失败:', error);
            }
            
            return characters;
        },
        
        // 默认角色（完全回退时使用）
        _getDefaultCharacters: function() {
            return [
                { name: '西园寺爱丽莎', phone: '090-1234-0001', status: 'online', avatar: '👑', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '月咏深雪', phone: '090-1234-0002', status: 'online', avatar: '❄️', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '犬冢夏美', phone: '090-1234-0003', status: 'busy', avatar: '🐕', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '阿宅君', phone: '090-1234-0004', status: 'offline', avatar: '👓', metadata: { 好感度: 0, 警戒度: 0 } }
            ];
        },
        
        // 从元素中提取角色名
        _extractCharacterName: function(element) {
            // 尝试多种属性获取角色名
            const possibleSources = [
                () => element.getAttribute('data-character'),
                () => element.getAttribute('title'),
                () => element.getAttribute('alt'),
                () => element.querySelector('.char-name')?.textContent,
                () => element.querySelector('.character-name')?.textContent,
                () => element.querySelector('.name')?.textContent,
                () => element.textContent.trim().split('\n')[0]
            ];
            
            for (const source of possibleSources) {
                try {
                    const name = source();
                    if (name && typeof name === 'string' && name.length > 0 && name.length < 20) {
                        return name.trim();
                    }
                } catch (e) {
                    // 忽略错误
                }
            }
            
            return null;
        },
        
        // 生成手机号
        _generatePhoneNumber: function(name) {
            const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const middle = String((hash * 13) % 10000).padStart(4, '0');
            const end = String((hash * 17) % 10000).padStart(4, '0');
            return `090-${middle}-${end}`;
        },
        
        // 生成状态（基于角色名哈希）
        _generateStatus: function(name) {
            const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const statuses = ['online', 'online', 'busy', 'offline'];
            return statuses[hash % statuses.length];
        },
        
        // 生成头像emoji
        _generateAvatar: function(name) {
            const avatars = ['👑', '❄️', '🐕', '👓', '🌸', '🎀', '🐱', '🦊', '🐰', '🦋', '✨', '⭐'];
            const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return avatars[hash % avatars.length];
        },
        
        // ================================
        // 角色管理 - 新增功能
        // ================================
        
        // 请求AI添加新角色
        requestNewContact: async function(characterName) {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    throw new Error('酒馆助手未找到');
                }
                
                const TH = window.parent.TavernHelper;
                
                // 发送系统消息让AI介绍这个角色
                await TH.createChatMessages([{
                    role: 'system',
                    message: `请介绍角色"${characterName}"，包括外貌、性格和与主角的关系。并在介绍中自然提及这个角色将被添加到通讯录中。`
                }]);
                
                // 触发AI回复
                await TH.triggerSlash('/trigger');
                
                return { success: true };
                
            } catch (error) {
                console.error('请求AI添加角色失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        // 扫描聊天记录寻找角色
        scanMessagesForContacts: async function() {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    throw new Error('需要酒馆助手支持此功能');
                }
                
                const TH = window.parent.TavernHelper;
                const messages = TH.getChatMessages('0-{{lastMessageId}}', { include_swipes: false });
                
                let foundContacts = [];
                
                // 查找所有独特的角色名
                messages.forEach(msg => {
                    const text = msg.message || '';
                    // 匹配中文名（2-4个字）
                    const nameMatches = text.match(/([\u4e00-\u9fa5]{2,4})/g);
                    
                    if (nameMatches) {
                        nameMatches.forEach(name => {
                            // 过滤掉常见的非角色词汇
                            const excludeWords = ['主角', '玩家', '系统', '消息', '回复', '对话', '自己', '你们'];
                            if (!excludeWords.includes(name) && !foundContacts.includes(name)) {
                                foundContacts.push(name);
                            }
                        });
                    }
                });
                
                return {
                    success: true,
                    contacts: foundContacts,
                    count: foundContacts.length
                };
                
            } catch (error) {
                console.error('扫描聊天记录失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        // ================================
        // 辅助功能
        // ================================
        
        // 等待酒馆助手加载
        _waitForTavernHelper: async function() {
            return new Promise((resolve, reject) => {
                if (window.parent && window.parent.TavernHelper) {
                    resolve(window.parent.TavernHelper);
                    return;
                }
                
                let retries = 0;
                const interval = setInterval(() => {
                    retries++;
                    
                    if (window.parent && window.parent.TavernHelper) {
                        clearInterval(interval);
                        resolve(window.parent.TavernHelper);
                    } else if (retries >= CONFIG.maxRetries) {
                        clearInterval(interval);
                        reject(new Error('酒馆助手加载超时'));
                    }
                }, CONFIG.retryDelay);
            });
        },
        
        // 显示通知
        showNotification: function(message, type = 'info') {
            try {
                // 如果父窗口有toastr，使用它
                if (window.parent && window.parent.toastr) {
                    const toastr = window.parent.toastr;
                    switch (type) {
                        case 'success': toastr.success(message); break;
                        case 'warning': toastr.warning(message); break;
                        case 'error': toastr.error(message); break;
                        default: toastr.info(message);
                    }
                    return;
                }
                
                // 否则创建自定义通知
                const notification = document.createElement('div');
                notification.className = 'hypnosis-notification';
                notification.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 20px;
                        background: ${this._getNotificationColor(type)};
                        color: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                        z-index: 99999;
                        font-size: 14px;
                        animation: hypnosisSlideIn 0.3s ease;
                        max-width: 300px;
                        word-break: break-word;
                    ">
                        <strong>📱 ${CONFIG.appName}</strong><br>
                        ${message}
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // 3秒后移除
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
                
                // 添加动画样式
                if (!document.querySelector('#hypnosis-notification-style')) {
                    const style = document.createElement('style');
                    style.id = 'hypnosis-notification-style';
                    style.textContent = `
                        @keyframes hypnosisSlideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
            } catch (error) {
                console.warn('显示通知失败:', error);
                // 简单回退
                alert(`📱 ${CONFIG.appName}: ${message}`);
            }
        },
        
        // 获取通知颜色
        _getNotificationColor: function(type) {
            const colors = {
                success: '#48bb78',
                warning: '#ed8936',
                error: '#f56565',
                info: '#4299e1'
            };
            return colors[type] || colors.info;
        },
        
        // 监听AI回复
        getCharacterResponse: function(callback) {
            try {
                // 使用MutationObserver监听新消息
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.addedNodes.length) {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === 1 && node.textContent) {
                                    const text = node.textContent.trim();
                                    // 简单判断是否为AI回复（不包含特定标记）
                                    if (text.length > 10 && 
                                        !text.includes('User:') && 
                                        !text.includes('玩家:') && 
                                        !text.includes('[玩家]') &&
                                        !text.includes('System:')) {
                                        console.log('📥 监听到可能的AI回复:', text.substring(0, 50));
                                        callback(text);
                                    }
                                }
                            });
                        }
                    });
                });
                
                // 尝试查找聊天容器
                const containers = [
                    '#chat-container',
                    '.chat-messages',
                    '.messages',
                    '#messages',
                    'body' // 最后回退到body
                ];
                
                for (const selector of containers) {
                    const container = document.querySelector(selector);
                    if (container) {
                        observer.observe(container, { 
                            childList: true, 
                            subtree: true,
                            characterData: true 
                        });
                        console.log('🔍 开始监听AI回复于:', selector);
                        break;
                    }
                }
                
            } catch (error) {
                console.error('监听AI回复失败:', error);
            }
        },
        
        // 获取当前角色名
        getCurrentCharacter: function() {
            try {
                const selectors = [
                    '.char_name',
                    '.character-name',
                    '.name-display',
                    'h1',
                    'h2'
                ];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent) {
                        const name = element.textContent.trim();
                        if (name && name.length > 0 && name.length < 30) {
                            return name;
                        }
                    }
                }
                
                return null;
            } catch (error) {
                console.warn('获取当前角色名失败:', error);
                return null;
            }
        },
        
        // 获取当前变量
        getCurrentVariables: async function() {
            try {
                if (window.parent && window.parent.TavernHelper) {
                    await this._waitForTavernHelper();
                    return window.parent.TavernHelper.getVariables({ type: 'chat' });
                }
                return null;
            } catch (error) {
                console.warn('获取变量失败:', error);
                return null;
            }
        },
        
        // 检测SillyTavern版本
        detectSTVersion: function() {
            try {
                // 检查酒馆助手
                if (window.parent && window.parent.TavernHelper) {
                    return {
                        type: 'tavern-helper',
                        version: window.parent.TavernHelper.getTavernHelperVersion ? 
                                 window.parent.TavernHelper.getTavernHelperVersion() : 'unknown'
                    };
                }
                
                // 检查原生SillyTavern
                if (window.parent && window.parent.SillyTavern) {
                    return {
                        type: 'sillytavern',
                        version: 'native'
                    };
                }
                
                return {
                    type: 'unknown',
                    version: 'unknown'
                };
                
            } catch (error) {
                return {
                    type: 'error',
                    version: 'error'
                };
            }
        },
        
        // ================================
        // 消息监听 - 解决跨域问题
        // ================================
        
        // 监听来自扩展iframe的消息
        _setupMessageListener: function() {
            window.addEventListener('message', (event) => {
                // 验证消息来源
                if (event.source !== window.parent) return;
                
                const data = event.data;
                
                if (data === 'CLOSE_EXTENSION') {
                    console.log('收到关闭扩展消息');
                    this._closeExtension();
                } else if (data.action === 'getCharacters') {
                    // 响应获取角色的请求
                    this.getCharacters().then(characters => {
                        window.parent.postMessage({
                            action: 'charactersData',
                            characters: characters
                        }, '*');
                    });
                }
            });
        },
        
        // 关闭扩展
        _closeExtension: function() {
            try {
                const iframe = document.getElementById('hypnosis-extension-iframe');
                if (iframe) {
                    iframe.style.display = 'none';
                    this.showNotification('扩展已关闭', 'info');
                }
            } catch (e) {
                console.log('关闭扩展失败:', e);
            }
        },
        
        // ================================
        // 调试和诊断
        // ================================
        
        // 运行诊断
        runDiagnostics: function() {
            const results = {
                tavernHelper: !!window.parent?.TavernHelper,
                sillyTavern: !!window.parent?.SillyTavern,
                canAccessParent: !!window.parent,
                inputElements: document.querySelectorAll('textarea').length,
                sendButtons: this._findSendButton() ? 'found' : 'not found',
                currentCharacter: this.getCurrentCharacter(),
                stVersion: this.detectSTVersion()
            };
            
            console.group('🔧 催眠APP扩展诊断结果');
            Object.entries(results).forEach(([key, value]) => {
                console.log(`${key}:`, value);
            });
            console.groupEnd();
            
            return results;
        }
    };
    
    // ================================
    // 初始化
    // ================================
    window.STInterface = STInterface;
    
    // 添加全局CSS样式
    const addGlobalStyles = () => {
        const style = document.createElement('style');
        style.id = 'hypnosis-extension-styles';
        style.textContent = `
            /* 扩展按钮样式 */
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
            
            /* 扩展iframe样式 */
            #hypnosis-extension-iframe {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                overflow: hidden;
                background: white;
                transition: all 0.3s ease;
            }
            
            /* 调整大小手柄 */
            .resize-handle {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 10px;
                cursor: ns-resize;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            #hypnosis-extension-iframe:hover .resize-handle {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    };
    
    // 主初始化函数
    const initialize = () => {
        try {
            addGlobalStyles();
            
            // 设置消息监听器
            STInterface._setupMessageListener();
            
            // 运行诊断（调试模式）
            if (CONFIG.debug) {
                setTimeout(() => {
                    STInterface.runDiagnostics();
                }, 1000);
            }
            
            // 发送初始化完成通知
            setTimeout(() => {
                STInterface.showNotification(`扩展已加载 (v${CONFIG.version})`, 'info');
            }, 1500);
            
            console.log(`✨ ${CONFIG.appName} v${CONFIG.version} 已成功加载`);
            
        } catch (error) {
            console.error('初始化失败:', error);
        }
    };
    
    // 延迟初始化，确保DOM已加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
    
})();
