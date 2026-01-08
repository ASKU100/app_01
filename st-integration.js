// st-integration.js - 催眠APP与SillyTavern集成脚本（改进版）
(function() {
    'use strict';
    
    console.log('📱 催眠APP扩展集成开始加载...');
    
    // ================================
    // 配置
    // ================================
    const CONFIG = {
        appName: '催眠APP扩展',
        version: '1.1.0', // 版本更新
        debug: true,
        timeout: 10000, // 10秒超时
        retryDelay: 500, // 重试延迟
        maxRetries: 30,   // 最大重试次数（增加到30次，15秒超时）
        smsStorageKey: 'hypnosis_sms_storage_v2'
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
        // 角色管理 - 改进版
        // ================================
        
        // 获取角色列表（从[initvar]变量）
        getCharacters: async function() {
            try {
                // 尝试从酒馆助手获取
                const characters = await this._getCharactersFromTavernHelper();
                if (characters && characters.length > 0) {
                    console.log(`📇 从酒馆助手加载了 ${characters.length} 个角色`);
                    return characters;
                }
                
                // 备用方案：从DOM解析
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
        
        // 从酒馆助手变量获取角色 - 修复版
        _getCharactersFromTavernHelper: async function() {
            try {
                if (!window.parent || !window.parent.TavernHelper) {
                    throw new Error('酒馆助手未找到');
                }

                const TH = window.parent.TavernHelper;
                
                // 等待酒馆助手初始化
                await this._waitForTavernHelper();
                
                console.log('🔍 开始从酒馆助手变量搜索角色数据...');
                
                // 方法1：从最新的消息楼层变量获取（从initvar初始化而来）
                try {
                    console.log('正在检查消息楼层变量...');
                    // 获取最新消息楼层的变量
                    const messageVars = TH.getVariables({ 
                        type: 'message', 
                        message_id: 'latest' 
                    });
                    
                    console.log('消息楼层变量结构:', messageVars);
                    
                    if (messageVars && messageVars.stat_data && messageVars.stat_data.角色) {
                        const roleData = messageVars.stat_data.角色;
                        const characters = this._convertRoleDataToCharacters(roleData, 'message');
                        console.log(`✅ 从消息楼层变量加载了 ${characters.length} 个角色`);
                        return characters;
                    } else {
                        console.log('消息楼层变量中没有找到角色数据');
                    }
                } catch (error) {
                    console.warn('从消息楼层变量获取角色失败:', error.message);
                }
                
                // 方法2：从聊天变量获取
                try {
                    console.log('正在检查聊天变量...');
                    const chatVars = TH.getVariables({ type: 'chat' });
                    console.log('聊天变量结构:', chatVars);
                    
                    if (chatVars && chatVars.stat_data && chatVars.stat_data.角色) {
                        const roleData = chatVars.stat_data.角色;
                        const characters = this._convertRoleDataToCharacters(roleData, 'chat');
                        console.log(`✅ 从聊天变量加载了 ${characters.length} 个角色`);
                        return characters;
                    } else {
                        console.log('聊天变量中没有找到角色数据');
                    }
                } catch (error) {
                    console.warn('从聊天变量获取角色失败:', error.message);
                }
                
                // 方法3：从全局变量获取
                try {
                    console.log('正在检查全局变量...');
                    const globalVars = TH.getVariables({ type: 'global' });
                    console.log('全局变量结构:', globalVars);
                    
                    if (globalVars && globalVars.stat_data && globalVars.stat_data.角色) {
                        const roleData = globalVars.stat_data.角色;
                        const characters = this._convertRoleDataToCharacters(roleData, 'global');
                        console.log(`✅ 从全局变量加载了 ${characters.length} 个角色`);
                        return characters;
                    } else {
                        console.log('全局变量中没有找到角色数据');
                    }
                } catch (error) {
                    console.warn('从全局变量获取角色失败:', error.message);
                }
                
                // 方法4：尝试从聊天消息中解析
                try {
                    console.log('正在从聊天消息中解析角色...');
                    const messages = TH.getChatMessages('0-{{lastMessageId}}', { 
                        include_swipes: false,
                        hide_state: 'unhidden'
                    });
                    
                    if (messages && messages.length > 0) {
                        // 从消息中提取角色名
                        const characterNames = new Set();
                        messages.forEach(msg => {
                            if (msg.name && msg.name !== 'System' && msg.name !== 'You') {
                                characterNames.add(msg.name);
                            }
                        });
                        
                        if (characterNames.size > 0) {
                            const characters = Array.from(characterNames).map(name => ({
                                name: name,
                                phone: this._generatePhoneNumber(name),
                                status: this._generateStatus(name),
                                avatar: this._generateAvatar(name),
                                metadata: {}
                            }));
                            console.log(`✅ 从聊天消息中解析了 ${characters.length} 个角色`);
                            return characters;
                        }
                    }
                } catch (error) {
                    console.warn('从聊天消息解析角色失败:', error.message);
                }
                
                throw new Error('在所有变量位置都未找到角色数据');
                
            } catch (error) {
                console.warn('从酒馆助手获取角色失败:', error.message);
                return null;
            }
        },
        
        // 转换角色数据为统一格式
        _convertRoleDataToCharacters: function(roleData, source) {
            const characters = [];
            
            if (!roleData || typeof roleData !== 'object') {
                return characters;
            }
            
            Object.entries(roleData).forEach(([name, data]) => {
                if (typeof data === 'object' && data !== null) {
                    const character = {
                        name: name,
                        phone: this._generatePhoneNumber(name),
                        status: this._generateStatus(name),
                        avatar: this._generateAvatar(name),
                        metadata: {}
                    };
                    
                    // 从data中提取可能的属性
                    const possibleFields = [
                        '好感度', '警戒度', '服从度', '性欲', '快感值',
                        '阴蒂敏感度', '小穴敏感度', '菊穴敏感度', 
                        '尿道敏感度', '乳头敏感度'
                    ];
                    
                    possibleFields.forEach(field => {
                        if (data[field] !== undefined) {
                            character.metadata[field] = data[field];
                        }
                    });
                    
                    // 记录数据来源
                    character.metadata._source = source;
                    
                    characters.push(character);
                }
            });
            
            return characters;
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
                    '.character-avatar'
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
                { name: '伊莉雅', phone: '090-1234-0004', status: 'offline', avatar: '👓', metadata: { 好感度: 0, 警戒度: 0 } }
            ];
        },
        
        // 从元素中提取角色名
        _extractCharacterName: function(element) {
            const text = element.textContent || '';
            const possibleNames = text.trim().split('\n')[0];
            return possibleNames.length > 0 && possibleNames.length < 20 ? possibleNames : null;
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
        // 短信管理器 - 新增功能
        // ================================
        
        SMSManager: {
            // 存储结构：{ contactName: { messages: [], unreadCount: 0 } }
            storage: {},
            
            // 初始化
            init: function() {
                try {
                    const saved = localStorage.getItem(CONFIG.smsStorageKey);
                    if (saved) {
                        this.storage = JSON.parse(saved);
                        console.log('📱 短信存储已加载:', Object.keys(this.storage).length, '个联系人');
                    }
                } catch (error) {
                    console.warn('加载短信存储失败:', error);
                    this.storage = {};
                }
                
                // 迁移旧数据
                this._migrateOldData();
            },
            
            // 迁移旧版本数据
            _migrateOldData: function() {
                try {
                    const oldKey = 'hypnosis_sms_storage';
                    const oldData = localStorage.getItem(oldKey);
                    if (oldData && Object.keys(this.storage).length === 0) {
                        this.storage = JSON.parse(oldData);
                        localStorage.setItem(CONFIG.smsStorageKey, JSON.stringify(this.storage));
                        localStorage.removeItem(oldKey);
                        console.log('📱 已迁移旧版短信数据');
                    }
                } catch (error) {
                    console.warn('迁移旧数据失败:', error);
                }
            },
            
            // 保存到本地存储
            save: function() {
                try {
                    localStorage.setItem(CONFIG.smsStorageKey, JSON.stringify(this.storage));
                } catch (error) {
                    console.warn('保存短信存储失败:', error);
                }
            },
            
            // 添加消息
            addMessage: function(contact, message, isFromUser = true) {
                if (!contact || !message) {
                    console.warn('无效的消息参数');
                    return null;
                }
                
                if (!this.storage[contact]) {
                    this.storage[contact] = {
                        messages: [],
                        unreadCount: 0,
                        lastUpdated: new Date().toISOString()
                    };
                }
                
                const msgObj = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    text: message,
                    fromUser: isFromUser,
                    timestamp: new Date().toISOString(),
                    read: isFromUser // 用户发送的消息默认为已读
                };
                
                this.storage[contact].messages.push(msgObj);
                
                // 如果不是用户发送的消息，增加未读计数
                if (!isFromUser) {
                    this.storage[contact].unreadCount++;
                    console.log(`📱 ${contact} 有新的未读消息，总数: ${this.storage[contact].unreadCount}`);
                }
                
                // 保持消息数量在合理范围内
                if (this.storage[contact].messages.length > 100) {
                    this.storage[contact].messages = this.storage[contact].messages.slice(-50);
                    console.log(`📱 已清理 ${contact} 的历史消息`);
                }
                
                this.storage[contact].lastUpdated = new Date().toISOString();
                this.save();
                
                if (CONFIG.debug) {
                    console.log(`📝 短信已保存到 ${contact}:`, {
                        length: message.length,
                        isFromUser: isFromUser,
                        unreadCount: this.storage[contact].unreadCount
                    });
                }
                
                return msgObj;
            },
            
            // 获取未读消息
            getUnreadMessages: function(contact) {
                if (!this.storage[contact]) return [];
                return this.storage[contact].messages.filter(msg => !msg.read && !msg.fromUser);
            },
            
            // 标记为已读
            markAsRead: function(contact, messageId = null) {
                if (!this.storage[contact]) return 0;
                
                let markedCount = 0;
                
                if (messageId) {
                    // 标记单条消息
                    const message = this.storage[contact].messages.find(msg => msg.id === messageId);
                    if (message && !message.read && !message.fromUser) {
                        message.read = true;
                        this.storage[contact].unreadCount = Math.max(0, this.storage[contact].unreadCount - 1);
                        markedCount = 1;
                    }
                } else {
                    // 标记所有未读消息
                    this.storage[contact].messages.forEach(msg => {
                        if (!msg.read && !msg.fromUser) {
                            msg.read = true;
                            markedCount++;
                        }
                    });
                    this.storage[contact].unreadCount = 0;
                }
                
                if (markedCount > 0) {
                    this.save();
                    console.log(`📱 标记了 ${markedCount} 条消息为已读（${contact}）`);
                }
                
                return markedCount;
            },
            
            // 获取对话历史
            getConversation: function(contact, limit = 20) {
                if (!this.storage[contact]) return [];
                return this.storage[contact].messages.slice(-limit);
            },
            
            // 获取完整对话历史
            getFullConversation: function(contact) {
                if (!this.storage[contact]) return [];
                return this.storage[contact].messages;
            },
            
            // 清除对话
            clearConversation: function(contact) {
                if (this.storage[contact]) {
                    this.storage[contact].messages = [];
                    this.storage[contact].unreadCount = 0;
                    this.save();
                    console.log(`📱 已清除 ${contact} 的对话历史`);
                }
            },
            
            // 获取所有联系人的未读总数
            getTotalUnreadCount: function() {
                return Object.values(this.storage).reduce((total, contact) => total + contact.unreadCount, 0);
            },
            
            // 获取所有联系人
            getAllContacts: function() {
                return Object.keys(this.storage);
            },
            
            // 获取联系人的未读数量
            getContactUnreadCount: function(contact) {
                return this.storage[contact] ? this.storage[contact].unreadCount : 0;
            },
            
            // 导出所有数据（用于调试）
            exportData: function() {
                return JSON.stringify(this.storage, null, 2);
            },
            
            // 导入数据（用于恢复）
            importData: function(data) {
                try {
                    const parsed = JSON.parse(data);
                    if (typeof parsed === 'object') {
                        this.storage = parsed;
                        this.save();
                        return true;
                    }
                } catch (error) {
                    console.error('导入数据失败:', error);
                }
                return false;
            }
        },
        
        // ================================
        // 辅助功能
        // ================================
        
        // 等待酒馆助手加载 - 改进版
        _waitForTavernHelper: async function() {
            return new Promise((resolve, reject) => {
                if (window.parent && window.parent.TavernHelper) {
                    console.log('✅ 酒馆助手已加载');
                    resolve(window.parent.TavernHelper);
                    return;
                }
                
                let retries = 0;
                const maxRetries = CONFIG.maxRetries; // 30次，15秒超时
                const retryDelay = CONFIG.retryDelay;
                
                const interval = setInterval(() => {
                    retries++;
                    
                    if (window.parent && window.parent.TavernHelper) {
                        clearInterval(interval);
                        console.log('✅ 酒馆助手已加载');
                        resolve(window.parent.TavernHelper);
                    } else if (retries >= maxRetries) {
                        clearInterval(interval);
                        console.error('❌ 酒馆助手加载超时');
                        reject(new Error('酒馆助手加载超时，请确保已安装酒馆助手扩展'));
                    } else if (retries % 5 === 0) {
                        console.log(`⏳ 等待酒馆助手加载... (${retries}/${maxRetries})`);
                    }
                }, retryDelay);
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
                                    // 改进的判断逻辑
                                    if (text.length > 10 && 
                                        !text.includes('User:') && 
                                        !text.includes('玩家:') && 
                                        !text.includes('[玩家]') &&
                                        !text.includes('System:') &&
                                        !text.includes('系统:') &&
                                        !text.includes('角色列表') &&
                                        !text.includes('变量更新')) {
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
                    '#mes_strip',
                    '.mes_strip',
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
                
                return observer; // 返回observer以便可以停止监听
                
            } catch (error) {
                console.error('监听AI回复失败:', error);
                return null;
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
                                 window.parent.TavernHelper.getTavernHelperVersion() : 'unknown',
                        tavernVersion: window.parent.TavernHelper.getTavernVersion ? 
                                      window.parent.TavernHelper.getTavernVersion() : 'unknown'
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
        // 调试和诊断 - 改进版
        // ================================
        
        // 运行诊断
        runDiagnostics: function() {
            const results = {
                tavernHelper: {
                    available: !!window.parent?.TavernHelper,
                    version: window.parent?.TavernHelper?.getTavernHelperVersion ? 
                            window.parent.TavernHelper.getTavernHelperVersion() : 'unknown'
                },
                sillyTavern: !!window.parent?.SillyTavern,
                canAccessParent: !!window.parent,
                inputElements: document.querySelectorAll('textarea').length,
                sendButtons: this._findSendButton() ? 'found' : 'not found',
                currentCharacter: this.getCurrentCharacter(),
                stVersion: this.detectSTVersion(),
                smsStorage: {
                    contacts: Object.keys(this.SMSManager.storage).length,
                    totalMessages: Object.values(this.SMSManager.storage)
                        .reduce((total, contact) => total + contact.messages.length, 0),
                    totalUnread: this.SMSManager.getTotalUnreadCount()
                }
            };
            
            console.group('🔧 催眠APP扩展诊断结果');
            Object.entries(results).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    console.log(`${key}:`);
                    console.dir(value);
                } else {
                    console.log(`${key}:`, value);
                }
            });
            console.groupEnd();
            
            return results;
        },
        
        // 重置短信存储
        resetSMSStorage: function() {
            if (confirm('确定要重置所有短信数据吗？此操作不可撤销！')) {
                this.SMSManager.storage = {};
                this.SMSManager.save();
                this.showNotification('短信存储已重置', 'success');
                return true;
            }
            return false;
        },
        
        // 导出短信数据
        exportSMSData: function() {
            const data = this.SMSManager.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hypnosis-sms-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('短信数据已导出', 'success');
            return data;
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
            
            /* 未读徽章动画 */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .unread-badge {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    };
    
    // 主初始化函数
    const initialize = () => {
        try {
            addGlobalStyles();
            
            // 初始化短信管理器
            STInterface.SMSManager.init();
            
            // 运行诊断（调试模式）
            if (CONFIG.debug) {
                setTimeout(() => {
                    STInterface.runDiagnostics();
                }, 2000);
            }
            
            // 发送初始化完成通知
            setTimeout(() => {
                STInterface.showNotification(`扩展已加载 (v${CONFIG.version})`, 'info');
            }, 1500);
            
            console.log(`✨ ${CONFIG.appName} v${CONFIG.version} 已成功加载`);
            
        } catch (error) {
            console.error('初始化失败:', error);
            STInterface.showNotification(`初始化失败: ${error.message}`, 'error');
        }
    };
    
    // 延迟初始化，确保DOM已加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }
    
})();
