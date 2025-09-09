// 全域變數
let currentConfigs = [];
let selectedConfig = null;

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化應用程式
async function initializeApp() {
    setupEventListeners();
    await loadConfigs();
}

// 設置事件監聽器
function setupEventListeners() {
    // 側邊欄導航
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

// 切換標籤頁功能已移至 utils.js


// 載入配置列表
async function loadConfigs() {
    try {
        const response = await fetch('/api/configs');
        const configs = await response.json();
        currentConfigs = configs; // 更新全域變數
        
        const container = document.getElementById('configList');
        
        if (currentConfigs.length === 0) {
            container.innerHTML = '<p class="text-muted">暫無配置檔案</p>';
            return;
        }
        
        const html = currentConfigs.map(config => `
            <div class="card mb-2 config-item" data-config-id="${config.id}" onclick="selectConfig('${config.id}')" style="cursor: pointer;">
                <div class="card-body p-3">
                    <h6 class="card-title">${config.name}</h6>
                    <p class="card-text small text-muted">
                        <i class="fas fa-file me-1"></i>配置檔案: ${config.filename}
                    </p>
                    <div class="btn-group btn-group-sm" onclick="event.stopPropagation();">
                        <button class="btn btn-outline-success" onclick="runConfig('${config.id}')">
                            <i class="fas fa-play"></i> 執行
                        </button>
                        <button class="btn btn-outline-primary" onclick="editConfig('${config.id}')">
                            <i class="fas fa-edit"></i> 編輯
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteConfig('${config.id}')">
                            <i class="fas fa-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('載入配置失敗:', error);
        showAlert('載入配置失敗', 'danger');
    }
}

// 選擇配置
async function selectConfig(configId) {
    try {
        // 更新選中狀態
        document.querySelectorAll('.config-item').forEach(item => {
            item.classList.remove('border-primary', 'bg-light');
        });
        document.querySelector(`[data-config-id="${configId}"]`).classList.add('border-primary', 'bg-light');
        
        const response = await fetch(`/api/configs/${configId}`);
        const config = await response.json();
        
        selectedConfig = config;
        
        // 顯示配置詳情
        showConfigDetails(config);
        
    } catch (error) {
        console.error('載入配置詳情失敗:', error);
        showAlert('載入配置詳情失敗', 'danger');
    }
}

// 顯示配置詳情
function showConfigDetails(config) {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏表單，顯示詳情
    configForm.style.display = 'none';
    configFormActions.style.display = 'none';
    configDetails.style.display = 'block';
    configFormTitle.textContent = '配置詳情';
    
    // 顯示配置詳情
    configDetails.innerHTML = `
        <div class="row">
            <div class="col-12">
                <h6 class="text-primary mb-3">${config.name}</h6>
            <div class="mb-3">
                    <strong>配置檔案:</strong> ${config.filename}
            </div>
            <div class="mb-3">
                    <strong>創建時間:</strong> ${new Date(config.created_at).toLocaleString('zh-TW')}
            </div>
                <div class="mb-3">
                    <strong>配置內容:</strong>
                    <pre class="bg-light p-3 rounded mt-2" style="max-height: 400px; overflow-y: auto;">${config.content}</pre>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="editConfig('${config.id}')">
                        <i class="fas fa-edit"></i> 編輯配置
                </button>
                    <button class="btn btn-success" onclick="runConfig('${config.id}')">
                        <i class="fas fa-play"></i> 執行配置
                    </button>
                    <button class="btn btn-danger" onclick="deleteConfig('${config.id}')">
                        <i class="fas fa-trash"></i> 刪除配置
                </button>
                </div>
            </div>
            </div>
        `;
}

// 編輯配置
async function editConfig(configId) {
    try {
        const response = await fetch(`/api/configs/${configId}`);
        const config = await response.json();
        
        selectedConfig = config;
        
        // 顯示編輯表單
        await showConfigForm(config, true);
        
    } catch (error) {
        console.error('載入配置詳情失敗:', error);
        showAlert('載入配置詳情失敗', 'danger');
    }
}

// 顯示新增配置表單
function showNewConfigForm() {
    selectedConfig = null;
    showConfigForm(null, false);
}

// 顯示配置表單
async function showConfigForm(config, isEdit) {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏詳情，顯示表單
    configDetails.style.display = 'none';
    configForm.style.display = 'block';
    configFormActions.style.display = 'block';
    configFormTitle.textContent = isEdit ? '編輯配置' : '新增配置';
    
    // 生成表單HTML
    configForm.innerHTML = generateConfigFormHTML();
    
    // 如果是編輯模式，載入配置數據
    if (isEdit && config) {
        await loadConfigToForm(config);
    } else {
        // 新增模式，重置表單
        resetScoringCriteriaList();
    }
}

// 生成配置表單HTML
function generateConfigFormHTML() {
    return `
        <form id="configFormContent" onsubmit="return false;">
            <!-- 基本資訊 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="text-primary"><i class="fas fa-info-circle me-2"></i>基本資訊</h6>
                </div>
                <div class="col-md-12">
                    <label class="form-label">配置名稱 *</label>
                    <input type="text" class="form-control" id="configName" placeholder="例如：台電客服評測" required>
                    <small class="form-text text-muted">請勿使用特殊字符: < > : " / \\ | ? *</small>
                </div>
            </div>

            <!-- 被測API配置 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="text-primary"><i class="fas fa-robot me-2"></i>被測API配置</h6>
                    <p class="text-muted small">配置要測試的API端點</p>
                </div>
            </div>

            <!-- HTTP Request 配置 -->
            <div class="row mb-4">
                <div class="col-12">
                    <label class="form-label">HTTP Request 配置 *</label>
                    <div class="card">
                        <div class="card-body">
                            <!-- HTTP 方法 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">POST</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpPath" placeholder="/eval HTTP/1.1" required>
                                </div>
                            </div>
                            
                            <!-- Host -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Host:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpHost" placeholder="localhost:5000" required>
                                </div>
                            </div>
                            
                            <!-- Content-Type -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Content-Type:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpContentType" placeholder="application/json" required>
                                </div>
                            </div>
                            
                            <!-- Request Body -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Request Body:</label>
                                </div>
                                <div class="col-md-9">
                                    <textarea class="form-control" id="requestBody" rows="4" placeholder='{"question": "{{prompt}}"}' required></textarea>
                                    <small class="form-text text-muted">必須包含 {{prompt}} 變量</small>
                                </div>
                            </div>
                            
                            <!-- Transform Response -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Transform Response:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="transformResponse" placeholder="json.response" required>
                                    <small class="form-text text-muted">從API回應中提取內容的JavaScript表達式</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 測試問題配置 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="text-primary"><i class="fas fa-question-circle me-2"></i>測試問題配置</h6>
                    <p class="text-muted small">選擇測試問題的來源</p>
                </div>
                <div class="col-md-12">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="questionSource" id="questionSourceManual" value="manual" checked onchange="toggleQuestionInput()">
                        <label class="form-check-label" for="questionSourceManual">手動輸入</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="questionSource" id="questionSourceUpload" value="upload" onchange="toggleQuestionInput()">
                        <label class="form-check-label" for="questionSourceUpload">上傳CSV檔案</label>
                    </div>
                </div>
            </div>

            <!-- 手動輸入問題 -->
            <div id="manualQuestionsSection" class="row mb-4">
                <div class="col-12">
                    <label class="form-label">測試問題</label>
                    <textarea class="form-control" id="testQuestions" rows="6" placeholder="請輸入測試問題，每行一個問題&#10;例如：&#10;什麼是台電？&#10;如何申請用電？&#10;電費如何計算？&#10;&#10;注意：如果配置中已有 tests 檔案，此處可留空"></textarea>
                    <small class="form-text text-muted">每行一個問題（可選，如果已有測試檔案可留空）</small>
                </div>
            </div>

            <!-- 檔案上傳 -->
            <div id="fileUploadSection" class="row mb-4" style="display: none;">
                <div class="col-12">
                    <label class="form-label">上傳CSV檔案</label>
                    <input type="file" class="form-control" id="questionFile" accept=".csv" onchange="handleFileUpload()">
                    <small class="form-text text-muted">CSV檔案格式：第一行為標題（如：question），後續行為問題內容（可選）</small>
                </div>
            </div>

            <!-- 評分標準配置 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="text-primary"><i class="fas fa-star me-2"></i>評分標準配置</h6>
                    <p class="text-muted small">選擇評分方式</p>
                </div>
                <div class="col-md-12">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="enableJavascript" onchange="toggleJavascriptConfig()">
                        <label class="form-check-label" for="enableJavascript">JavaScript 驗證</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="enableGEval" onchange="toggleGEvalConfig()">
                        <label class="form-check-label" for="enableGEval">G-Eval (LLM評分)</label>
                    </div>
                </div>
            </div>

            <!-- JavaScript 配置 -->
            <div id="javascriptConfig" class="row mb-4" style="display: none;">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">JavaScript 驗證配置</h6>
                            <div class="mb-3">
                                <label class="form-label">驗證條件</label>
                                <select class="form-select" id="javascriptCondition" onchange="updateJavascriptCondition()">
                                    <option value="length">回覆長度檢查</option>
                                    <option value="custom">自定義條件</option>
                                </select>
                            </div>
                            <div id="lengthConfig">
                                <label class="form-label">最小長度</label>
                                <input type="number" class="form-control" id="minLength" value="100" min="1">
                            </div>
                            <div id="customConfig" style="display: none;">
                                <label class="form-label">自定義JavaScript表達式</label>
                                <input type="text" class="form-control" id="customJavascript" placeholder="例如：output.includes('台電')">
                                <small class="form-text text-muted">使用JavaScript表達式，output變數代表AI回答</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- G-Eval 配置 -->
            <div id="gevalConfig" class="row mb-4" style="display: none;">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">G-Eval 評分配置</h6>
                            <div class="mb-3">
                                <label class="form-label">評分標準</label>
                                <div id="gevalCriteriaList">
                                    <div class="input-group mb-2">
                                        <input type="text" class="form-control" placeholder="例如：不回答與旅行無關的問題">
                                        <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="addGEvalCriteria()">
                                    <i class="fas fa-plus"></i> 添加評分標準
                                </button>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">評分模型類型</label>
                                <select class="form-select" id="gradingModelType" onchange="updateGradingModelFields()">
                                    <option value="openai">OpenAI</option>
                                    <option value="http">HTTP API</option>
                                </select>
                            </div>
                            <div id="openaiConfig">
                                <div class="mb-3">
                                    <label class="form-label">OpenAI 模型</label>
                                    <select class="form-select" id="openaiModel">
                                        <option value="gpt-4">GPT-4</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </select>
                                </div>
                            </div>
                            <div id="httpGradingConfig" style="display: none;">
                                <div class="mb-3">
                                    <label class="form-label">評分API URL</label>
                                    <input type="url" class="form-control" id="gradingApiUrl" placeholder="https://api.openai.com/v1/chat/completions">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">API Key</label>
                                    <input type="text" class="form-control" id="gradingApiKey" placeholder="Bearer your-api-key">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">模型名稱</label>
                                    <input type="text" class="form-control" id="gradingModel" placeholder="gpt-4">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Transform Response</label>
                                    <input type="text" class="form-control" id="gradingTransformResponse" value="json.choices[0].message.content">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;
}

// 顯示當前測試問題信息
function showCurrentTestInfo(yamlContent) {
    let testInfoHtml = '';
    
    // 優先檢查 tests: 是否有具體檔案
    if (yamlContent.includes('tests:')) {
        const testsMatch = yamlContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (testsMatch) {
            const tests = testsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*/, ''))
                .filter(line => line.trim());
            if (tests.length > 0) {
                // 解析檔案名稱（處理 file:// 前綴）
                const fileNames = tests.map(file => {
                    if (file.startsWith('file://')) {
                        return file.replace('file://', '');
                    }
                    return file;
                });
                
                testInfoHtml = `
                    <div class="alert alert-info mb-4">
                        <i class="fas fa-file-csv me-2"></i>
                        <strong>目前配置的測試檔案：</strong><br>
                        ${fileNames.map(file => `• ${file}`).join('<br>')}
                    </div>
                `;
            }
        }
    }
    // 如果沒有 tests: 或 tests: 為空，再檢查 prompts:
    else if (yamlContent.includes('prompts:')) {
        const promptsMatch = yamlContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
        if (promptsMatch) {
            const prompts = promptsMatch[1].trim().split('\n')
                .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']$/, ''))
                .filter(line => line.trim() && !line.includes('{{question}}') && !line.includes('{{prompt}}'));
            
            if (prompts.length > 0) {
                testInfoHtml = `
                    <div class="alert alert-info mb-4">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>目前配置的測試問題（${prompts.length} 個）：</strong><br>
                        ${prompts.slice(0, 3).map(q => `• ${q}`).join('<br>')}
                        ${prompts.length > 3 ? `<br>• ... 還有 ${prompts.length - 3} 個問題` : ''}
                    </div>
                `;
            } else {
                testInfoHtml = `
                    <div class="alert alert-warning mb-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>檢測到 prompts 配置但沒有具體問題</strong>
                    </div>
                `;
            }
        }
    }
    
    // 將測試問題提醒插入到測試問題配置區域
    if (testInfoHtml) {
        // 使用 setTimeout 確保 DOM 已經渲染完成
        setTimeout(() => {
            // 尋找測試問題配置的標題元素
            const questionConfigTitle = Array.from(document.querySelectorAll('h6')).find(h6 => 
                h6.textContent.includes('測試問題配置')
            );
            
            if (questionConfigTitle) {
                // 移除舊的提醒
                const existingAlert = questionConfigTitle.parentElement.querySelector('.alert');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                // 在測試問題配置標題後插入提醒
                const infoDiv = document.createElement('div');
                infoDiv.innerHTML = testInfoHtml;
                questionConfigTitle.parentElement.insertBefore(infoDiv.firstElementChild, questionConfigTitle.nextElementSibling);
            }
        }, 100);
    }
}

// 將配置載入到表單中
async function loadConfigToForm(config) {
    try {
        console.log('開始載入配置到表單:', config);
        
        // 解析 YAML 配置
        const yamlContent = config.content;
        console.log('YAML 內容:', yamlContent);
        
        // 檢查並顯示當前配置的測試問題信息
        showCurrentTestInfo(yamlContent);
        
        // 基本資訊
        const descriptionMatch = yamlContent.match(/description:\s*["']?([^"'\n]+)["']?/);
        if (descriptionMatch) {
            document.getElementById('configName').value = descriptionMatch[1];
            console.log('設置配置名稱:', descriptionMatch[1]);
        }
        
        // 檢查是否有 providers 配置（格式一）
        if (yamlContent.includes('providers:')) {
            // 解析 request 格式
            const requestMatch = yamlContent.match(/request:\s*\|\s*\n((?:.*\n)*?)(?=\n\s*transformResponse|\n\s*[a-zA-Z]|\n\s*$)/);
            if (requestMatch) {
                const requestLines = requestMatch[1].trim().split('\n');
                
                // 解析第一行：POST /eval HTTP/1.1
                if (requestLines.length > 0) {
                    const firstLine = requestLines[0].trim();
                    const methodMatch = firstLine.match(/^(\w+)\s+(.+)$/);
                    if (methodMatch) {
                        document.getElementById('httpPath').value = methodMatch[2];
                    }
                }
                
                // 解析 Host
                const hostLine = requestLines.find(line => line.trim().startsWith('Host:'));
                if (hostLine) {
                    const hostValue = hostLine.replace('Host:', '').trim();
                    document.getElementById('httpHost').value = hostValue;
                }
                
                // 解析 Content-Type
                const contentTypeLine = requestLines.find(line => line.trim().startsWith('Content-Type:'));
                if (contentTypeLine) {
                    const contentTypeValue = contentTypeLine.replace('Content-Type:', '').trim();
                    document.getElementById('httpContentType').value = contentTypeValue;
                }
                
                // 解析 body
                const bodyStart = requestLines.findIndex(line => line.trim() === '');
                if (bodyStart !== -1 && bodyStart < requestLines.length - 1) {
                    const bodyLines = requestLines.slice(bodyStart + 1);
                    // 過濾掉 transformResponse 相關的內容和空白行
                    const filteredBodyLines = bodyLines.filter(line => 
                        !line.trim().startsWith('transformResponse:') && 
                        line.trim() !== ''
                    );
                    // 移除開頭的空白行
                    const trimmedBodyLines = filteredBodyLines.filter((line, index) => {
                        // 如果是第一行且為空，則跳過
                        if (index === 0 && line.trim() === '') {
                            return false;
                        }
                        return true;
                    });
                    document.getElementById('requestBody').value = trimmedBodyLines.join('\n');
                }
            }
            
            // 解析 transformResponse
            const transformMatch = yamlContent.match(/transformResponse:\s*([^\n]+)/);
            if (transformMatch) {
                document.getElementById('transformResponse').value = transformMatch[1].trim();
            }
        }
        
        // 測試問題信息已在 showCurrentTestInfo 函數中處理
        
        // 檢查評分標準
        if (yamlContent.includes('assert:')) {
            // 檢查 JavaScript 驗證
            if (yamlContent.includes('type: javascript')) {
                document.getElementById('enableJavascript').checked = true;
                toggleJavascriptConfig();
                
                const jsMatch = yamlContent.match(/type:\s*javascript\s*\n\s*value:\s*([^\n]+)/);
                if (jsMatch) {
                    const jsValue = jsMatch[1].trim();
                    if (jsValue.includes('length')) {
                        document.getElementById('javascriptCondition').value = 'length';
                        updateJavascriptCondition();
                        
                        const lengthMatch = jsValue.match(/length\s*>=\s*(\d+)/);
                        if (lengthMatch) {
                            document.getElementById('minLength').value = lengthMatch[1];
                        }
                    } else {
                        document.getElementById('javascriptCondition').value = 'custom';
                        updateJavascriptCondition();
                        document.getElementById('customJavascript').value = jsValue;
                    }
                }
            }
            
            // 檢查 G-Eval
            if (yamlContent.includes('type: g-eval') || yamlContent.includes('type: llm-rubric')) {
                document.getElementById('enableGEval').checked = true;
                toggleGEvalConfig();
                
                // 嘗試解析 G-Eval 配置
                const gevalMatch = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*([^\n]+)/);
                if (gevalMatch) {
                    // 清空現有的評分標準列表
                    const gevalCriteriaList = document.getElementById('gevalCriteriaList');
                    gevalCriteriaList.innerHTML = '';
                    
                    // 解析多行評分標準
                    const valueSection = yamlContent.match(/type:\s*(?:g-eval|llm-rubric)\s*\n\s*value:\s*\n((?:\s*-\s*.*\n?)*)/);
                    if (valueSection) {
                        const criteria = valueSection[1].trim().split('\n')
                            .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']$/, ''))
                            .filter(line => line.trim());
                        
                        criteria.forEach(criterion => {
                            addGEvalCriteria();
                            const criteriaInputs = document.querySelectorAll('#gevalCriteriaList .input-group:last-child input');
                            if (criteriaInputs.length > 0) {
                                criteriaInputs[0].value = criterion;
                            }
                        });
                    } else {
                        // 單行評分標準
                        addGEvalCriteria();
                        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList .input-group:last-child input');
                        if (criteriaInputs.length > 0) {
                            criteriaInputs[0].value = gevalMatch[1].replace(/["']/g, '');
                        }
                    }
                }
            }
        }
        
        console.log('配置已成功載入到表單');
        
    } catch (error) {
        console.error('載入配置到表單失敗:', error);
        showAlert('載入配置到表單失敗', 'danger');
    }
}

// 顯示進階配置編輯
function showAdvancedConfig() {
    showAlert('進階編輯功能開發中...', 'info');
}

// 重置評分標準列表
function resetScoringCriteriaList() {
    // 重置 API 配置
    document.getElementById('httpPath').value = '';
    document.getElementById('httpHost').value = '';
    document.getElementById('httpContentType').value = 'application/json';
    document.getElementById('requestBody').value = '';
    document.getElementById('transformResponse').value = 'json.response';
    
    // 重置問題輸入方式
    document.getElementById('questionSourceManual').checked = true;
    document.getElementById('testQuestions').value = '';
    document.getElementById('questionFile').value = '';
    toggleQuestionInput();
    
    // 重置 JavaScript 配置
    document.getElementById('enableJavascript').checked = false;
    document.getElementById('javascriptConfig').style.display = 'none';
    document.getElementById('javascriptCondition').value = 'length';
    document.getElementById('minLength').value = '100';
    document.getElementById('customJavascript').value = '';
    updateJavascriptCondition();
    
    // 重置 G-Eval 配置
    document.getElementById('enableGEval').checked = false;
    document.getElementById('gevalConfig').style.display = 'none';
    document.getElementById('gradingModelType').value = 'openai';
    document.getElementById('openaiModel').value = 'gpt-4';
    document.getElementById('gradingApiUrl').value = '';
    document.getElementById('gradingApiKey').value = '';
    document.getElementById('gradingModel').value = '';
    document.getElementById('gradingTransformResponse').value = 'json.choices[0].message.content';
    updateGradingModelFields();
    
    // 重置 G-Eval 評分標準列表
    const gevalCriteriaList = document.getElementById('gevalCriteriaList');
    gevalCriteriaList.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="例如：不回答與旅行無關的問題">
            <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}











// 預覽配置
function previewConfig() {
    const config = generateConfigFromForm();
    const preview = document.getElementById('configPreview');
    preview.textContent = config;
    new bootstrap.Modal(document.getElementById('configPreviewModal')).show();
}

// 從表單生成配置
function generateConfigFromForm() {
    const configName = document.getElementById('configName').value;
    
    // 獲取被測API配置
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const requestBody = document.getElementById('requestBody').value;
    const transformResponse = document.getElementById('transformResponse').value;
    
    // 獲取測試問題配置
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
    let testsConfig = '';
    
    if (questionSource === 'manual') {
        // 手動輸入模式：生成 prompts 配置
        const testQuestions = document.getElementById('testQuestions').value;
        const questions = testQuestions.split('\n').filter(q => q.trim()).map(q => q.trim());
        if (questions.length > 0) {
            testsConfig = questions.map(q => `  - "${q}"`).join('\n');
        }
    } else if (questionSource === 'upload') {
        // 檔案上傳模式：生成 tests 配置
        const questionFile = document.getElementById('questionFile').files[0];
        if (questionFile) {
            testsConfig = `  - file://${questionFile.name}`;
        }
    }
    
    // 生成Providers配置（格式一）
    let providersConfig = '';
    
    if (httpPath && httpHost && httpContentType && requestBody) {
        providersConfig = `providers:
  - id: http
    config:`;
        
        // 構建 request 內容
        // 確保 requestBody 沒有開頭的空白行
        const trimmedRequestBody = requestBody.trim();
        let requestContent = `POST ${httpPath}\nHost: ${httpHost}\nContent-Type: ${httpContentType}\n\n${trimmedRequestBody}`;
        
        // 添加 request 配置
        providersConfig += `\n      request: |\n${requestContent.split('\n').map(line => `        ${line}`).join('\n')}`;
        
        // 添加 transformResponse
        if (transformResponse.trim()) {
            providersConfig += `\n      transformResponse: ${transformResponse}`;
        }
    }
    
    // 生成評分標準配置
    let assertConfig = '';
    const asserts = [];
    
    // JavaScript 評分
    if (document.getElementById('enableJavascript').checked) {
        const condition = document.getElementById('javascriptCondition').value;
        if (condition === 'length') {
            const minLength = document.getElementById('minLength').value;
            asserts.push(`  - type: javascript
    value: output.length >= ${minLength}`);
        } else if (condition === 'custom') {
            const customJs = document.getElementById('customJavascript').value;
            if (customJs.trim()) {
                asserts.push(`  - type: javascript
    value: ${customJs.trim()}`);
            }
        }
    }
    
    // G-Eval 評分
    if (document.getElementById('enableGEval').checked) {
        const criteriaInputs = document.querySelectorAll('#gevalCriteriaList input[type="text"]');
        const criteria = [];
        criteriaInputs.forEach(input => {
            if (input.value.trim()) {
                criteria.push(input.value.trim());
            }
        });
        
        if (criteria.length > 0) {
            let gevalConfig = `  - type: g-eval
    value:`;
            criteria.forEach(criterion => {
                gevalConfig += `\n      - ${criterion}`;
            });
            
            // 添加評分模型配置
            const gradingModelType = document.getElementById('gradingModelType').value;
            if (gradingModelType === 'openai') {
                const openaiModel = document.getElementById('openaiModel').value;
                gevalConfig += `\n  options:
    provider: openai:${openaiModel}`;
            } else if (gradingModelType === 'http') {
                const gradingApiUrl = document.getElementById('gradingApiUrl').value;
                const gradingApiKey = document.getElementById('gradingApiKey').value;
                const gradingModel = document.getElementById('gradingModel').value;
                const gradingTransformResponse = document.getElementById('gradingTransformResponse').value;
                
                if (gradingApiUrl && gradingApiKey && gradingModel) {
                    gevalConfig += `\n  options:
    provider:
      id: http
    config:
        url: ${gradingApiUrl}
      method: POST
      headers:
        Content-Type: application/json
          Authorization: ${gradingApiKey}
      body:
          model: ${gradingModel}
        messages:
          - role: user
              content: "回覆時使用繁體中文，{{prompt}}"
        transformResponse: ${gradingTransformResponse}`;
                }
            }
            
            asserts.push(gevalConfig);
        }
    }
    
    if (asserts.length > 0) {
        assertConfig = 'assert:\n' + asserts.join('\n');
    }
    
    // 生成完整配置
    let config = `description: "${configName}"`;

    if (providersConfig) {
        config += `\n\n${providersConfig}`;
    }
    
    // 處理測試問題配置 - 保留原有的 prompts 和 tests 欄位
    if (testsConfig) {
        if (questionSource === 'manual') {
            // 手動輸入模式：使用 prompts
            config += `\n\nprompts:\n${testsConfig}`;
        } else if (questionSource === 'upload') {
            // 檔案上傳模式：使用 tests
            config += `\n\ntests:\n${testsConfig}`;
        }
    }
    
    // 如果沒有新的測試配置，但原有配置中有 prompts 或 tests，需要保留
    if (!testsConfig && selectedConfig) {
        const originalContent = selectedConfig.content;
        
        // 檢查原有配置中是否有 prompts
        if (originalContent.includes('prompts:')) {
            const promptsMatch = originalContent.match(/prompts:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (promptsMatch) {
                const promptsContent = promptsMatch[1].trim();
                if (promptsContent) {
                    config += `\n\nprompts:\n${promptsContent}`;
                }
            }
        }
        
        // 檢查原有配置中是否有 tests
        if (originalContent.includes('tests:')) {
            const testsMatch = originalContent.match(/tests:\s*\n((?:.*\n)*?)(?=\n\s*[a-zA-Z]|\n\s*$)/);
            if (testsMatch) {
                const testsContent = testsMatch[1].trim();
                if (testsContent) {
                    config += `\n\ntests:\n${testsContent}`;
                }
            }
        }
    }
    
    // 如果有評分標準，使用 defaultTest 格式
    if (assertConfig) {
        // 檢查是否有 G-Eval 評分
        const hasGEval = document.getElementById('enableGEval').checked;
        
        if (hasGEval) {
            // 有 G-Eval 評分，需要完整的 options 配置
            config += `\n\ndefaultTest:\n  options:\n    provider:\n      id: http\n  ${assertConfig}`;
        } else {
            // 沒有 G-Eval 評分，只需要 assert 配置，不包含 options
            config += `\n\ndefaultTest:\n  ${assertConfig}`;
        }
    }
    
    console.log('最終生成的配置:', config);
    return config;
}

// 切換 JavaScript 配置顯示
function toggleJavascriptConfig() {
    const checkbox = document.getElementById('enableJavascript');
    const config = document.getElementById('javascriptConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 切換 G-Eval 配置顯示
function toggleGEvalConfig() {
    const checkbox = document.getElementById('enableGEval');
    const config = document.getElementById('gevalConfig');
    config.style.display = checkbox.checked ? 'block' : 'none';
}

// 更新 JavaScript 條件配置
function updateJavascriptCondition() {
    const condition = document.getElementById('javascriptCondition').value;
    const lengthConfig = document.getElementById('lengthConfig');
    const customConfig = document.getElementById('customConfig');
    
    if (condition === 'length') {
        lengthConfig.style.display = 'block';
        customConfig.style.display = 'none';
    } else if (condition === 'custom') {
        lengthConfig.style.display = 'none';
        customConfig.style.display = 'block';
    }
}

// 更新評分模型配置
function updateGradingModelFields() {
    const modelType = document.getElementById('gradingModelType').value;
    const openaiConfig = document.getElementById('openaiConfig');
    const httpConfig = document.getElementById('httpGradingConfig');
    
    if (modelType === 'openai') {
        openaiConfig.style.display = 'block';
        httpConfig.style.display = 'none';
    } else if (modelType === 'http') {
        openaiConfig.style.display = 'none';
        httpConfig.style.display = 'block';
    }
}

// 添加 G-Eval 評分標準
function addGEvalCriteria() {
    const list = document.getElementById('gevalCriteriaList');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control" placeholder="例如：不回答與旅行無關的問題">
        <button type="button" class="btn btn-outline-danger" onclick="removeGEvalCriteria(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    list.appendChild(div);
}

// 移除 G-Eval 評分標準
function removeGEvalCriteria(button) {
    button.parentElement.remove();
}





// 處理檔案上傳
function handleFileUpload() {
    const fileInput = document.getElementById('questionFile');
    const file = fileInput.files[0];
    
    if (file) {
        console.log('選擇的檔案:', file.name);
        // 這裡可以添加檔案驗證邏輯
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showAlert('請選擇CSV檔案', 'warning');
            fileInput.value = '';
            return;
        }
    }
}

// 讀取檔案為 Base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // 移除 data:type;base64, 前綴
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 切換問題輸入方式
function toggleQuestionInput() {
    const questionSource = document.querySelector('input[name="questionSource"]:checked');
    if (!questionSource) return;
    
    const questionSourceValue = questionSource.value;
    const manualSection = document.getElementById('manualQuestionsSection');
    const fileUploadSection = document.getElementById('fileUploadSection');
    const testQuestions = document.getElementById('testQuestions');
    
    console.log('切換問題輸入方式:', questionSourceValue);
    
    if (questionSourceValue === 'manual') {
        // 手動輸入模式：顯示手動輸入區域，隱藏檔案上傳
        if (manualSection) {
            manualSection.style.display = 'block';
            console.log('設置 manualSection display: block');
        }
        if (fileUploadSection) {
            fileUploadSection.style.display = 'none';
            console.log('設置 fileUploadSection display: none');
        }
        if (testQuestions) testQuestions.required = false;
        console.log('切換到手動輸入模式');
    } else if (questionSourceValue === 'upload') {
        // 檔案上傳模式：隱藏手動輸入區域，顯示檔案上傳
        if (manualSection) {
            manualSection.style.display = 'none';
            console.log('設置 manualSection display: none');
        }
        if (fileUploadSection) {
            fileUploadSection.style.display = 'block';
            console.log('設置 fileUploadSection display: block');
        }
        if (testQuestions) testQuestions.required = false;
        console.log('切換到檔案上傳模式');
    }
}


// 保存配置表單
async function saveConfigForm() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的配置內容:', config);
        console.log('配置名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新配置還是更新現有配置
        const isEdit = selectedConfig && selectedConfig.id;
        const url = isEdit ? `/api/configs/${selectedConfig.id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '配置更新成功' : '配置創建成功', 'success');
            await loadConfigs();
            
            // 如果是編輯模式，顯示更新後的配置詳情
            if (isEdit) {
                await selectConfig(selectedConfig.id);
            } else {
                // 新增模式，隱藏表單，顯示提示
                hideConfigForm();
            }
        } else {
            showAlert((isEdit ? '更新' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('保存配置失敗:', error);
        showAlert('保存配置失敗', 'danger');
    }
}

// 取消配置表單
function cancelConfigForm() {
    hideConfigForm();
}

// 隱藏配置表單
function hideConfigForm() {
    const configDetails = document.getElementById('configDetails');
    const configForm = document.getElementById('configForm');
    const configFormTitle = document.getElementById('configFormTitle');
    const configFormActions = document.getElementById('configFormActions');
    
    // 隱藏表單，顯示詳情
    configForm.style.display = 'none';
    configFormActions.style.display = 'none';
    configDetails.style.display = 'block';
    configFormTitle.textContent = '配置詳情';
    
    // 如果有選中的配置，顯示其詳情
    if (selectedConfig) {
        showConfigDetails(selectedConfig);
    } else {
        // 沒有選中配置，顯示提示
        configDetails.innerHTML = '<p class="text-muted">請選擇一個配置檔案查看詳情，或點擊「新增配置」創建新配置</p>';
    }
}

// 保存友善配置（保留用於模態框）
async function saveFriendlyConfig() {
    try {
        // 驗證表單
        if (!validateFriendlyForm()) {
            return;
        }
        
        const config = generateConfigFromForm();
        const name = document.getElementById('configName').value;
        
        // 處理檔案上傳
        let uploadedFile = null;
        const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
        const questionSource = questionSourceRadio ? questionSourceRadio.value : 'manual';
        if (questionSource === 'upload') {
            const questionFile = document.getElementById('questionFile').files[0];
            if (questionFile) {
                const fileContent = await readFileAsBase64(questionFile);
                uploadedFile = {
                    filename: questionFile.name,
                    content: fileContent
                };
            }
        }
        
        console.log('生成的配置內容:', config);
        console.log('配置名稱:', name);
        console.log('上傳檔案:', uploadedFile);
        
        // 判斷是創建新配置還是更新現有配置
        const isEdit = selectedConfig && selectedConfig.id;
        const url = isEdit ? `/api/configs/${selectedConfig.id}` : '/api/configs';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                content: config,
                uploadedFile: uploadedFile
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? '配置更新成功' : '配置創建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('friendlyConfigModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('configPreviewModal')).hide();
            await loadConfigs();
            // 清除選中的配置
            selectedConfig = null;
        } else {
            showAlert((isEdit ? '更新' : '創建') + '失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('創建配置失敗:', error);
        showAlert('創建配置失敗', 'danger');
    }
}

// 驗證友善表單
function validateFriendlyForm() {
    const configName = document.getElementById('configName').value;
    const httpPath = document.getElementById('httpPath').value;
    const httpHost = document.getElementById('httpHost').value;
    const httpContentType = document.getElementById('httpContentType').value;
    const requestBody = document.getElementById('requestBody').value;
    const testQuestions = document.getElementById('testQuestions').value;
    const questionSource = document.getElementById('questionSource').value;
    
    if (!configName.trim()) {
        showAlert('請輸入配置名稱', 'warning');
        return false;
    }
    
    // 檢查配置名稱是否包含無效字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(configName)) {
        showAlert('配置名稱不能包含以下字符: < > : " / \\ | ? *', 'warning');
        return false;
    }
    
    // 驗證 HTTP Request 配置
    if (!httpPath.trim()) {
        showAlert('請輸入 HTTP 路徑', 'warning');
        return false;
    }
    
    if (!httpHost.trim()) {
        showAlert('請輸入 Host', 'warning');
        return false;
    }
    
    if (!httpContentType.trim()) {
        showAlert('請輸入 Content-Type', 'warning');
        return false;
    }
    
    if (!requestBody.trim()) {
        showAlert('請輸入 Request Body', 'warning');
            return false;
        }
        
    // 檢查是否包含 {{prompt}} 變量
    if (!requestBody.includes('{{prompt}}')) {
        showAlert('Request Body 必須包含 {{prompt}} 變量', 'warning');
            return false;
    }
    
    // 驗證測試問題（可選，如果沒有配置測試問題也沒關係）
    const questionSourceRadio = document.querySelector('input[name="questionSource"]:checked');
    const questionSourceValue = questionSourceRadio ? questionSourceRadio.value : 'manual';
    
    if (questionSourceValue === 'manual') {
        // 手動輸入模式：如果有輸入問題，驗證格式
        const questions = testQuestions.split('\n').filter(q => q.trim());
        // 不強制要求必須有問題，允許為空
    } else if (questionSourceValue === 'upload') {
        // 檔案上傳模式：如果有選擇檔案，驗證檔案
        const questionFile = document.getElementById('questionFile').files[0];
        // 不強制要求必須上傳檔案，允許為空
    }
    
    // 檢查是否有評分標準
    const enableJavascript = document.getElementById('enableJavascript').checked;
    const enableGEval = document.getElementById('enableGEval').checked;
    
    if (!enableJavascript && !enableGEval) {
        showAlert('請至少添加一個評分標準', 'warning');
        return false;
    }
    
    // 檢查評分標準是否有效
    let hasValidCriteria = false;
    
    if (enableJavascript) {
        const javascriptCondition = document.getElementById('javascriptCondition').value;
        if (javascriptCondition === 'length') {
            const minLength = document.getElementById('minLength').value;
            if (minLength && parseInt(minLength) > 0) {
            hasValidCriteria = true;
        }
        } else if (javascriptCondition === 'custom') {
            const customJavascript = document.getElementById('customJavascript').value;
            if (customJavascript && customJavascript.trim()) {
                hasValidCriteria = true;
            }
        }
    }
    
    if (enableGEval) {
        const criteriaList = document.querySelectorAll('#gevalCriteriaList .input-group input');
        if (criteriaList.length > 0) {
            hasValidCriteria = true;
        }
    }
    
    if (!hasValidCriteria) {
        showAlert('請確保評分標準配置正確', 'warning');
        return false;
    }
    
    return true;
}


// 執行配置
async function runConfig(configId) {
    if (confirm('確定要執行這個配置嗎？')) {
        try {
            showAlert('正在執行配置，請稍候...', 'info');
            
            const response = await fetch(`/api/configs/${configId}/run`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showAlert('配置執行成功！', 'success');
                console.log('執行結果:', result);
            } else {
                showAlert('執行失敗: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('執行配置失敗:', error);
            showAlert('執行失敗', 'danger');
        }
    }
}

// 刪除配置
async function deleteConfig(configId) {
    if (confirm('確定要刪除這個配置嗎？')) {
        try {
            const response = await fetch(`/api/configs/${configId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('配置刪除成功', 'success');
                // 重新載入配置列表
                await loadConfigs();
            } else {
                const result = await response.json();
                showAlert('刪除失敗: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('刪除配置失敗:', error);
            showAlert('刪除失敗', 'danger');
        }
    }
}

// 載入執行結果
async function loadResults() {
    try {
        const response = await fetch('/api/results');
        const results = await response.json();
        
        const container = document.getElementById('resultsList');
        
        if (!Array.isArray(results) || results.length === 0) {
            container.innerHTML = '<p class="text-muted">暫無執行結果</p>';
            return;
        }
        
        const html = results.map(result => {
            const passRate = parseFloat(result.pass_rate) || 0;
            let passRateClass = 'pass-rate-low';
            if (passRate === 100) {
                passRateClass = 'pass-rate-100';
            } else if (passRate >= 80) {
                passRateClass = 'pass-rate-80';
            }
            
            const createdDate = new Date(result.created_at).toLocaleString('zh-TW');
            
            return `
                <div class="card mb-3 result-card" onclick="showResultDetails('${result.id}')">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <h6 class="mb-1">${result.id}</h6>
                                <small class="text-muted">${createdDate}</small>
                            </div>
                            <div class="col-md-2">
                                <span class="badge bg-secondary">${result.description || '未命名'}</span>
                            </div>
                            <div class="col-md-2">
                                <span class="badge ${passRateClass} fs-6">${passRate.toFixed(2)}%</span>
                            </div>
                            <div class="col-md-2">
                                <span class="text-muted">${result.total_tests || 0} 測試</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <small class="text-muted">
                                    ✅ ${result.success_count || 0} 通過 | 
                                    ❌ ${result.failure_count || 0} 失敗
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('載入結果失敗:', error);
        showAlert('載入結果失敗', 'danger');
    }
}

// 顯示結果詳情
async function showResultDetails(resultId) {
    try {
        const response = await fetch(`/api/results/${resultId}`);
        const result = await response.json();
        
        if (response.ok) {
            displayResultDetails(result);
        } else {
            showAlert('載入結果詳情失敗: ' + result.error, 'danger');
        }
        
    } catch (error) {
        console.error('載入結果詳情失敗:', error);
        showAlert('載入結果詳情失敗', 'danger');
    }
}

// 顯示結果詳情內容
function displayResultDetails(result) {
    const detailsContainer = document.getElementById('resultDetails');
    const titleElement = document.getElementById('resultDetailsTitle');
    const contentElement = document.getElementById('resultDetailsContent');
    
    // 設置標題
    titleElement.textContent = `結果詳情 - ${result.id}`;
    
    // 生成詳情內容
    const createdDate = new Date(result.created_at).toLocaleString('zh-TW');
    const passRate = parseFloat(result.pass_rate) || 0;
    let passRateClass = 'pass-rate-low';
    if (passRate === 100) {
        passRateClass = 'pass-rate-100';
    } else if (passRate >= 80) {
        passRateClass = 'pass-rate-80';
    }
    
    let testCasesHtml = '';
    if (result.test_cases && result.test_cases.length > 0) {
        testCasesHtml = result.test_cases.map((testCase, index) => {
            const resultClass = testCase.success ? 'test-result-pass' : 'test-result-fail';
            const statusIcon = testCase.success ? '✅' : '❌';
            const statusText = testCase.success ? 'PASS' : 'FAIL';
            
            return `
                <div class="${resultClass}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${testCase.success ? 'bg-success' : 'bg-danger'} me-2">${statusIcon} ${statusText}</span>
                            <small class="text-muted">延遲: ${testCase.latency || 'N/A'}ms</small>
                        </div>
                    </div>
                    <div class="prompt-text">${testCase.prompt}</div>
                    <div class="output-text">${testCase.output || testCase.error || '無輸出'}</div>
                </div>
            `;
        }).join('');
    } else {
        testCasesHtml = '<p class="text-muted">無測試案例詳情</p>';
    }
    
    contentElement.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>基本資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td>${result.id}</td></tr>
                    <tr><td><strong>描述:</strong></td><td>${result.description || '未命名'}</td></tr>
                    <tr><td><strong>執行時間:</strong></td><td>${createdDate}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>統計資訊</h6>
                <table class="table table-sm">
                    <tr><td><strong>通過率:</strong></td><td><span class="${passRateClass}">${passRate.toFixed(2)}%</span></td></tr>
                    <tr><td><strong>總測試數:</strong></td><td>${result.total_tests || 0}</td></tr>
                    <tr><td><strong>成功數:</strong></td><td>${result.success_count || 0}</td></tr>
                    <tr><td><strong>失敗數:</strong></td><td>${result.failure_count || 0}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="mb-3">
            <h6>測試案例詳情</h6>
            ${testCasesHtml}
        </div>
    `;
    
    // 顯示詳情面板
    detailsContainer.style.display = 'block';
    
    // 滾動到詳情面板
    detailsContainer.scrollIntoView({ behavior: 'smooth' });
}

// 隱藏結果詳情
function hideResultDetails() {
    const detailsContainer = document.getElementById('resultDetails');
    detailsContainer.style.display = 'none';
}

// 顯示警告訊息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 自動移除警告
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
