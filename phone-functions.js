/**
 * 手机功能前端 - 悬浮球样式
 * 功能：地图、通讯录、短信
 * 设计原则：独立运行，不依赖原有前端
 */

(function() {
    'use strict';
    
    // 等待jQuery加载
    function waitForJQuery(callback) {
        if (window.jQuery) {
            callback();
        } else {
            setTimeout(() => waitForJQuery(callback), 100);
        }
    }
    
    // 等待MVU框架
    function waitForMvu(callback) {
        if (window.Mvu) {
            callback();
        } else {
            setTimeout(() => waitForMvu(callback), 100);
        }
    }
    
    // 主初始化函数
    function initPhoneFunctions() {
        console.log('[手机功能] 初始化');
        
        // 防止重复加载
        if (window.PhoneFunctionsInitialized) {
            return;
        }
        window.PhoneFunctionsInitialized = true;
        
        // 创建悬浮球
        createFloatingButton();
        
        // 加载CSS
        loadStyles();
        
        // 初始化通讯录数据
        loadContactsFromInitVar();
    }
    
    // 加载CSS样式
    function loadStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 命名空间隔离 */
            .phone-func-container {
                position: fixed;
                z-index: 9999;
                font-family: 'Segoe UI', 'SF Pro Display', -apple-system, sans-serif;
            }
            
            /* 悬浮球 */
            .phone-float-ball {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10000;
                user-select: none;
            }
            
            .phone-float-ball:hover {
                transform: scale(1.1);
                box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
            }
            
            .phone-float-ball.active {
                transform: rotate(45deg) scale(1.1);
            }
            
            .phone-float-ball-icon {
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            
            /* 功能面板 */
            .phone-panel {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 350px;
                max-height: 600px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                display: none;
                z-index: 9999;
                animation: panelSlideIn 0.3s ease;
            }
            
            @keyframes panelSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .phone-panel.active {
                display: block;
            }
            
            /* 选项卡 */
            .phone-tabs {
                display: flex;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 0;
            }
            
            .phone-tab {
                flex: 1;
                padding: 15px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                text-align: center;
            }
            
            .phone-tab:hover {
                color: white;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .phone-tab.active {
                color: white;
                background: rgba(255, 255, 255, 0.2);
                border-bottom: 3px solid white;
            }
            
            /* 内容区域 */
            .phone-content {
                padding: 20px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            /* 地图选项卡 */
            .phone-map-container {
                font-family: 'Menlo', 'Monaco', monospace;
                font-size: 12px;
                line-height: 1.5;
                color: #333;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                border: 1px solid #e9ecef;
            }
            
            .phone-map-location {
                margin-left: 15px;
                color: #6c757d;
            }
            
            .phone-map-location.highlight {
                color: #667eea;
                font-weight: bold;
            }
            
            /* 通讯录选项卡 */
            .phone-contact-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .phone-contact-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 10px;
                transition: all 0.3s;
                cursor: pointer;
            }
            
            .phone-contact-item:hover {
                background: #e9ecef;
                transform: translateX(5px);
            }
            
            .phone-contact-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                margin-right: 12px;
            }
            
            .phone-contact-info {
                flex: 1;
            }
            
            .phone-contact-name {
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
            }
            
            .phone-contact-relation {
                font-size: 12px;
                color: #6c757d;
            }
            
            .phone-contact-actions {
                display: flex;
                gap: 8px;
            }
            
            .phone-contact-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .phone-call-btn {
                background: #28a745;
                color: white;
            }
            
            .phone-call-btn:hover {
                background: #218838;
                transform: scale(1.1);
            }
            
            .phone-sms-btn {
                background: #17a2b8;
                color: white;
            }
            
            .phone-sms-btn:hover {
                background: #138496;
                transform: scale(1.1);
            }
            
            /* 短信选项卡 */
            .phone-sms-container {
                display: flex;
                flex-direction: column;
                height: 400px;
            }
            
            .phone-sms-recipient {
                padding: 12px;
                background: #f8f9fa;
                border-radius: 10px;
                margin-bottom: 15px;
                font-weight: 600;
                color: #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .phone-sms-history {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
                margin-bottom: 15px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .phone-sms-message {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 18px;
                position: relative;
                word-wrap: break-word;
            }
            
            .phone-sms-sent {
                align-self: flex-end;
                background: #667eea;
                color: white;
                border-bottom-right-radius: 5px;
            }
            
            .phone-sms-received {
                align-self: flex-start;
                background: #e9ecef;
                color: #333;
                border-bottom-left-radius: 5px;
            }
            
            .phone-sms-time {
                font-size: 11px;
                color: #6c757d;
                margin-top: 4px;
                text-align: right;
            }
            
            .phone-sms-input-area {
                display: flex;
                gap: 10px;
            }
            
            .phone-sms-input {
                flex: 1;
                padding: 12px 15px;
                border: 2px solid #e9ecef;
                border-radius: 25px;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .phone-sms-input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .phone-sms-send {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .phone-sms-send:hover {
                transform: scale(1.1);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .phone-sms-send:disabled {
                background: #6c757d;
                cursor: not-allowed;
                transform: none;
            }
            
            /* 关闭按钮 */
            .phone-close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                color: #333;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .phone-close-btn:hover {
                background: rgba(0, 0, 0, 0.2);
                transform: rotate(90deg);
            }
            
            /* 响应式调整 */
            @media (max-width: 768px) {
                .phone-panel {
                    width: 90vw;
                    right: 5vw;
                    bottom: 80px;
                }
                
                .phone-float-ball {
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 创建悬浮球
    function createFloatingButton() {
        const floatBall = document.createElement('div');
        floatBall.className = 'phone-float-ball';
        floatBall.innerHTML = '<div class="phone-float-ball-icon">📱</div>';
        document.body.appendChild(floatBall);
        
        // 点击事件
        floatBall.addEventListener('click', togglePhonePanel);
        
        // 创建面板
        createPhonePanel();
    }
    
    // 创建功能面板
    function createPhonePanel() {
        const panel = document.createElement('div');
        panel.className = 'phone-panel';
        panel.id = 'phone-panel';
        
        panel.innerHTML = `
            <div class="phone-tabs">
                <button class="phone-tab active" data-tab="map">🗺️ 地图</button>
                <button class="phone-tab" data-tab="contacts">👥 通讯录</button>
                <button class="phone-tab" data-tab="sms">💬 短信</button>
                <button class="phone-close-btn">×</button>
            </div>
            <div class="phone-content">
                <!-- 地图内容 -->
                <div class="phone-tab-content active" id="phone-tab-map">
                    <div class="phone-map-container" id="phone-map-content">
                        <!-- 地图将通过JS动态生成 -->
                    </div>
                </div>
                
                <!-- 通讯录内容 -->
                <div class="phone-tab-content" id="phone-tab-contacts">
                    <div class="phone-contact-list" id="phone-contact-list">
                        <!-- 联系人将通过JS动态生成 -->
                    </div>
                </div>
                
                <!-- 短信内容 -->
                <div class="phone-tab-content" id="phone-tab-sms">
                    <div class="phone-sms-container">
                        <div class="phone-sms-recipient" id="phone-sms-recipient">
                            选择联系人
                            <span id="phone-current-contact"></span>
                        </div>
                        <div class="phone-sms-history" id="phone-sms-history">
                            <!-- 短信历史记录 -->
                            <div style="text-align: center; color: #6c757d; padding: 20px;">
                                选择联系人开始聊天
                            </div>
                        </div>
                        <div class="phone-sms-input-area">
                            <input type="text" 
                                   class="phone-sms-input" 
                                   id="phone-sms-input" 
                                   placeholder="输入短信内容..." 
                                   disabled>
                            <button class="phone-sms-send" id="phone-sms-send" disabled>↑</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 添加事件监听
        setupPanelEvents();
    }
    
    // 设置面板事件
    function setupPanelEvents() {
        // 选项卡切换
        document.querySelectorAll('.phone-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // 关闭按钮
        document.querySelector('.phone-close-btn').addEventListener('click', togglePhonePanel);
        
        // 发送短信按钮
        document.getElementById('phone-sms-send').addEventListener('click', sendSMS);
        
        // 短信输入框回车发送
        document.getElementById('phone-sms-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendSMS();
            }
        });
    }
    
    // 切换选项卡
    function switchTab(tabId) {
        // 更新选项卡状态
        document.querySelectorAll('.phone-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });
        
        // 更新内容显示
        document.querySelectorAll('.phone-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`phone-tab-${tabId}`).classList.add('active');
        
        // 加载对应内容
        switch(tabId) {
            case 'map':
                loadMapContent();
                break;
            case 'contacts':
                loadContacts();
                break;
            case 'sms':
                loadSMS();
                break;
        }
    }
    
    // 加载地图内容
    function loadMapContent() {
        const mapContent = document.getElementById('phone-map-content');
        
        // 东京地图数据
        const tokyoMap = `
东京整体位置关系
西北方向
├─ 杉并区（故事主要舞台）
│   ├─ 高円寺（主角、伊莉雅、美游、克洛伊、学校）
│   ├─ 阿佐谷（犬冢夏美）
│   └─ 荻洼（周边商业区）
│
├─ 中野区（阿宅君）
│
├─ 新宿区（繁华商业区，转车枢纽）
│
├─ 文京区（月咏深雪）
│
└─ 港区（西园寺爱丽莎）

主要地点说明：
● 高円寺 - 故事主要发生地
● 私立斋明学园 - 主角所在学校
● 各角色住宅区 - 根据角色设定分布

点击地图位置可以查看详细信息。
        `;
        
        mapContent.innerHTML = `<pre style="margin: 0;">${tokyoMap}</pre>`;
    }
    
    // 从初始化变量加载通讯录
    function loadContactsFromInitVar() {
        // 这里我们通过监听变量变化来获取角色数据
        // 由于不能直接访问角色卡条目，我们等待MVU初始化后获取
        waitForMvu(() => {
            // 监听变量变化
            if (window.Mvu && window.Mvu.events) {
                eventOn(window.Mvu.events.VARIABLE_UPDATE_ENDED, (after, before) => {
                    updateContactsFromVariables(after.stat_data);
                });
            }
            
            // 初始加载
            if (window.Mvu && window.Mvu.stat_data) {
                updateContactsFromVariables(window.Mvu.stat_data);
            }
        });
    }
    
    // 从变量更新通讯录
    function updateContactsFromVariables(statData) {
        if (!statData || !statData.角色) return;
        
        window.phoneContacts = [];
        
        Object.entries(statData.角色).forEach(([name, data]) => {
            if (name && data !== '待初始化') {
                window.phoneContacts.push({
                    name: name,
                    displayName: name.replace(/^角色\./, ''), // 移除可能的路径前缀
                    relation: getRelationFromName(name),
                    initial: name.charAt(0)
                });
            }
        });
        
        // 如果有通讯录选项卡处于活动状态，更新显示
        if (document.getElementById('phone-tab-contacts').classList.contains('active')) {
            loadContacts();
        }
    }
    
    // 根据角色名推断关系
    function getRelationFromName(name) {
        const relations = {
            '西园寺爱丽莎': '西园寺财团千金',
            '月咏深雪': '班级委员长',
            '犬冢夏美': '田径部王牌',
            '阿宅君': '爱丽莎的青梅竹马',
            '伊莉雅': '魔法少女',
            '美游': '伊莉雅的挚友',
            '克洛伊': '伊莉雅的分身'
        };
        
        return relations[name] || '同学';
    }
    
    // 加载通讯录
    function loadContacts() {
        const contactList = document.getElementById('phone-contact-list');
        
        if (!window.phoneContacts || window.phoneContacts.length === 0) {
            contactList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #6c757d;">
                    <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                    <div>通讯录为空</div>
                    <div style="font-size: 12px; margin-top: 10px;">等待角色数据加载...</div>
                </div>
            `;
            return;
        }
        
        const contactsHTML = window.phoneContacts.map(contact => `
            <div class="phone-contact-item" data-contact="${contact.name}">
                <div class="phone-contact-avatar">${contact.initial}</div>
                <div class="phone-contact-info">
                    <div class="phone-contact-name">${contact.displayName}</div>
                    <div class="phone-contact-relation">${contact.relation}</div>
                </div>
                <div class="phone-contact-actions">
                    <button class="phone-contact-btn phone-call-btn" 
                            onclick="window.phoneCall('${contact.name}')"
                            title="打电话">
                        📞
                    </button>
                    <button class="phone-contact-btn phone-sms-btn" 
                            onclick="window.startSMS('${contact.name}')"
                            title="发短信">
                        💬
                    </button>
                </div>
            </div>
        `).join('');
        
        contactList.innerHTML = contactsHTML;
        
        // 添加点击事件（整个联系人项可点击）
        contactList.querySelectorAll('.phone-contact-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.closest('.phone-contact-actions')) {
                    window.startSMS(this.getAttribute('data-contact'));
                }
            });
        });
    }
    
    // 打电话功能
    window.phoneCall = function(contactName) {
        const displayName = contactName.replace(/^角色\./, '');
        
        // 切换到短信选项卡
        switchTab('sms');
        
        // 设置当前联系人
        window.currentSMSContact = contactName;
        document.getElementById('phone-current-contact').textContent = displayName;
        
        // 发送消息到AI（通过新的聊天消息）
        sendMessageToAI(`（向${displayName}打电话）`);
        
        // 显示提示
        const smsHistory = document.getElementById('phone-sms-history');
        const callMessage = `
            <div class="phone-sms-message phone-sms-sent">
                正在呼叫 ${displayName}...
                <div class="phone-sms-time">${getCurrentTime()}</div>
            </div>
        `;
        smsHistory.innerHTML += callMessage;
        smsHistory.scrollTop = smsHistory.scrollHeight;
    };
    
    // 开始短信聊天
    window.startSMS = function(contactName) {
        const displayName = contactName.replace(/^角色\./, '');
        
        // 切换到短信选项卡
        switchTab('sms');
        
        // 设置当前联系人
        window.currentSMSContact = contactName;
        document.getElementById('phone-current-contact').textContent = displayName;
        
        // 启用输入框
        document.getElementById('phone-sms-input').disabled = false;
        document.getElementById('phone-sms-send').disabled = false;
        document.getElementById('phone-sms-input').focus();
        
        // 加载历史记录
        loadSMSHistory(contactName);
    };
    
    // 加载短信历史记录
    function loadSMSHistory(contactName) {
        const smsHistory = document.getElementById('phone-sms-history');
        
        // 从变量中获取历史记录
        const messages = getSMSMessagesFromStorage(contactName);
        
        if (messages.length === 0) {
            smsHistory.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 20px;">
                    开始和${contactName.replace(/^角色\./, '')}聊天吧
                </div>
            `;
        } else {
            const messagesHTML = messages.map(msg => `
                <div class="phone-sms-message ${msg.type === 'sent' ? 'phone-sms-sent' : 'phone-sms-received'}">
                    ${msg.content}
                    <div class="phone-sms-time">${msg.time}</div>
                </div>
            `).join('');
            
            smsHistory.innerHTML = messagesHTML;
            smsHistory.scrollTop = smsHistory.scrollHeight;
        }
    }
    
    // 从存储获取短信记录
    function getSMSMessagesFromStorage(contactName) {
        try {
            // 尝试从localStorage获取
            const storageKey = `sms_history_${contactName}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                return JSON.parse(stored);
            }
            
            // 尝试从MVU变量获取
            if (window.Mvu && window.Mvu.stat_data && window.Mvu.stat_data.短信记录) {
                const smsData = window.Mvu.stat_data.短信记录[contactName];
                if (smsData && Array.isArray(smsData)) {
                    return smsData.map(item => ({
                        content: item.内容,
                        time: item.时间,
                        type: item.方向 === '发送' ? 'sent' : 'received'
                    }));
                }
            }
        } catch (e) {
            console.error('加载短信历史失败:', e);
        }
        
        return [];
    }
    
    // 保存短信记录
    function saveSMSMessage(contactName, message, type) {
        const msg = {
            content: message,
            time: getCurrentTime(),
            type: type // 'sent' 或 'received'
        };
        
        try {
            // 保存到localStorage
            const storageKey = `sms_history_${contactName}`;
            const existing = getSMSMessagesFromStorage(contactName);
            existing.push(msg);
            localStorage.setItem(storageKey, JSON.stringify(existing));
            
            // 保存到MVU变量（如果可能）
            if (window.Mvu && window.Mvu.setMvuVariable) {
                const path = `短信记录/${contactName}`;
                const current = window.Mvu.stat_data?.短信记录?.[contactName] || [];
                
                const mvuMsg = {
                    内容: message,
                    时间: getCurrentTime(),
                    方向: type === 'sent' ? '发送' : '接收'
                };
                
                current.push(mvuMsg);
                
                window.Mvu.setMvuVariable(window.Mvu, path, current, {
                    reason: '发送短信'
                });
            }
        } catch (e) {
            console.error('保存短信失败:', e);
        }
    }
    
    // 发送短信
    function sendSMS() {
        const input = document.getElementById('phone-sms-input');
        const message = input.value.trim();
        
        if (!message || !window.currentSMSContact) {
            return;
        }
        
        const contactName = window.currentSMSContact;
        const displayName = contactName.replace(/^角色\./, '');
        
        // 显示发送的消息
        const smsHistory = document.getElementById('phone-sms-history');
        const sentMessage = `
            <div class="phone-sms-message phone-sms-sent">
                ${message}
                <div class="phone-sms-time">${getCurrentTime()}</div>
            </div>
        `;
        smsHistory.innerHTML += sentMessage;
        
        // 保存记录
        saveSMSMessage(contactName, message, 'sent');
        
        // 清空输入框
        input.value = '';
        input.focus();
        
        // 滚动到底部
        smsHistory.scrollTop = smsHistory.scrollHeight;
        
        // 发送消息到AI（通过特殊格式）
        sendMessageToAI(`（发送短信给${displayName}：${message}）`);
        
        // 显示"对方正在输入"提示
        showTypingIndicator(contactName);
    }
    
    // 显示"正在输入"提示
    function showTypingIndicator(contactName) {
        const smsHistory = document.getElementById('phone-sms-history');
        const typingIndicator = `
            <div class="phone-sms-message phone-sms-received" id="typing-indicator">
                <div style="display: flex; gap: 5px;">
                    <div class="typing-dot" style="animation-delay: 0s;"></div>
                    <div class="typing-dot" style="animation-delay: 0.2s;"></div>
                    <div class="typing-dot" style="animation-delay: 0.4s;"></div>
                </div>
            </div>
        `;
        
        // 添加打字样式
        if (!document.querySelector('#typing-styles')) {
            const typingStyle = document.createElement('style');
            typingStyle.id = 'typing-styles';
            typingStyle.textContent = `
                .typing-dot {
                    width: 8px;
                    height: 8px;
                    background: #6c757d;
                    border-radius: 50%;
                    animation: typingAnimation 1.4s infinite;
                }
                
                @keyframes typingAnimation {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-5px); }
                }
            `;
            document.head.appendChild(typingStyle);
        }
        
        smsHistory.innerHTML += typingIndicator;
        smsHistory.scrollTop = smsHistory.scrollHeight;
    }
    
    // 移除"正在输入"提示
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 接收AI的短信回复
    window.receiveSMSReply = function(contactName, message) {
        // 如果当前正在和这个联系人聊天，显示消息
        if (window.currentSMSContact === contactName) {
            removeTypingIndicator();
            
            const smsHistory = document.getElementById('phone-sms-history');
            const receivedMessage = `
                <div class="phone-sms-message phone-sms-received">
                    ${message}
                    <div class="phone-sms-time">${getCurrentTime()}</div>
                </div>
            `;
            smsHistory.innerHTML += receivedMessage;
            smsHistory.scrollTop = smsHistory.scrollHeight;
            
            // 保存记录
            saveSMSMessage(contactName, message, 'received');
        }
    };
    
    // 发送消息到AI（通过模拟用户输入）
    function sendMessageToAI(message) {
        // 这个方法需要根据具体的AI聊天界面进行调整
        // 这里是一个通用实现
        
        // 查找聊天输入框
        const chatInputs = [
            document.querySelector('#user-input'),
            document.querySelector('textarea[placeholder*="输入"]'),
            document.querySelector('input[type="text"]'),
            document.querySelector('.chat-input'),
            document.querySelector('#message-input')
        ].filter(el => el);
        
        if (chatInputs.length > 0) {
            const input = chatInputs[0];
            
            // 设置消息
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                input.value = message;
                
                // 触发输入事件
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 尝试查找发送按钮
                const sendButtons = [
                    document.querySelector('button[aria-label*="发送"]'),
                    document.querySelector('button:contains("发送")'),
                    document.querySelector('.send-button'),
                    document.querySelector('#send-button')
                ].filter(el => el);
                
                if (sendButtons.length > 0) {
                    setTimeout(() => {
                        sendButtons[0].click();
                    }, 100);
                } else {
                    // 如果没有找到按钮，尝试回车发送
                    setTimeout(() => {
                        input.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            bubbles: true
                        }));
                    }, 100);
                }
            }
        } else {
            console.warn('未找到聊天输入框，消息未发送:', message);
        }
    }
    
    // 获取当前时间
    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 切换面板显示/隐藏
    function togglePhonePanel() {
        const panel = document.getElementById('phone-panel');
        const floatBall = document.querySelector('.phone-float-ball');
        
        panel.classList.toggle('active');
        floatBall.classList.toggle('active');
        
        // 如果打开面板，默认显示地图
        if (panel.classList.contains('active') && !document.querySelector('.phone-tab-content.active')) {
            switchTab('map');
        }
    }
    
    // 加载短信功能
    function loadSMS() {
        // 确保短信功能已正确初始化
        if (window.currentSMSContact) {
            loadSMSHistory(window.currentSMSContact);
        }
    }
    
    // 启动
    waitForJQuery(() => {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPhoneFunctions);
        } else {
            initPhoneFunctions();
        }
    });
    
    // 监听AI回复中的短信内容（通过正则匹配）
    function setupSMSListener() {
        // 监听新消息
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && 
                            (node.classList.contains('mes') || node.classList.contains('message'))) {
                            checkForSMSReply(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 检查AI回复中的短信内容
    function checkForSMSReply(messageNode) {
        const text = messageNode.textContent || '';
        
        // 匹配短信回复格式
        const smsRegex = /（?短信回复(?:给|：)([^：]+)：([^）]+)）?/;
        const match = text.match(smsRegex);
        
        if (match) {
            const contactName = match[1].trim();
            const message = match[2].trim();
            
            // 触发短信接收
            if (window.receiveSMSReply) {
                window.receiveSMSReply(contactName, message);
            }
        }
    }
    
    // 初始化短信监听器
    setTimeout(setupSMSListener, 3000);
    
    console.log('[手机功能] 脚本加载完成');
})();