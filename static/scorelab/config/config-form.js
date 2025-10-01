// 配置表單模組
// 負責配置表單的UI管理和顯示功能

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
    
    // 根據編輯模式設定按鈕文字
    setTimeout(() => {
        const saveButtonText = document.getElementById('saveButtonText');
        const saveButtonTextStep4 = document.getElementById('saveButtonTextStep4');
        
        if (saveButtonText) {
            saveButtonText.textContent = isEdit ? '儲存配置' : '創建配置';
        }
        if (saveButtonTextStep4) {
            saveButtonTextStep4.textContent = isEdit ? '儲存配置' : '創建配置';
        }
        
        // 更新頂部的保存按鈕文字
        const topSaveButton = document.querySelector('#configFormActions .btn-success');
        if (topSaveButton) {
            topSaveButton.innerHTML = `<i class="fas fa-save me-2"></i>${isEdit ? '儲存配置' : '創建配置'}`;
        }
    }, 100);
    
    // 如果是編輯模式，載入配置數據
    if (isEdit && config) {
        await ConfigLoader.loadConfigToForm(config);
    } else {
        // 新增模式，重置表單
        FormValidation.resetScoringCriteriaList();
    }
}

// 生成配置表單HTML
function generateConfigFormHTML() {
    return `
        <div class="config-form-container">
            <!-- 進度指示器 -->
            <div class="progress-steps mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="step active clickable" data-step="1" onclick="jumpToStep(1)">
                        <span class="step-number">1</span>
                        <span class="step-label">基本設定</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="2" onclick="jumpToStep(2)">
                        <span class="step-number">2</span>
                        <span class="step-label">API配置</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="3" onclick="jumpToStep(3)">
                        <span class="step-number">3</span>
                        <span class="step-label">測試問題</span>
                    </div>
                    <div class="step-line"></div>
                    <div class="step clickable" data-step="4" onclick="jumpToStep(4)">
                        <span class="step-number">4</span>
                        <span class="step-label">評分標準</span>
                    </div>
                </div>
            </div>

            <form id="configFormContent" onsubmit="return false;">
                <!-- 步驟 1: 基本資訊 -->
                <div class="form-step" id="step1" style="display: block;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-info-circle me-2"></i>基本資訊</h5>
                        <p class="text-muted">設定你的評測配置基本資訊</p>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-8">
                            <label class="form-label">配置名稱 *</label>
                            <input type="text" class="form-control form-control-lg" id="configName" placeholder="例如：台電客服評測" required>
                            <small class="form-text text-muted">請勿使用特殊字符: < > : " / \\ | ? *</small>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-end">
                            <div class="btn-group">
                        <button type="button" class="btn btn-primary" onclick="nextStep(2)">
                            下一步：API配置 <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步驟 2: API配置 -->
                <div class="form-step" id="step2" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-robot me-2"></i>被測API配置</h5>
                        <p class="text-muted">配置要測試的API端點和請求格式</p>
                    </div>
                    
                    <!-- HTTP Request 配置 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-globe me-2"></i>HTTP 請求配置</h6>
                        </div>
                        <div class="card-body">
                            <!-- HTTPS 支援 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">使用 HTTPS:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="useHttps">
                                        <label class="form-check-label" for="useHttps">
                                            啟用 HTTPS 安全連線
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- HTTP 方法 -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">HTTP 方法:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <select class="form-select" id="httpMethod">
                                                <option value="POST">POST</option>
                                                <option value="GET">GET</option>
                                                <option value="PUT">PUT</option>
                                                <option value="PATCH">PATCH</option>
                                            </select>
                                        </div>
                        <div class="col-md-8">
                                            <input type="text" class="form-control" id="httpPath" required>
                            </div>
                                    </div>
                        </div>
                    </div>
                    
                            <!-- Host -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Host:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpHost" required>
                                </div>
                            </div>
                            
                            <!-- Content-Type -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Content-Type:</label>
                                </div>
                                <div class="col-md-9">
                                    <input type="text" class="form-control" id="httpContentType" placeholder="application/json" value="application/json" required>
                                </div>
                            </div>
                            
                            <!-- Authorization -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label fw-bold">Authorization:</label>
                                </div>
                                <div class="col-md-9">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <select class="form-select" id="authType">
                                                <option value="none">無認證</option>
                                                <option value="bearer">Bearer Token</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="apikey">API Key</option>
                                                <option value="custom">自定義</option>
                                            </select>
                                        </div>
                                        <div class="col-md-9">
                                            <input type="text" class="form-control" id="authValue" >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- Request Body 配置 -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-code me-2"></i>Request Body 配置</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                        <div class="col-12">
                                    <label class="form-label">Request Body 原始內容</label>
                                    <textarea class="form-control" id="requestBody" rows="6" ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 進階配置 -->
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <label class="form-label">Response Transform</label>
                            <input type="text" class="form-control" id="transformResponse">
                            <small class="form-text text-muted">例如：json.response, json.choices[0].message.content</small>
                        </div>
                    </div>
                    
                    <!-- API測試區域 -->
                    <div class="card mb-4 border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="fas fa-flask me-2"></i>API測試</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">測試您配置的API是否能正常運作</p>
                            
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label class="form-label">測試問題</label>
                                    <input type="text" class="form-control" id="testQuestion" placeholder="輸入一個測試問題，例如：你好，請自我介紹" value="你好，請自我介紹">
                                </div>
                                <div class="col-md-4 d-flex align-items-end">
                                    <button type="button" class="btn btn-info w-100" onclick="testAPI()" id="testAPIButton">
                                        <i class="fas fa-play me-2"></i>測試API
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 測試結果區域 -->
                            <div id="testResult" style="display: none;">
                                <hr>
                                <h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>測試結果</h6>
                                
                                <!-- 請求詳情 -->
                                <div class="mb-3">
                                    <label class="form-label small text-muted">請求詳情</label>
                                    <div class="bg-light p-2 rounded">
                                        <small id="requestDetails" class="text-muted"></small>
                                    </div>
                                </div>
                                
                                <!-- API回應 -->
                                <div class="mb-3">
                                    <label class="form-label small text-success">API回應</label>
                                    <div class="bg-success bg-opacity-10 p-3 rounded border border-success">
                                        <pre id="apiResponse" class="mb-0" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                    </div>
                                </div>
                                
                                <!-- 處理後的結果 -->
                                <div id="transformedResult" style="display: none;">
                                    <label class="form-label small text-primary">處理後的結果</label>
                                    <div class="bg-primary bg-opacity-10 p-3 rounded border border-primary">
                                        <pre id="transformedResponse" class="mb-0" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 錯誤結果區域 -->
                            <div id="testError" style="display: none;">
                                <hr>
                                <h6 class="text-danger mb-3"><i class="fas fa-exclamation-circle me-2"></i>測試失敗</h6>
                                <div class="alert alert-danger">
                                    <strong>錯誤訊息：</strong>
                                    <pre id="errorMessage" class="mb-0 mt-2" style="white-space: pre-wrap; font-size: 14px;"></pre>
                                </div>
                                <div class="text-muted">
                                    <small><i class="fas fa-lightbulb me-1"></i>請檢查API配置是否正確，包括URL、認證資訊和請求格式</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary" onclick="prevStep(1)">
                            <i class="fas fa-arrow-left me-2"></i>上一步
                        </button>
                            <div class="btn-group">
                        <button type="button" class="btn btn-primary" onclick="nextStep(3)">
                            下一步：測試問題 <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 步驟 3: 測試問題配置 -->
                <div class="form-step" id="step3" style="display: none;">
                    <div class="step-header mb-4">
                        <h5 class="text-primary"><i class="fas fa-question-circle me-2"></i>測試問題配置</h5>
                        <p class="text-muted">選擇測試問題的來源</p>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionSource" id="questionSourceUpload" value="upload" checked onchange="toggleQuestionInput()">
                                <label class="form-check-label" for="questionSourceUpload">
                                    <i class="fas fa-file-csv me-2"></i>上傳CSV檔案
                                </label>
                            </div>
                        </div>
                    </div>


                    <!-- 上傳測試集檔案 -->
                    <div id="uploadQuestionsSection" class="mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-upload me-2"></i>上傳測試集檔案
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <input type="file" class="form-control" id="csvFile" accept=".csv" onchange="handleCSVUpload(this)">
                                    <small class="form-text text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        請確保欄位名稱與 API Request Body 中的變量名稱與CSV檔案中的欄位名稱一致
                                    </small>
                                </div>
                                <div id="csvPreview" style="display: none;">
                                    <h6>檔案預覽：</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered" id="csvPreviewTable">
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-navigation mt-4">
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary" onclick="prevStep(2)">
                            <i class="fas fa-arrow-left me-2"></i>上一步
                        </button>
                            <div class="btn-group">
                        <button type="button" class="btn btn-outline-success me-2" onclick="nextStep(4)">
                            下一步：評分標準（可選） <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveConfiguration()">
                            <i class="fas fa-save me-2"></i><span id="saveButtonText">創建配置</span>
                        </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                    <i class="fas fa-times me-2"></i>取消
                        </button>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- 步驟 4: 評分標準配置（可選） -->
            <div class="form-step" id="step4" style="display: none;">
                <div class="step-header mb-4">
                    <h5 class="text-success"><i class="fas fa-chart-line me-2"></i>評分標準配置</h5>
                    <p class="text-muted">這個步驟是可選的。你可以跳過此步驟直接創建配置，或者設定評分標準來自動評估API回覆品質。</p>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-lightbulb me-2"></i>
                        <strong>提示：</strong>如果你只想測試API是否正常運作，可以跳過評分配置。如果你想要量化評估回覆品質，建議設定評分標準。
                    </div>
                </div>

                <!-- 評分標準配置區域 -->
                <div class="row">
                    <!-- 左欄：Metric 評分 -->
                    <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-chart-line me-2"></i>metric評分
                            </h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-3">選擇一個或多個內建評分指標</p>

                            <!-- JavaScript 驗證 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableJavascript" onchange="ScoringCriteria.toggleJavascriptConfig()">
                                    <label class="form-check-label" for="enableJavascript">
                                        <i class="fas fa-code me-2"></i>JavaScript 驗證
                                    </label>
                                </div>
                                <div id="javascriptConfig" style="display: none;" class="mt-2 ps-4">
                                    <div class="row">
                                        <div class="col-12 mb-2">
                                            <label class="form-label small">驗證條件</label>
                                            <select class="form-select form-select-sm" id="javascriptCondition" onchange="ScoringCriteria.updateJavascriptCondition()">
                                    <option value="length">回覆長度檢查</option>
                                    <option value="custom">自定義條件</option>
                                </select>
                            </div>
                                        <div class="col-12" id="lengthConfig">
                                            <label class="form-label small">最小長度</label>
                                            <input type="number" class="form-control form-control-sm" id="minLength" value="100" min="1">
                            </div>
                                        <div class="col-12" id="customConfig" style="display: none;">
                                            <label class="form-label small">自定義表達式</label>
                                            <textarea class="form-control form-control-sm" id="customJavascript" rows="2" placeholder="output.length >= 100"></textarea>
                            </div>
                        </div>
                    </div>
                            </div>

                            <!-- 其他 Metric 評分選項 -->
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableFactuality">
                                    <label class="form-check-label" for="enableFactuality">
                                        <i class="fas fa-check-double me-2"></i>事實性檢查
                                    </label>
                </div>
            </div>

                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableSimilarity">
                                    <label class="form-check-label" for="enableSimilarity">
                                        <i class="fas fa-search me-2"></i>語義相似度
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableBertScore">
                                    <label class="form-check-label" for="enableBertScore">
                                        <i class="fas fa-calculator me-2"></i>BERT Score
                                    </label>
                                </div>
                            </div>
                                              
                            <div class="mb-2">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableContains">
                                    <label class="form-check-label" for="enableContains">
                                        <i class="fas fa-search-plus me-2"></i>包含檢查
                                    </label>
                                </div>
                            </div>
                                                               
                        </div>
                    </div>
                </div>
                
                <!-- 右欄：Grader 評分 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-brain me-2"></i>grader評分
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-3">
                                <i class="fas fa-info-circle me-2"></i>
                                如果你要使用 grader 評分，你需要配置 grader provider（評分者提供商），例如選用 OpenAI 並填寫對應的 API Key 和選擇模型等。
                            </div>

                            <!-- G-Eval 評分 -->
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableGEval" onchange="ScoringCriteria.toggleGEvalConfig()">
                                    <label class="form-check-label" for="enableGEval">
                                        <i class="fas fa-brain me-2"></i>G-Eval (LLM評分)
                                    </label>
                                </div>
                                <div id="gevalConfig" style="display: none;" class="mt-3">
                                    <div class="mb-3">
                                        <label class="form-label small">評分標準</label>
                                        <div id="gevalCriteriaList">
                                            <div class="input-group mb-2">
                                                <input type="text" class="form-control form-control-sm" placeholder="例如：回覆內容是否準確回答了用戶的問題">
                                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="ScoringCriteria.removeGEvalCriteria(this)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="ScoringCriteria.addGEvalCriteria()">
                                            <i class="fas fa-plus"></i> 添加評分標準
                                        </button>
                                    </div>
                                    
                                    <hr class="my-3">
                                    <h6 class="text-success mb-3">
                                        <i class="fas fa-cogs me-2"></i>Grader Provider 配置
                                    </h6>
                                    <p class="text-muted small mb-3">選擇要使用哪個 LLM 服務來進行評分</p>
                                    
                                    <div class="mb-3">
                                        <label class="form-label small">選擇 LLM 提供者 *</label>
                                        <select class="form-select form-select-sm" id="llmProvider" onchange="ScoringCriteria.updateLLMProviderConfig()" required>
                                            <option value="">請選擇 LLM 提供者</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic (Claude)</option>
                                            <option value="azure-openai">Azure OpenAI</option>
                                            <option value="google">Google (Gemini)</option>
                                            <option value="custom">自定義 HTTP API</option>
                                        </select>
                                        <small class="form-text text-muted">這個 LLM 將用來評估被測試 API 的回覆品質</small>
                                    </div>
                                    
                                    <!-- LLM 提供者配置區域會在這裡動態顯示 -->
                                        <div id="llmProviderConfigArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-navigation mt-4">
                    <div class="d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary" onclick="prevStep(3)">
                        <i class="fas fa-arrow-left me-2"></i>上一步
                    </button>
                        <div class="btn-group">
                    <button type="button" class="btn btn-primary" onclick="saveConfiguration()">
                                <i class="fas fa-save me-2"></i><span id="saveButtonTextStep4">創建配置</span>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="cancelConfigForm()">
                                <i class="fas fa-times me-2"></i>取消
                    </button>
                        </div>
                    </div>
                </div>
            </div>

            </form>
        </div>
    `;
}

// 處理CSV上傳
function handleCSVUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        

        // 顯示預覽
        const preview = document.getElementById('csvPreview');
        const table = document.getElementById('csvPreviewTable');
        
        let tableHTML = '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // 顯示前5行數據
        for (let i = 1; i < Math.min(6, lines.length); i++) {
            if (lines[i].trim()) {
                const cells = lines[i].split(',').map(c => c.trim());
                tableHTML += '<tr>';
                cells.forEach(cell => {
                    tableHTML += `<td>${cell}</td>`;
                });
                tableHTML += '</tr>';
            }
        }
        
        tableHTML += '</tbody>';
        table.innerHTML = tableHTML;
        preview.style.display = 'block';
        
        showAlert(`成功載入CSV檔案，包含 ${lines.length - 1} 個測試問題`, 'success');
    };
    
    reader.readAsText(file);
}

// 切換問題輸入方式
function toggleQuestionInput() {
    const questionSource = document.querySelector('input[name="questionSource"]:checked');
    if (!questionSource) return;
    
    const questionSourceValue = questionSource.value;
    const uploadSection = document.getElementById('uploadQuestionsSection');
    
    console.log('切換問題輸入方式:', questionSourceValue);
    
    if (questionSourceValue === 'upload') {
        // 檔案上傳模式：顯示檔案上傳區域
        if (uploadSection) {
            uploadSection.style.display = 'block';
            console.log('設置 uploadSection display: block');
        }
        console.log('切換到檔案上傳模式');
    }
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
    if (ConfigManager.selectedConfig()) {
        ConfigManager.showConfigDetails(ConfigManager.selectedConfig());
    } else {
        // 沒有選中配置，顯示提示
        configDetails.innerHTML = '<p class="text-muted">請選擇一個配置檔案查看詳情，或點擊「新增配置」創建新配置</p>';
    }
}

// 取消配置表單
function cancelConfigForm() {
    hideConfigForm();
}

// 匯出配置表單相關的函數供其他模組使用
window.ConfigForm = {
    showConfigForm,
    generateConfigFormHTML,
    handleCSVUpload,
    toggleQuestionInput,
    hideConfigForm,
    cancelConfigForm
};
