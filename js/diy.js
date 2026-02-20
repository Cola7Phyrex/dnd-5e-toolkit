/**
 * DIY 资料库模块
 * 支持：物品、法术、怪物的自定义创建
 */

const diyModule = {
    currentTab: 'items',
    
    // 表单字段配置
    fieldConfig: {
        items: [
            { id: 'name', label: '物品名称', type: 'text', required: true },
            { id: 'type', label: '类型', type: 'select', options: ['武器', '护甲', '消耗品', '工具', '奇物', '其他'] },
            { id: 'rarity', label: '稀有度', type: 'select', options: ['普通', '非普通', '珍稀', '极珍稀', '传说', '神器'] },
            { id: 'price', label: '价格', type: 'text', placeholder: '例如：50gp' },
            { id: 'weight', label: '重量', type: 'text', placeholder: '例如：2磅' },
            { id: 'description', label: '描述/效果', type: 'textarea', rows: 4, placeholder: '物品描述、效果、使用方式...' }
        ],
        spells: [
            { id: 'name', label: '法术名称', type: 'text', required: true },
            { id: 'level', label: '环阶', type: 'select', options: ['戏法', '1环', '2环', '3环', '4环', '5环', '6环', '7环', '8环', '9环'] },
            { id: 'school', label: '学派', type: 'select', options: ['防护', '咒法', '预言', '附魔', '塑能', '幻术', '死灵', '变化'] },
            { id: 'castingTime', label: '施法时间', type: 'text', placeholder: '例如：1动作' },
            { id: 'range', label: '射程', type: 'text', placeholder: '例如：60尺' },
            { id: 'components', label: '成分', type: 'text', placeholder: '例如：V, S, M（蝙蝠粪）' },
            { id: 'duration', label: '持续时间', type: 'text', placeholder: '例如：立即/专注，至多1分钟' },
            { id: 'description', label: '法术描述', type: 'textarea', rows: 5, placeholder: '法术效果、伤害、豁免...' },
            { id: 'classes', label: '可用职业', type: 'text', placeholder: '例如：法师、术士、邪术师' }
        ],
        monsters: [
            { id: 'name', label: '怪物名称', type: 'text', required: true },
            { id: 'size', label: '体型', type: 'select', options: ['微型', '小型', '中型', '大型', '巨型', '超巨型'] },
            { id: 'type', label: '类型', type: 'select', options: '异怪，野兽，天界生物，构装生物，龙，元素生物，妖精，邪魔，巨人，怪兽，泥怪，植物，不死生物'.split('，') },
            { id: 'alignment', label: '阵营', type: 'text', placeholder: '例如：守序邪恶' },
            { id: 'ac', label: '护甲等级 AC', type: 'number', placeholder: '例如：15' },
            { id: 'hp', label: '生命值 HP', type: 'text', placeholder: '例如：45 (6d8+18)' },
            { id: 'speed', label: '速度', type: 'text', placeholder: '例如：30尺，飞行60尺' },
            { id: 'abilities', label: '属性值 (STR/DEX/CON/INT/WIS/CHA)', type: 'text', placeholder: '例如：16/+3 14/+2 16/+3 10/+0 12/+1 8/-1' },
            { id: 'traits', label: '特性', type: 'textarea', rows: 3, placeholder: '特殊能力、抗性、免疫...' },
            { id: 'actions', label: '动作', type: 'textarea', rows: 4, placeholder: '攻击、法术等动作描述...' }
        ]
    },

    // 切换DIY标签
    switchTab(type) {
        this.currentTab = type;
        
        // 更新按钮状态
        document.querySelectorAll('.diy-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.diy-nav-btn').classList.add('active');
        
        // 显示对应面板
        document.querySelectorAll('.diy-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`diy-${type}`).classList.add('active');
        
        // 加载列表
        this.loadList(type);
    },

    // 加载列表
    loadList(type = this.currentTab) {
        const container = document.getElementById(`${type}-list`);
        const data = JSON.parse(localStorage.getItem(`dnd_diy_${type}`) || '[]');
        
        if (data.length === 0) {
            const icons = { items: '🎒', spells: '✨', monsters: '👹' };
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${icons[type]}</div>
                    <p>暂无自定义${type === 'items' ? '物品' : type === 'spells' ? '法术' : '怪物'}</p>
                </div>
            `;
            return;
        }
        
        // 按时间倒序
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = data.map(item => `
            <div class="diy-card">
                <div class="diy-card-header">
                    <h4>${item.name}</h4>
                    <span class="diy-card-tag">${this.getTagText(item)}</span>
                </div>
                <div class="diy-card-body">
                    ${item.description ? item.description.substring(0, 60) + (item.description.length > 60 ? '...' : '') : ''}
                </div>
                <div class="diy-card-actions">
                    <button class="btn btn-small" onclick="diyModule.editItem('${type}', '${item.id}')">编辑</button>
                    <button class="btn btn-danger btn-small" onclick="diyModule.deleteItem('${type}', '${item.id}')">删除</button>
                </div>
            </div>
        `).join('');
    },

    // 获取标签文本
    getTagText(item) {
        if (item.rarity) return item.rarity;
        if (item.level) return item.level;
        if (item.size) return item.size;
        return '';
    },

    // 显示表单
    showForm(type, id = null) {
        document.getElementById('diy-type').value = type;
        document.getElementById('diy-id').value = id || '';
        document.getElementById('diy-form-title').textContent = id ? '编辑' : '新建';
        
        // 生成表单字段
        const fields = this.fieldConfig[type];
        const container = document.getElementById('diy-form-fields');
        
        container.innerHTML = fields.map(field => {
            if (field.type === 'select') {
                const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                return `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <select id="diy-${field.id}" ${field.required ? 'required' : ''}>
                            <option value="">请选择</option>
                            ${options}
                        </select>
                    </div>
                `;
            } else if (field.type === 'textarea') {
                return `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <textarea id="diy-${field.id}" rows="${field.rows || 3}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}"></textarea>
                    </div>
                `;
            } else {
                return `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <input type="${field.type}" id="diy-${field.id}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">
                    </div>
                `;
            }
        }).join('');
        
        // 如果是编辑，填充数据
        if (id) {
            const data = JSON.parse(localStorage.getItem(`dnd_diy_${type}`) || '[]');
            const item = data.find(i => i.id === id);
            if (item) {
                fields.forEach(field => {
                    const el = document.getElementById(`diy-${field.id}`);
                    if (el && item[field.id] !== undefined) el.value = item[field.id];
                });
            }
        }
        
        document.getElementById('diy-modal').style.display = 'flex';
    },

    // 关闭表单
    closeForm() {
        document.getElementById('diy-modal').style.display = 'none';
        document.getElementById('diy-form').reset();
    },

    // 保存数据
    saveData() {
        const type = document.getElementById('diy-type').value;
        const id = document.getElementById('diy-id').value;
        const fields = this.fieldConfig[type];
        
        const data = {};
        fields.forEach(field => {
            const el = document.getElementById(`diy-${field.id}`);
            data[field.id] = el ? el.value.trim() : '';
        });
        
        let items = JSON.parse(localStorage.getItem(`dnd_diy_${type}`) || '[]');
        
        if (id) {
            // 编辑
            const idx = items.findIndex(i => i.id === id);
            if (idx !== -1) {
                data.id = id;
                data.createdAt = items[idx].createdAt;
                data.updatedAt = new Date().toISOString();
                items[idx] = data;
            }
        } else {
            // 新建
            data.id = 'diy_' + Date.now();
            data.createdAt = new Date().toISOString();
            data.updatedAt = data.createdAt;
            items.push(data);
        }
        
        localStorage.setItem(`dnd_diy_${type}`, JSON.stringify(items));
        this.closeForm();
        this.loadList(type);
        
        alert(id ? '修改成功！' : '创建成功！');
    },

    // 编辑项目
    editItem(type, id) {
        this.showForm(type, id);
    },

    // 删除项目
    deleteItem(type, id) {
        if (!confirm('确定要删除这个条目吗？')) return;
        
        let items = JSON.parse(localStorage.getItem(`dnd_diy_${type}`) || '[]');
        items = items.filter(i => i.id !== id);
        localStorage.setItem(`dnd_diy_${type}`, JSON.stringify(items));
        this.loadList(type);
    },

    // 加载内容（供外部调用）
    loadContent() {
        this.loadList(this.currentTab);
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    diyModule.loadList('items');
});