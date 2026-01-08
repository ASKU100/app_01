// st-integration.js - PostMessage版本
(function() {
    'use strict';
    
    console.log('📱 催眠APP扩展集成开始加载...');
    
    const CONFIG = {
        appName: '催眠APP扩展',
        version: '1.2.0',
        debug: true,
        timeout: 5000
    };
    
    // 消息ID计数器
    let messageId = 0;
    const pendingRequests = new Map();
    
    // 发送消息到主页面
    function sendToParent(type, data = {}) {
        return new Promise((resolve, reject) => {
            const id = ++messageId;
            
            // 设置超时
            const timeout = setTimeout(() => {
                pendingRequests.delete(id);
                reject(new Error('请求超时'));
            }, CONFIG.timeout);
            
            // 存储回调
            pendingRequests.set(id, { resolve, reject, timeout });
            
            // 发送消息
            const message = { id, type, data };
            console.log('📤 发送消息到父页面:', message);
            window.parent.postMessage(message, '*');
        });
    }
    
    // 监听来自主页面的响应
    window.addEventListener('message', function(event) {
        // 验证消息来源
        if (event.source !== window.parent) return;
        
        const { id, type, data, error } = event.data;
        
        if (!pendingRequests.has(id)) return;
        
        const request = pendingRequests.get(id);
        clearTimeout(request.timeout);
        pendingRequests.delete(id);
        
        if (type.endsWith('_ERROR') || error) {
            request.reject(new Error(error || '未知错误'));
        } else {
            request.resolve(data);
        }
    });
    
    // STInterface接口
    const STInterface = {
        // 发送消息
        sendUserMessage: async function(message, metadata = {}) {
            try {
                const result = await sendToParent('SEND_MESSAGE', {
                    message,
                    contact: metadata.contact,
                    metadata
                });
                
                this.showNotification('消息已发送到SillyTavern', 'success');
                return { success: true, ...result };
                
            } catch (error) {
                console.error('发送消息失败:', error);
                this.showNotification(`发送失败: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // 获取角色列表
        getCharacters: async function() {
            try {
                const characters = await sendToParent('GET_CHARACTERS');
                
                if (characters && characters.length > 0) {
                    console.log(`✅ 成功加载 ${characters.length} 个角色`);
                    return characters;
                }
                
                // 回退到默认角色
                return this._getDefaultCharacters();
                
            } catch (error) {
                console.error('获取角色失败:', error);
                this.showNotification('无法从[initvar]加载角色', 'warning');
                return this._getDefaultCharacters();
            }
        },
        
        // 获取变量
        getVariables: async function() {
            try {
                return await sendToParent('GET_VARIABLES');
            } catch (error) {
                console.error('获取变量失败:', error);
                return null;
            }
        },
        
        // 运行诊断
        runDiagnostics: async function() {
            try {
                const result = await sendToParent('DIAGNOSTICS');
                return {
                    ...result,
                    extensionLoaded: true,
                    postMessageAvailable: true,
                    parentAccess: !!window.parent
                };
            } catch (error) {
                return {
                    extensionLoaded: true,
                    postMessageAvailable: false,
                    error: error.message
                };
            }
        },
        
        // 显示通知
        showNotification: function(message, type = 'info') {
            try {
                // 尝试发送通知到父页面
                sendToParent('SHOW_NOTIFICATION', { message, type }).catch(() => {
                    // 回退到本地通知
                    this._showLocalNotification(message, type);
                });
            } catch (error) {
                this._showLocalNotification(message, type);
            }
        },
        
        // 本地通知
        _showLocalNotification: function(message, type) {
            const colors = {
                success: '#48bb78',
                warning: '#ed8936',
                error: '#f56565',
                info: '#4299e1'
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${colors[type] || colors.info};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 99999;
                font-size: 14px;
                animation: notificationSlideIn 0.3s ease;
                max-width: 300px;
            `;
            
            notification.textContent = `📱 ${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
            
            // 添加动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes notificationSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        },
        
        // 默认角色
        _getDefaultCharacters: function() {
            return [
                { name: '西园寺爱丽莎', phone: '090-1234-0001', status: 'online', avatar: '👑', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '月咏深雪', phone: '090-1234-0002', status: 'online', avatar: '❄️', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '犬冢夏美', phone: '090-1234-0003', status: 'busy', avatar: '🐕', metadata: { 好感度: 0, 警戒度: 0 } },
                { name: '阿宅君', phone: '090-1234-0004', status: 'offline', avatar: '👓', metadata: { 好感度: 0, 警戒度: 0 } }
            ];
        }
    };
    
    // 暴露接口
    window.STInterface = STInterface;
    
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .st-interface-debug {
            position: fixed;
            bottom: 140px;
            right: 30px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 9998;
            max-width: 200px;
            word-break: break-all;
        }
    `;
    document.head.appendChild(style);
    
    // 初始化完成
    console.log(`✨ ${CONFIG.appName} v${CONFIG.version} 已加载 (PostMessage版本)`);
    
    // 发送就绪通知
    setTimeout(() => {
        STInterface.showNotification('扩展已就绪', 'info');
    }, 1000);
    
})();
