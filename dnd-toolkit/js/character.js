/**
 * 角色卡模块 - 完整版（含数据库支持）
 */

const characterModule = {
    currentId: null,
    multiclassCount: 0,
    classData: null,
    raceData: null,
    classOptions: '',

    // 初始化
    init() {
        console.log('角色卡模块加载成功');
        this.renderSkillList();
        this.loadDatabase(); // 加载数据库

        // 绑定主职业等级变化事件
        const mainLevelInput = document.getElementById('char-level');
        if (mainLevelInput) {
            mainLevelInput.addEventListener('input', () => this.updateTotalLevel());
        }
    },

    // 加载职业/种族数据库
    async loadDatabase() {
        try {
            // 加载职业数据
            const classResponse = await fetch('./data/classes.json');
            if (classResponse.ok) {
                this.classData = await classResponse.json();
                this.populateClassSelect();
                console.log('职业数据加载成功:', this.classData.classes.length, '个职业');
            }

            // 加载种族数据
            const raceResponse = await fetch('./data/races.json');
            if (raceResponse.ok) {
                this.raceData = await raceResponse.json();
                this.populateRaceSelect();
                console.log('种族数据加载成功:', this.raceData.races.length, '个种族');
            }
        } catch (e) {
            console.log('数据库加载失败，使用纯自定义模式:', e);
        }
    },

    // 填充职业下拉菜单
    populateClassSelect() {
        if (!this.classData) return;

        const select = document.getElementById('char-class-select');
        if (!select) return;

        // 保留第一个选项（自定义输入）
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.add(firstOption);

        // 添加预设职业
        this.classData.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            select.add(option);
        });

        // 保存选项HTML用于兼职
        this.classOptions = this.classData.classes.map(c =>
            `<option value="${c.id}">${c.name}</option>`
        ).join('');
    },

    // 填充种族下拉菜单
    populateRaceSelect() {
        if (!this.raceData) return;

        const select = document.getElementById('char-race-select');
        if (!select) return;

        const firstOption = select.options[0];
        select.innerHTML = '';
        select.add(firstOption);

        this.raceData.races.forEach(race => {
            const option = document.createElement('option');
            option.value = race.id;
            option.textContent = race.name;
            select.add(option);
        });
    },

    // 渲染技能列表（完整18项）
    renderSkillList() {
        const container = document.getElementById('skills-container');
        if (!container) return;

        const skills = [
            { id: 'acrobatics', name: '杂技 Acrobatics', ability: 'dex' },
            { id: 'animal_handling', name: '驯兽 Animal Handling', ability: 'wis' },
            { id: 'arcana', name: '奥秘 Arcana', ability: 'int' },
            { id: 'athletics', name: '运动 Athletics', ability: 'str' },
            { id: 'deception', name: '欺瞒 Deception', ability: 'cha' },
            { id: 'history', name: '历史 History', ability: 'int' },
            { id: 'insight', name: '洞悉 Insight', ability: 'wis' },
            { id: 'intimidation', name: '威吓 Intimidation', ability: 'cha' },
            { id: 'investigation', name: '调查 Investigation', ability: 'int' },
            { id: 'medicine', name: '医药 Medicine', ability: 'wis' },
            { id: 'nature', name: '自然 Nature', ability: 'int' },
            { id: 'perception', name: '察觉 Perception', ability: 'wis' },
            { id: 'performance', name: '表演 Performance', ability: 'cha' },
            { id: 'persuasion', name: '说服 Persuasion', ability: 'cha' },
            { id: 'religion', name: '宗教 Religion', ability: 'int' },
            { id: 'sleight_of_hand', name: '巧手 Sleight of Hand', ability: 'dex' },
            { id: 'stealth', name: '隐匿 Stealth', ability: 'dex' },
            { id: 'survival', name: '生存 Survival', ability: 'wis' }
        ];

        container.innerHTML = skills.map(skill => `
            <label class="skill-checkbox" style="display: flex; align-items: center; gap: 8px; padding: 5px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(139,69,19,0.05)'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" id="skill-${skill.id}" data-ability="${skill.ability}">
                <span style="flex: 1;">${skill.name}</span>
                <span style="font-size: 0.8rem; color: #888; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${skill.ability.toUpperCase()}</span>
            </label>
        `).join('');
    },

    // 显示创建表单
    showCreateForm() {
        this.currentId = null;
        document.getElementById('form-title').textContent = '创建角色卡';
        document.getElementById('character-form').reset();
        document.getElementById('char-id').value = '';
        this.resetForm();
        this.switchView('form');
    },

    // 重置表单
    resetForm() {
        document.getElementById('char-class-select').value = 'custom';
        document.getElementById('char-class-custom').style.display = 'block';
        document.getElementById('char-class-custom').value = '';

        document.getElementById('char-race-select').value = 'custom';
        document.getElementById('char-race-custom').style.display = 'block';
        document.getElementById('char-race-custom').value = '';

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
            document.getElementById(`attr-${ab}`).value = 10;
            this.calcModifier(ab);
            document.getElementById(`save-${ab}`).checked = false;
        });

        this.updateProficiency();

        const multiContainer = document.getElementById('multiclass-container');
        if (multiContainer) multiContainer.innerHTML = '';
        this.multiclassCount = 0;
        this.updateTotalLevel();
    },

    // 添加兼职（使用数据库）
    addMulticlass(data = null) {
        this.multiclassCount++;
        const id = this.multiclassCount;
        const container = document.getElementById('multiclass-container');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'multiclass-row';
        div.id = `multiclass-${id}`;
        div.style.cssText = 'background: rgba(139,69,19,0.05); border: 1px solid #D4C4B0; border-radius: 8px; padding: 15px; margin: 10px 0;';

        const classOptions = this.classOptions || '';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>兼职 #${id}</strong>
                <button type="button" class="btn btn-danger btn-small" onclick="characterModule.removeMulticlass(${id})">删除</button>
            </div>
            <div style="display: grid; gap: 10px;">
                <div>
                    <label>职业</label>
                    <select id="multi-class-${id}" onchange="characterModule.handleMulticlassChange(${id})" style="width: 100%; padding: 5px; margin-top: 5px;">
                        <option value="custom">✏️ 自定义输入</option>
                        ${classOptions}
                    </select>
                    <input type="text" id="multi-class-custom-${id}" placeholder="输入自定义职业" style="width: 100%; margin-top: 5px; padding: 5px; display: none;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>子职业</label>
                        <input type="text" id="multi-subclass-${id}" placeholder="子职业" style="width: 100%; padding: 5px; margin-top: 5px;">
                    </div>
                    <div>
                        <label>等级</label>
                        <input type="number" id="multi-level-${id}" value="1" min="1" onchange="characterModule.updateTotalLevel()" style="width: 100%; padding: 5px; margin-top: 5px;">
                    </div>
                </div>
            </div>
        `;

        container.appendChild(div);

        if (data) {
            if (data.classCustom) {
                document.getElementById(`multi-class-${id}`).value = 'custom';
                const customInput = document.getElementById(`multi-class-custom-${id}`);
                if (customInput) {
                    customInput.style.display = 'block';
                    customInput.value = data.className || '';
                }
            } else {
                document.getElementById(`multi-class-${id}`).value = data.classId || 'custom';
            }
            const subclassInput = document.getElementById(`multi-subclass-${id}`);
            if (subclassInput) subclassInput.value = data.subclass || '';
            const levelInput = document.getElementById(`multi-level-${id}`);
            if (levelInput) levelInput.value = data.level || 1;
        }

        this.updateTotalLevel();
    },

    // 删除兼职
    removeMulticlass(id) {
        const el = document.getElementById(`multiclass-${id}`);
        if (el) {
            el.remove();
            this.updateTotalLevel();
        }
    },

    // 处理兼职职业选择变化
    handleMulticlassChange(id) {
        const select = document.getElementById(`multi-class-${id}`);
        const customInput = document.getElementById(`multi-class-custom-${id}`);
        if (select && customInput) {
            if (select.value === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
            }
        }
    },

    // 计算总等级
    updateTotalLevel() {
        const mainLevel = parseInt(document.getElementById('char-level')?.value) || 0;
        let total = mainLevel;

        for (let i = 1; i <= this.multiclassCount; i++) {
            const levelInput = document.getElementById(`multi-level-${i}`);
            if (levelInput) {
                total += parseInt(levelInput.value) || 0;
            }
        }

        const display = document.getElementById('total-level-display');
        if (display) {
            display.textContent = total;
            display.style.color = total > 20 ? '#dc3545' : 'var(--brown-primary)';
        }

        const profBonus = Math.floor((total - 1) / 4) + 2;
        const profDisplay = document.getElementById('prof-bonus');
        if (profDisplay) {
            profDisplay.textContent = `+${profBonus}`;
        }

        return total;
    },

    // 收集表单数据
    collectFormData() {
        const char = {
            name: document.getElementById('char-name')?.value.trim(),
            player: document.getElementById('char-player')?.value.trim(),
            alignment: document.getElementById('char-alignment')?.value,
            background: document.getElementById('char-background')?.value.trim(),
            classes: [],
            raceId: document.getElementById('char-race-select')?.value,
            raceCustom: document.getElementById('char-race-select')?.value === 'custom',
            raceName: document.getElementById('char-race-custom')?.value.trim(),
            abilities: {},
            savingThrows: {}
        };

        // 主职业
        const mainClass = {
            classId: document.getElementById('char-class-select')?.value,
            classCustom: document.getElementById('char-class-select')?.value === 'custom',
            className: document.getElementById('char-class-custom')?.value.trim(),
            subclass: document.getElementById('char-subclass')?.value.trim(),
            level: parseInt(document.getElementById('char-level')?.value) || 1,
            isMain: true
        };
        char.classes.push(mainClass);

        // 收集兼职
        for (let i = 1; i <= this.multiclassCount; i++) {
            const row = document.getElementById(`multiclass-${i}`);
            if (!row) continue;

            const classSelect = document.getElementById(`multi-class-${i}`);
            const levelInput = document.getElementById(`multi-level-${i}`);
            if (!classSelect || !levelInput) continue;

            char.classes.push({
                classId: classSelect.value,
                classCustom: classSelect.value === 'custom',
                className: document.getElementById(`multi-class-custom-${i}`)?.value.trim() || '',
                subclass: document.getElementById(`multi-subclass-${i}`)?.value.trim() || '',
                level: parseInt(levelInput.value) || 1,
                isMain: false
            });
        }

        char.level = char.classes.reduce((sum, c) => sum + c.level, 0);

        // 六维属性
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
            char.abilities[ab] = parseInt(document.getElementById(`attr-${ab}`)?.value) || 10;
            char.savingThrows[ab] = document.getElementById(`save-${ab}`)?.checked || false;
        });

        // 战斗数据
        char.hpMax = parseInt(document.getElementById('char-hp-max')?.value) || 10;
        char.hpCurrent = parseInt(document.getElementById('char-hp-current')?.value) || char.hpMax;
        char.ac = parseInt(document.getElementById('char-ac')?.value) || 10;
        char.initiative = parseInt(document.getElementById('char-initiative')?.value) || 0;
        char.speed = document.getElementById('char-speed')?.value.trim() || '30尺';
        char.hitDice = document.getElementById('char-hit-dice')?.value.trim();

        // 熟练加值
        char.proficiencyBonus = Math.floor((char.level - 1) / 4) + 2;

        // 技能
        char.skills = [];
        document.querySelectorAll('[id^="skill-"]:checked').forEach(cb => {
            char.skills.push(cb.id.replace('skill-', ''));
        });

        // 法术
        char.spells = {
            cantrips: this.parseSpellList(document.getElementById('spells-0')?.value),
            level1: {
                slots: parseInt(document.getElementById('spell-slots-1')?.value) || 0,
                spells: this.parseSpellList(document.getElementById('spells-1')?.value)
            },
            level2: {
                slots: parseInt(document.getElementById('spell-slots-2')?.value) || 0,
                spells: this.parseSpellList(document.getElementById('spells-2')?.value)
            },
            highLevel: document.getElementById('spells-high')?.value.trim() || ''
        };

        // 其他
        char.inventory = document.getElementById('char-inventory')?.value.trim() || '';
        char.features = document.getElementById('char-features')?.value.trim() || '';
        char.racialTraits = document.getElementById('char-racial-traits')?.value.trim() || '';
        char.backstory = document.getElementById('char-backstory')?.value.trim() || '';

        return char;
    },

    // 解析法术列表
    parseSpellList(text) {
        if (!text || !text.trim()) return [];
        return text.split(/[,，、]/).map(s => s.trim()).filter(s => s);
    },

    // 保存角色（最终修复版）
    saveCharacter() {
        try {
            const char = this.collectFormData();

            if (!char.name) {
                alert('请输入角色姓名');
                return;
            }

            let characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');

            // 确保 characters 是数组
            if (!Array.isArray(characters)) {
                characters = [];
            }

            if (this.currentId) {
                const index = characters.findIndex(c => c.id === this.currentId);
                if (index !== -1) {
                    char.id = this.currentId;
                    char.createdAt = characters[index].createdAt || new Date().toISOString();
                    char.updatedAt = new Date().toISOString();
                    characters[index] = char;
                } else {
                    // ID 没找到，当作新建处理
                    char.id = this.currentId;
                    char.createdAt = new Date().toISOString();
                    char.updatedAt = char.createdAt;
                    characters.push(char);
                }
            } else {
                char.id = 'char_' + Date.now();
                char.createdAt = new Date().toISOString();
                char.updatedAt = char.createdAt;
                characters.push(char);
            }

            localStorage.setItem('dnd_characters', JSON.stringify(characters));
            alert(`保存成功！总等级：${char.level} | HP：${char.hpCurrent}/${char.hpMax}`);

            // 强制返回列表（带延迟确保保存完成）
            setTimeout(() => {
                this.backToList();
            }, 100);

        } catch (e) {
            console.error('保存失败:', e);
            alert('保存出错：' + e.message);
        }
    },

    // 删除角色
    deleteCharacter(id, event) {
        if (event) event.stopPropagation();

        let characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');
        const char = characters.find(c => c.id === id);
        const name = char ? char.name : '这个角色';

        if (confirm(`确定要删除 "${name}" 吗？\n\n此操作不可恢复！`)) {
            characters = characters.filter(c => c.id !== id);
            localStorage.setItem('dnd_characters', JSON.stringify(characters));
            this.loadList();
            if (this.currentId === id) {
                this.backToList();
            }
        }
    },

    deleteCurrent() {
        if (this.currentId) {
            this.deleteCharacter(this.currentId);
        }
    },

    // 查看角色详情
    viewCharacter(id) {
        this.currentId = id;
        const characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');
        const char = characters.find(c => c.id === id);
        if (!char) return;

        document.getElementById('detail-name').textContent = char.name || '未命名角色';
        this.renderDetail(char);
        this.switchView('detail');
    },

    // 渲染详情页（兼容新旧数据）
    renderDetail(char) {
        const container = document.getElementById('character-sheet-content');
        if (!container) return;

        // 计算总等级和职业信息
        let totalLevel = 0;
        let classText = '未知职业';

        if (char.classes && Array.isArray(char.classes) && char.classes.length > 0) {
            totalLevel = char.classes.reduce((sum, c) => sum + (parseInt(c.level) || 0), 0);
            const main = char.classes[0];
            classText = main.className || main.classId || '未知职业';
            if (char.classes.length > 1) {
                classText += ` (+${char.classes.length - 1}兼职)`;
            }
        } else {
            totalLevel = parseInt(char.level) || 1;
            classText = char.className || char.classId || char.class || '未知职业';
        }

        // 读取属性
        const abilities = char.abilities || {};
        const str = abilities.str || 10;
        const dex = abilities.dex || 10;
        const con = abilities.con || 10;
        const int = abilities.int || 10;
        const wis = abilities.wis || 10;
        const cha = abilities.cha || 10;

        // 读取战斗数据
        const hpCurrent = char.hpCurrent !== undefined ? char.hpCurrent : 0;
        const hpMax = char.hpMax !== undefined ? char.hpMax : 10;
        const ac = char.ac || 10;
        const initiative = char.initiative !== undefined ? char.initiative : 0;
        const race = char.raceName || char.raceId || char.race || '-';

        container.innerHTML = `
            <div style="background: var(--bg-card); border: 2px solid var(--brown-primary); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: var(--brown-primary); margin-bottom: 10px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">
                    ${char.name || '未命名角色'}
                </h2>
                
                <div style="margin-bottom: 15px;">
                    <strong>职业：</strong>${classText}<br>
                    <strong>等级：</strong>Lv.${totalLevel}<br>
                    <strong>种族：</strong>${race}<br>
                    <strong>阵营：</strong>${char.alignment || '-'} | <strong>背景：</strong>${char.background || '-'}
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; text-align: center; background: rgba(139,69,19,0.05); padding: 15px; border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.8rem; color: #666;">HP</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--brown-primary);">${hpCurrent}/${hpMax}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: #666;">AC</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--brown-primary);">${ac}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: #666;">先攻</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--brown-primary);">${initiative >= 0 ? '+' : ''}${initiative}</div>
                    </div>
                </div>

                <div style="margin: 15px 0;">
                    <h4 style="color: var(--brown-primary); margin-bottom: 10px;">属性值</h4>
                    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; text-align: center;">
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">力量</div>
                            <div style="font-weight: bold;">${str}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((str - 10) / 2) >= 0 ? '+' : ''}${Math.floor((str - 10) / 2)}</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">敏捷</div>
                            <div style="font-weight: bold;">${dex}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((dex - 10) / 2) >= 0 ? '+' : ''}${Math.floor((dex - 10) / 2)}</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">体质</div>
                            <div style="font-weight: bold;">${con}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((con - 10) / 2) >= 0 ? '+' : ''}${Math.floor((con - 10) / 2)}</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">智力</div>
                            <div style="font-weight: bold;">${int}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((int - 10) / 2) >= 0 ? '+' : ''}${Math.floor((int - 10) / 2)}</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">感知</div>
                            <div style="font-weight: bold;">${wis}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((wis - 10) / 2) >= 0 ? '+' : ''}${Math.floor((wis - 10) / 2)}</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 10px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: #666;">魅力</div>
                            <div style="font-weight: bold;">${cha}</div>
                            <div style="font-size: 0.8rem; color: #888;">${Math.floor((cha - 10) / 2) >= 0 ? '+' : ''}${Math.floor((cha - 10) / 2)}</div>
                        </div>
                    </div>
                </div>

                ${char.inventory ? `
                <div style="margin-top: 15px;">
                    <h4 style="color: var(--brown-primary);">装备物品</h4>
                    <pre style="background: var(--bg-secondary); padding: 10px; border-radius: 4px; white-space: pre-wrap; font-family: inherit;">${char.inventory}</pre>
                </div>
                ` : ''}

                ${char.features ? `
                <div style="margin-top: 15px;">
                    <h4 style="color: var(--brown-primary);">职业特性</h4>
                    <pre style="background: var(--bg-secondary); padding: 10px; border-radius: 4px; white-space: pre-wrap; font-family: inherit;">${char.features}</pre>
                </div>
                ` : ''}
            </div>
        `;
    },

    // 编辑角色
    editCharacter(id) {
        this.currentId = id;
        const characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');
        const char = characters.find(c => c.id === id);
        if (!char) return;

        document.getElementById('form-title').textContent = '编辑角色卡';
        this.fillForm(char);
        this.switchView('form');
    },

    // 填充表单
    fillForm(char) {
        document.getElementById('char-id').value = char.id;
        document.getElementById('char-name').value = char.name || '';
        document.getElementById('char-player').value = char.player || '';
        document.getElementById('char-alignment').value = char.alignment || '';
        document.getElementById('char-background').value = char.background || '';

        // 主职业（兼容新旧数据）
        const mainClass = char.classes?.[0] || char;
        if (mainClass.classCustom) {
            document.getElementById('char-class-select').value = 'custom';
            document.getElementById('char-class-custom').style.display = 'block';
            document.getElementById('char-class-custom').value = mainClass.className || '';
        } else {
            document.getElementById('char-class-select').value = mainClass.classId || 'custom';
            document.getElementById('char-class-custom').style.display = 'none';
        }
        document.getElementById('char-subclass').value = mainClass.subclass || '';
        document.getElementById('char-level').value = mainClass.level || 1;

        // 种族
        if (char.raceCustom) {
            document.getElementById('char-race-select').value = 'custom';
            document.getElementById('char-race-custom').style.display = 'block';
            document.getElementById('char-race-custom').value = char.raceName || '';
        } else {
            document.getElementById('char-race-select').value = char.raceId || 'custom';
            document.getElementById('char-race-custom').style.display = 'none';
        }

        // 加载兼职
        const multiContainer = document.getElementById('multiclass-container');
        if (multiContainer) multiContainer.innerHTML = '';
        this.multiclassCount = 0;

        if (char.classes && char.classes.length > 1) {
            for (let i = 1; i < char.classes.length; i++) {
                this.addMulticlass(char.classes[i]);
            }
        }

        // 属性
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
            const score = char.abilities?.[ab] || 10;
            document.getElementById(`attr-${ab}`).value = score;
            this.calcModifier(ab);
            document.getElementById(`save-${ab}`).checked = char.savingThrows?.[ab] || false;
        });

        this.updateTotalLevel();

        // 战斗数据
        document.getElementById('char-hp-max').value = char.hpMax || 10;
        document.getElementById('char-hp-current').value = char.hpCurrent || char.hpMax || 10;
        document.getElementById('char-ac').value = char.ac || 10;
        document.getElementById('char-initiative').value = char.initiative || 0;
        document.getElementById('char-speed').value = char.speed || '30尺';
        document.getElementById('char-hit-dice').value = char.hitDice || '';

        // 技能
        if (char.skills) {
            char.skills.forEach(skillId => {
                const cb = document.getElementById(`skill-${skillId}`);
                if (cb) cb.checked = true;
            });
        }

        // 法术
        document.getElementById('spells-0').value = char.spells?.cantrips?.join(', ') || '';
        document.getElementById('spells-1').value = char.spells?.level1?.spells?.join(', ') || '';
        document.getElementById('spell-slots-1').value = char.spells?.level1?.slots || 0;
        document.getElementById('spells-2').value = char.spells?.level2?.spells?.join(', ') || '';
        document.getElementById('spell-slots-2').value = char.spells?.level2?.slots || 0;
        document.getElementById('spells-high').value = char.spells?.highLevel || '';

        // 其他
        document.getElementById('char-inventory').value = char.inventory || '';
        document.getElementById('char-features').value = char.features || '';
        document.getElementById('char-racial-traits').value = char.racialTraits || '';
        document.getElementById('char-backstory').value = char.backstory || '';
    },

    // 加载列表
    loadList() {
        const container = document.getElementById('character-list-container');
        const characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');

        if (characters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚔️</div>
                    <p>暂无角色卡，点击上方按钮创建</p>
                </div>
            `;
            return;
        }

        characters.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        container.innerHTML = characters.map(char => {
            // 计算总等级
            let totalLevel = 0;
            let classDisplay = '未知职业';

            if (char.classes && Array.isArray(char.classes) && char.classes.length > 0) {
                totalLevel = char.classes.reduce((sum, c) => sum + (parseInt(c.level) || 0), 0);
                const mainClass = char.classes[0];
                const className = mainClass.className || mainClass.classId || '未知';
                const multiTag = char.classes.length > 1 ? ` (+${char.classes.length - 1})` : '';
                classDisplay = className + multiTag;
            } else {
                totalLevel = parseInt(char.level) || 1;
                classDisplay = char.className || char.classId || char.class || '未知职业';
            }

            const hpCurrent = char.hpCurrent !== undefined ? char.hpCurrent : 0;
            const hpMax = char.hpMax !== undefined ? char.hpMax : 10;
            const raceDisplay = char.raceName || char.raceId || '';

            return `
            <div class="character-card" style="background: #FFFCF5; border: 2px solid #D4C4B0; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative;">
                <div onclick="characterModule.viewCharacter('${char.id}')" style="cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <h3 style="color: #8B4513; margin: 0; font-size: 1.3rem;">${char.name || '未命名'}</h3>
                        <span style="background: #8B4513; color: #FFF; padding: 2px 10px; border-radius: 12px; font-weight: 600;">Lv.${totalLevel}</span>
                    </div>
                    <div style="color: #5C4033; font-size: 0.9rem; margin-bottom: 8px;">
                        ${classDisplay}
                        ${raceDisplay ? `| ${raceDisplay}` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #888; border-top: 1px solid #eee; padding-top: 8px;">
                        <span>HP: ${hpCurrent}/${hpMax}</span>
                        <span>${char.updatedAt ? new Date(char.updatedAt).toLocaleDateString() : '未保存日期'}</span>
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                    <button class="btn" onclick="event.stopPropagation(); characterModule.editCharacter('${char.id}')" style="flex: 1;">编辑</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); characterModule.deleteCharacter('${char.id}')" style="flex: 1;">删除</button>
                </div>
            </div>
        `}).join('');
    },

    // 返回列表（容错版）
    backToList() {
        try {
            console.log('正在返回列表...');
            this.switchView('list');
            this.loadList();
            this.currentId = null;
        } catch (e) {
            console.error('返回列表失败:', e);
            alert('返回失败，请手动刷新页面');
            window.location.reload();
        }
    },

    // 切换视图（安全版）
    switchView(view) {
        try {
            const listView = document.getElementById('character-list-view');
            const formView = document.getElementById('character-form-view');
            const detailView = document.getElementById('character-detail-view');

            if (!listView) console.error('找不到 character-list-view');
            if (!formView) console.error('找不到 character-form-view');
            if (!detailView) console.error('找不到 character-detail-view');

            if (listView) listView.style.display = view === 'list' ? 'block' : 'none';
            if (formView) formView.style.display = view === 'form' ? 'block' : 'none';
            if (detailView) detailView.style.display = view === 'detail' ? 'block' : 'none';

            window.scrollTo(0, 0);
            console.log('已切换到视图:', view);
        } catch (e) {
            console.error('切换视图失败:', e);
        }
    },

    // 导出文字版
    exportText() {
        const characters = JSON.parse(localStorage.getItem('dnd_characters') || '[]');
        const char = characters.find(c => c.id === this.currentId);
        if (!char) return;

        const formatMod = (score) => {
            const mod = Math.floor((score - 10) / 2);
            return mod >= 0 ? `+${mod}` : mod;
        };

        let totalLevel = 0;
        let classesList = [];

        if (char.classes && Array.isArray(char.classes) && char.classes.length > 0) {
            totalLevel = char.classes.reduce((sum, c) => sum + (parseInt(c.level) || 0), 0);
            classesList = char.classes;
        } else {
            totalLevel = parseInt(char.level) || 1;
            classesList = [{
                className: char.className || char.classId || '未知职业',
                subclass: char.subclass,
                level: totalLevel
            }];
        }

        const profBonus = Math.floor((totalLevel - 1) / 4) + 2;

        let text = `═══════════════════════════════════\n`;
        text += `  ${char.name || '未命名角色'}\n`;
        text += `═══════════════════════════════════\n\n`;

        text += `【基础信息】\n`;
        text += `玩家：${char.player || '-'}\n`;
        text += `阵营：${char.alignment || '-'} | 背景：${char.background || '-'}\n`;
        const raceName = char.raceName || char.raceId || char.race || '-';
        text += `种族：${raceName}\n\n`;

        text += `【职业等级】总等级 ${totalLevel}（熟练加值 +${profBonus}）\n`;
        classesList.forEach((c, idx) => {
            const name = c.className || c.classId || '未知职业';
            const sub = c.subclass ? ` [${c.subclass}]` : '';
            const tag = idx === 0 ? '主' : '兼';
            text += `${tag}：${name}${sub} Lv.${c.level || 1}\n`;
        });
        text += `\n`;

        const hpCurrent = char.hpCurrent !== undefined ? char.hpCurrent : 0;
        const hpMax = char.hpMax !== undefined ? char.hpMax : 10;

        text += `【战斗数据】\n`;
        text += `HP：${hpCurrent}/${hpMax}\n`;
        text += `AC：${char.ac || 10} | 先攻：${char.initiative >= 0 ? '+' : ''}${char.initiative || 0}\n`;
        text += `速度：${char.speed || '30尺'}\n\n`;

        text += `【属性值】\n`;
        const abilityNames = { str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力' };
        const abilities = char.abilities || {};

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
            const score = parseInt(abilities[ab]) || 10;
            const mod = formatMod(score);
            const hasSave = char.savingThrows && char.savingThrows[ab];
            text += `${abilityNames[ab]}：${score} (${mod})${hasSave ? ' ★豁免' : ''}\n`;
        });

        if (char.skills && char.skills.length > 0) {
            text += `\n【技能熟练】\n`;
            const skillMap = {
                acrobatics: '杂技', animal_handling: '驯兽', arcana: '奥秘', athletics: '运动',
                deception: '欺瞒', history: '历史', insight: '洞悉', intimidation: '威吓',
                investigation: '调查', medicine: '医药', nature: '自然', perception: '察觉',
                performance: '表演', persuasion: '说服', religion: '宗教',
                sleight_of_hand: '巧手', stealth: '隐匿', survival: '生存'
            };
            text += char.skills.map(s => skillMap[s] || s).join('、') + '\n';
        }

        if (char.inventory) {
            text += `\n【装备物品】\n${char.inventory}\n`;
        }

        text += `\n═══════════════════════════════════\n`;
        text += `导出时间：${new Date().toLocaleString()}\n`;
        text += `DND 5E Toolkit`;

        this.downloadText(text, `${char.name || '角色卡'}.txt`);
    },

    // 导出图片
    async exportImage() {
        const element = document.getElementById('character-sheet-content');
        if (!element) {
            alert('未找到角色卡内容');
            return;
        }

        try {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '生成中...';
            btn.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                backgroundColor: '#FDF6E3',
                scale: 2,
                useCORS: true,
                logging: false
            });

            const link = document.createElement('a');
            const charName = document.getElementById('detail-name').textContent || '角色卡';
            link.download = `${charName}_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            btn.textContent = originalText;
            btn.disabled = false;
        } catch (err) {
            console.error('导出图片失败:', err);
            alert('导出图片失败，请重试');
        }
    },

    // 下载文本
    downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('已下载文件，同时内容已复制到剪贴板！');
            }).catch(() => {
                alert('已下载为文本文件！');
            });
        } else {
            alert('已下载为文本文件！');
        }
    },

    // 处理主职业变化
    handleClassChange() {
        const select = document.getElementById('char-class-select');
        const input = document.getElementById('char-class-custom');
        if (select && input) {
            if (select.value === 'custom') {
                input.style.display = 'block';
                input.focus();
            } else {
                input.style.display = 'none';
            }
        }
    },

    // 处理种族变化
    handleRaceChange() {
        const select = document.getElementById('char-race-select');
        const input = document.getElementById('char-race-custom');
        if (select && input) {
            if (select.value === 'custom') {
                input.style.display = 'block';
                input.focus();
            } else {
                input.style.display = 'none';
            }
        }
    },

    // 计算调整值
    calcModifier(ability) {
        const scoreInput = document.getElementById(`attr-${ability}`);
        if (!scoreInput) return;

        const score = parseInt(scoreInput.value) || 10;
        const mod = Math.floor((score - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : mod;

        const modDisplay = document.getElementById(`mod-${ability}`);
        if (modDisplay) modDisplay.textContent = modStr;

        if (ability === 'dex') {
            const initInput = document.getElementById('char-initiative');
            if (initInput && (!initInput.value || initInput.dataset.auto === 'true')) {
                initInput.value = mod;
                initInput.dataset.auto = 'true';
            }
        }
    },

    // 更新熟练加值显示
    updateProficiency() {
        this.updateTotalLevel();
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    characterModule.init();
});