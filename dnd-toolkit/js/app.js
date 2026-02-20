/**
 * DND Toolkit - 应用核心
 * 负责：路由切换、LocalStorage管理、通用工具函数
 */

const App = {
    // 当前激活的标签页
    currentTab: 'dice',
    
    // 初始化应用
    init() {
        console.log('🎲 DND Toolkit 初始化完成');
        this.loadSettings();
        
        // 检查是否是第一次访问
        if (!localStorage.getItem('dnd_visited')) {
            this.showWelcome();
            localStorage.setItem('dnd_visited', 'true');
        }
    },

    // 切换标签页
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(tabName)) {
                btn.classList.add('active');
            }
        });

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-section`).classList.add('active');

        this.currentTab = tabName;
        
        // 触发特定标签页的加载事件
        if (tabName === 'character' && typeof characterModule !== 'undefined') {
            characterModule.loadList();
        } else if (tabName === 'diy' && typeof diyModule !== 'undefined') {
            diyModule.loadContent();
        }
    },

    // LocalStorage 封装（带错误处理）
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`dnd_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('读取存储失败:', e);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(`dnd_${key}`, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('保存失败:', e);
                alert('保存失败，可能是存储空间不足');
                return false;
            }
        },
        
        remove(key) {
            localStorage.removeItem(`dnd_${key}`);
        }
    },

    // 生成唯一ID
    generateId() {
        return 'dnd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    },

    // 显示欢迎信息
    showWelcome() {
        console.log('欢迎来到DND 5E工具箱！');
        // 这里可以扩展为模态框欢迎界面
    },

    // 加载用户设置
    loadSettings() {
        const settings = this.storage.get('settings', {
            theme: 'parchment',
            defaultDice: [20]
        });
        // 应用设置...
    }
};

// 全局切换函数（供HTML调用）
function switchTab(tabName) {
    App.switchTab(tabName);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});