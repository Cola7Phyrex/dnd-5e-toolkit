/**
 * 骰子模块
 * 功能：添加、删除、冻结、投掷骰子
 */

const diceModule = {
    // 当前骰子数组
    dice: [],
    maxDice: 6,

    // 添加骰子
    addDice(sides) {
        if (this.dice.length >= this.maxDice) {
            alert(`最多只能添加${this.maxDice}个骰子`);
            return;
        }

        const newDice = {
            id: App.generateId(),
            sides: sides,
            value: sides, // 初始显示最大值
            locked: false
        };

        this.dice.push(newDice);
        this.render();
        this.saveState();
    },

    // 移除特定骰子
    removeDice(id) {
        this.dice = this.dice.filter(d => d.id !== id);
        this.render();
        this.saveState();
    },

    // 切换冻结状态
    toggleLock(id) {
        const dice = this.dice.find(d => d.id === id);
        if (dice) {
            dice.locked = !dice.locked;
            this.render();
            this.saveState();
        }
    },

    // 清除所有骰子
    clearAll() {
        if (this.dice.length === 0) return;
        if (confirm('确定要移除所有骰子吗？')) {
            this.dice = [];
            this.render();
            this.saveState();
            this.hideResult();
        }
    },

    // 清除未冻结的骰子
    clearUnfrozen() {
        const lockedCount = this.dice.filter(d => d.locked).length;
        this.dice = this.dice.filter(d => d.locked);
        this.render();
        this.saveState();
        
        if (this.dice.length === 0) {
            this.hideResult();
        }
    },

    // 投掷所有未冻结的骰子
    rollAll() {
        if (this.dice.length === 0) {
            alert('请先添加骰子');
            return;
        }

        const unlockedDice = this.dice.filter(d => !d.locked);
        if (unlockedDice.length === 0) {
            alert('所有骰子都被冻结了！');
            return;
        }

        // 动画效果：先添加rolling类
        unlockedDice.forEach(dice => {
            const el = document.getElementById(`dice-${dice.id}`);
            if (el) el.classList.add('rolling');
        });

        // 生成随机数
        setTimeout(() => {
            let total = 0;
            const results = [];

            this.dice.forEach(dice => {
                if (!dice.locked) {
                    dice.value = Math.floor(Math.random() * dice.sides) + 1;
                }
                total += dice.value;
                results.push(`d${dice.sides}: ${dice.value}${dice.locked ? '🔒' : ''}`);
            });

            this.render();
            this.showResult(total, results);
            this.saveState();

            // 移除动画类
            document.querySelectorAll('.dice-card').forEach(el => {
                el.classList.remove('rolling');
            });
        }, 500);
    },

    // 渲染骰子到页面
    render() {
        const arena = document.getElementById('dice-arena');
        const emptyState = document.getElementById('dice-empty');

        if (this.dice.length === 0) {
            arena.innerHTML = '';
            arena.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        // 保留emptyState但不显示
        if (emptyState) emptyState.style.display = 'none';
        
        // 清空arena但保留emptyState
        arena.innerHTML = '';
        if (emptyState) arena.appendChild(emptyState);

        this.dice.forEach(dice => {
            const diceEl = document.createElement('div');
            diceEl.className = `dice-card ${dice.locked ? 'locked' : ''}`;
            diceEl.id = `dice-${dice.id}`;
            diceEl.innerHTML = `
                <button class="dice-remove" onclick="event.stopPropagation(); diceModule.removeDice('${dice.id}')" title="移除">×</button>
                <div class="dice-type">d${dice.sides}</div>
                <div class="dice-value">${dice.value}</div>
            `;
            
            // 点击切换锁定
            diceEl.onclick = () => this.toggleLock(dice.id);
            
            arena.appendChild(diceEl);
        });
    },

    // 显示结果
    showResult(total, details) {
        const resultDiv = document.getElementById('roll-result');
        const valueDiv = document.getElementById('result-value');
        const detailDiv = document.getElementById('result-detail');

        valueDiv.textContent = total;
        detailDiv.textContent = details.join(' + ');
        resultDiv.style.display = 'block';

        // 滚动到结果处（移动端友好）
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    // 隐藏结果
    hideResult() {
        const resultDiv = document.getElementById('roll-result');
        if (resultDiv) resultDiv.style.display = 'none';
    },

    // 保存状态到LocalStorage
    saveState() {
        App.storage.set('dice_state', this.dice);
    },

    // 从LocalStorage恢复
    loadState() {
        const saved = App.storage.get('dice_state', []);
        if (saved && saved.length > 0) {
            this.dice = saved;
            this.render();
        }
    }
};

// 页面加载时恢复骰子状态
document.addEventListener('DOMContentLoaded', () => {
    diceModule.loadState();
});