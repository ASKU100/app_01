// st-integration.js - 催眠APP与SillyTavern集成脚本（精简版）
(function() {
    'use strict';
    
    console.log('📱 催眠APP扩展集成脚本加载');
    
    // 等待DOM加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
    
    function init() {
        try {
            // 监听来自扩展面板的消息
            window.addEventListener('message', function(event) {
                // 验证消息来源
                if (event.source !== document.getElementById('hypnosis-extension-iframe')?.contentWindow) {
                    return;
                }
                
                console.log('收到扩展面板消息:', event.data);
                
                if (event.data.type === 'close_extension') {
                    // 关闭扩展面板
                    const iframe = document.getElementById('hypnosis-extension-iframe');
                    if (iframe) iframe.style.display = 'none';
                }
            });
            
            console.log('✨ 集成脚本初始化完成');
            
        } catch (error) {
            console.error('集成脚本初始化失败:', error);
        }
    }
    
    // 全局函数：从酒馆助手变量获取角色
    window.getHypnosisCharacters = function() {
        try {
            if (window.TavernHelper && window.TavernHelper.getVariables) {
                const variables = window.TavernHelper.getVariables({ type: 'chat' });
                if (variables && variables.stat_data && variables.stat_data.角色) {
                    const characters = Object.entries(variables.stat_data.角色).map(([name, data]) => ({
                        name: name,
                        phone: generatePhoneNumber(name),
                        status: 'offline',
                        avatar: generateAvatar(name),
                        metadata: {
                            好感度: data.好感度 || 0,
                            警戒度: data.警戒度 || 0,
                            服从度: data.服从度 || 0
                        }
                    }));
                    return characters;
                }
            }
            return [];
        } catch (error) {
            console.error('获取角色失败:', error);
            return [];
        }
    };
    
    // 辅助函数
    function generatePhoneNumber(name) {
        const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const middle = String((hash * 13) % 10000).padStart(4, '0');
        const end = String((hash * 17) % 10000).padStart(4, '0');
        return `090-${middle}-${end}`;
    }
    
    function generateAvatar(name) {
        const avatars = ['👑', '❄️', '🐕', '👓', '🌸', '🎀', '🐱', '🦊', '🐰', '🦋', '✨', '⭐'];
        const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return avatars[hash % avatars.length];
    }
})();
