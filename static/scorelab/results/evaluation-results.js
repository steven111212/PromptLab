// 主要的評估結果管理模組
// 依賴：evaluation-api.js, chart-manager.js, modal-charts.js

// 載入評估結果列表
async function loadEvaluationResults() {
    try {
        const results = await EvaluationAPI.getResults();
        const container = document.getElementById('resultsTable');
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    目前沒有評估結果
                </div>
            `;
            return;
        }

        const resultsHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="bg-primary text-white">
                        <tr>
                            <th>評估ID</th>
                            <th>創建時間</th>
                            <th>描述</th>
                            <th>測試數量</th>
                            <th>通過率</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => {
                            const displayId = result.id.length > 8 ? 
                                result.id.substring(0, 8) + '...' : result.id;
                            
                            return `
                                <tr>
                                    <td>
                                        <span class="badge bg-secondary" title="${result.id}">
                                            ${displayId}
                                        </span>
                                    </td>
                                    <td>${result.created}</td>
                                    <td>
                                        <span class="text-muted">
                                            ${result.description || '無描述'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge bg-info">
                                            ${result.dataset_count} 個測試
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${parseFloat(result.pass_rate) >= 80 ? 'bg-success' : 
                                                            parseFloat(result.pass_rate) >= 60 ? 'bg-warning' : 'bg-danger'}">
                                            ${result.pass_rate}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" 
                                                onclick="navigateToEvaluationDetail('${result.id}')">
                                            <i class="fas fa-eye me-1"></i>查看詳情
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = resultsHtml;
        
    } catch (error) {
        console.error('載入評估結果失敗:', error);
        document.getElementById('resultsTable').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                載入結果失敗: ${error.message}
            </div>
        `;
    }
}

// 導航到評估詳情頁面
function navigateToEvaluationDetail(evalId) {
    // 切換到詳情視圖
    document.getElementById('results').style.display = 'none';
    document.getElementById('config').style.display = 'none';
    
    // 創建詳情容器（如果不存在）
    let detailContainer = document.getElementById('evaluation-detail');
    if (!detailContainer) {
        detailContainer = document.createElement('div');
        detailContainer.id = 'evaluation-detail';
        detailContainer.className = 'tab-content';
        document.querySelector('.container-fluid').appendChild(detailContainer);
    }
    
    detailContainer.style.display = 'block';
    loadEvaluationDetail(evalId);
}

// 載入評估詳情
async function loadEvaluationDetail(evalId) {
    try {
        const detail = await EvaluationAPI.getDetail(evalId);
        const container = document.getElementById('evaluation-detail');
        
        const detailHtml = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 id="evaluationDetailTitle">
                    <i class="fas fa-chart-line me-2"></i>
                    評估詳細結果 - ${evalId}
                </h4>
                <button class="btn btn-outline-secondary" onclick="backToResults()">
                    <i class="fas fa-arrow-left me-1"></i>返回列表
                </button>
            </div>
            
            <!-- 統計卡片 -->
            <div class="row mb-4">
                <div class="col-md-8 mx-auto">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>基本資訊</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-4">
                                    <div class="text-center">
                                        <h5 class="text-primary">${detail.details.length}</h5>
                                        <small class="text-muted">總測試數</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="text-center">
                                        <h5 class="text-success">${detail.details.filter(t => t.success).length}</h5>
                                        <small class="text-muted">成功測試</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="text-center">
                                        <h5 class="text-info">${detail.pass_rate}</h5>
                                        <small class="text-muted">通過率</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 圖表區域 -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>延遲分佈圖</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="latencyChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>BERT Score F1 分佈圖</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="bertScoreChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 測試案例詳情表格 -->
            ${generateTestCaseTable(detail)}
        `;
        
        container.innerHTML = detailHtml;
        
        // 儲存詳細數據供彈出視窗使用
        window.currentEvalDetail = detail;
        
        // 生成圖表
        generateCharts(detail);
        
    } catch (error) {
        console.error('載入評估詳細結果失敗:', error);
        document.getElementById('evaluation-detail').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                載入詳細結果失敗: ${error.message}
            </div>
        `;
    }
}

// 生成測試案例表格
function generateTestCaseTable(detail) {
    // 動態獲取所有變數欄位
    const allVariables = new Set();
    detail.details.forEach(test => {
        if (test.variables) {
            Object.keys(test.variables).forEach(key => allVariables.add(key));
        }
    });
    const variableKeys = Array.from(allVariables);
    const totalColumns = variableKeys.length + 1; // +1 for Output & Result
    const columnWidth = Math.floor(100 / totalColumns);

    return `
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-list me-2"></i>測試案例詳情</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-bordered mb-0">
                        <thead class="bg-light">
                            <tr>
                                ${variableKeys.map(key => 
                                    `<th style="width: ${columnWidth}%; min-width: 200px;">${key}</th>`
                                ).join('')}
                                <th style="width: ${columnWidth}%; min-width: 250px;">Output & Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detail.details.map((test, index) => 
                                generateTestCaseRow(test, index, variableKeys, detail.id)
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// 生成測試案例行
function generateTestCaseRow(test, index, variableKeys, evalId) {
    return `
        <tr>
            ${variableKeys.map(key => {
                const value = test.variables?.[key] || '';
                return `
                    <td class="align-top" style="word-wrap: break-word;">
                        <div class="variable-content">
                            ${value.length > 100 ? 
                                `<div class="variable-short" id="var_short_${index}_${key}">
                                    ${value.substring(0, 100)}...
                                    <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleVariableContent(${index}, '${key}')">顯示更多</button>
                                </div>
                                <div class="variable-full" id="var_full_${index}_${key}" style="display: none;">
                                    ${value}
                                    <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleVariableContent(${index}, '${key}')">顯示較少</button>
                                </div>` : 
                                value
                            }
                        </div>
                    </td>
                `;
            }).join('')}
            <td class="align-top" style="word-wrap: break-word;">
                ${generateOutputResultCell(test, index, evalId)}
            </td>
        </tr>
    `;
}

// 生成輸出結果單元格
function generateOutputResultCell(test, index, evalId) {
    const passCount = test.assertions?.filter(a => a.pass).length || 0;
    const totalCount = test.assertions?.length || 0;
    const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : (test.success ? '100.0' : '0.0');
    const displayText = totalCount > 0 ? 
        `${passRate}% passing (${passCount}/${totalCount} cases)` : 
        `${passRate}% passing (${test.success ? '1/1' : '0/1'} cases)`;

    return `
        <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge ${test.success ? 'bg-success' : 'bg-danger'} text-white">
                    ${displayText}
                </span>
                <button class="btn btn-sm btn-outline-info" 
                        onclick="showTestDetails(${index}, '${evalId}')"
                        title="查看詳細資訊">
                    <i class="fas fa-search-plus"></i>
                </button>
            </div>
            <!-- Output content with toggle -->
            <div class="bg-light p-2 rounded" style="font-size: 0.85rem; line-height: 1.4; max-height: 150px; overflow-y: auto;">
                ${test.output && test.output.length > 150 ? 
                    `<div class="output-short" id="output_short_${index}">
                        ${test.output.substring(0, 150)}...
                        <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleOutputContent(${index})">顯示更多</button>
                    </div>
                    <div class="output-full" id="output_full_${index}" style="display: none;">
                        ${test.output}
                        <br><button class="btn btn-link btn-sm p-0 mt-1" onclick="toggleOutputContent(${index})">顯示較少</button>
                    </div>` : 
                    (test.output || test.error || '無輸出')
                }
            </div>
            ${test.latency ? `<div class="mt-2"><small class="text-muted">Latency: ${test.latency} ms</small></div>` : ''}
            ${!test.success && test.grading_info?.reason ? 
                `<div class="mt-2 text-danger" style="font-size: 0.85rem;">
                    <i class="fas fa-exclamation-circle me-1"></i>
                    ${test.grading_info.reason}
                </div>` : ''
            }
        </div>
    `;
}

// 返回結果列表
function backToResults() {
    document.getElementById('evaluation-detail').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // 更新導航標籤
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('[data-tab="results"]').classList.add('active');
}

// 切換變數內容顯示
function toggleVariableContent(testIndex, variableName) {
    const shortElement = document.getElementById(`var_short_${testIndex}_${variableName}`);
    const fullElement = document.getElementById(`var_full_${testIndex}_${variableName}`);
    
    if (shortElement && fullElement) {
        if (shortElement.style.display === 'none') {
            shortElement.style.display = 'block';
            fullElement.style.display = 'none';
        } else {
            shortElement.style.display = 'none';
            fullElement.style.display = 'block';
        }
    }
}

// 切換輸出內容顯示
function toggleOutputContent(testIndex) {
    const shortElement = document.getElementById(`output_short_${testIndex}`);
    const fullElement = document.getElementById(`output_full_${testIndex}`);
    
    if (shortElement && fullElement) {
        if (shortElement.style.display === 'none') {
            shortElement.style.display = 'block';
            fullElement.style.display = 'none';
        } else {
            shortElement.style.display = 'none';
            fullElement.style.display = 'block';
        }
    }
}

// 顯示測試詳細資訊
async function showTestDetails(testIndex, evalId) {
    try {
        // 使用已經載入的數據而不是重新請求 API
        const detail = window.currentEvalDetail;
        if (!detail) {
            console.error('找不到評估詳細數據');
            return;
        }
        const test = detail.details[testIndex];
        

        // 生成 Assertions 表格的 HTML
        const assertionsHtml = test.assertions && test.assertions.length > 0 ? 
            test.assertions.map(assertion => `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; width: 60px;">
                        ${assertion.pass ? 
                            '<i class="fas fa-check text-success"></i>' : 
                            '<i class="fas fa-times text-danger"></i>'
                        }
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; width: 80px;">
                        <span class="text-dark" style="font-size: 0.9rem;">${assertion.score?.toFixed(2) || 'N/A'}</span>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 8px; width: 100px;">
                        <span class="badge ${assertion.type === 'g-eval' ? 'bg-primary' : 
                                           assertion.type === 'javascript' ? 'bg-warning text-dark' : 
                                           assertion.type === 'python' ? 'bg-info' :
                                           assertion.type === 'factuality' ? 'bg-success' : 'bg-secondary'}" 
                              style="font-size: 0.75rem;">
                            ${assertion.type || 'unknown'}
                        </span>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 8px; max-width: 200px; word-wrap: break-word;">
                        <div style="font-size: 0.85rem; line-height: 1.3;">
                            ${assertion.value ? 
                                (assertion.value.length > 100 ? 
                                    assertion.value.substring(0, 100) + '...' : 
                                    assertion.value) : 
                                '無值'
                            }
                        </div>
                    </td>
                    <td style="border: 1px solid #dee2e6; padding: 8px; max-width: 400px; word-wrap: break-word;">
                        <div style="font-size: 0.85rem; line-height: 1.3;">
                            ${assertion.reason || '無原因說明'}
                        </div>
                    </td>
                </tr>
            `).join('') : 
            '<tr><td colspan="5" class="text-center text-muted">無 Assertion 資料</td></tr>';

        const modalHtml = `
            <div class="modal fade" id="testDetailModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">測試案例詳細資訊 - 案例 ${testIndex + 1}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0">Assertions</h6>
                                        </div>
                                        <div class="card-body p-0">
                                            <div class="table-responsive">
                                                <table class="table mb-0" style="font-size: 0.9rem;">
                                                    <thead class="bg-light">
                                                        <tr>
                                                            <th style="width: 60px;">Pass</th>
                                                            <th style="width: 80px;">Score</th>
                                                            <th style="width: 100px;">Type</th>
                                                            <th style="max-width: 200px;">Value</th>
                                                            <th style="max-width: 250px;">Reason</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${assertionsHtml}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除舊的模態框
        const existingModal = document.getElementById('testDetailModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新的模態框到頁面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('testDetailModal'));
        modal.show();
        
        // 模態框關閉後移除DOM元素
        document.getElementById('testDetailModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('載入測試詳細資訊失敗:', error);
        alert('載入測試詳細資訊失敗: ' + error.message);
    }
}

// 開始評估
async function startEvaluation(type) {
    try {
        console.log(`開始 ${type} 評估...`);
        // 這裡可以調用後端 API 開始評估
        alert(`${type} 評估功能開發中...`);
    } catch (error) {
        console.error('開始評估失敗:', error);
        alert('開始評估失敗: ' + error.message);
    }
}

// 查看輸出
async function viewOutput(evalId) {
    try {
        const detail = await EvaluationAPI.getDetail(evalId);
        
        const outputHtml = `
            <div class="modal fade" id="outputModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">評估輸出 - ${evalId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <pre class="bg-dark text-light p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85rem;">${
                                detail.details.map((test, index) => 
                                    `=== 測試案例 ${index + 1} ===\n${test.output || test.error || '無輸出'}\n`
                                ).join('\n')
                            }</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除舊的模態框
        const existingModal = document.getElementById('outputModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新的模態框到頁面
        document.body.insertAdjacentHTML('beforeend', outputHtml);
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('outputModal'));
        modal.show();
        
        // 模態框關閉後移除DOM元素
        document.getElementById('outputModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('載入輸出失敗:', error);
        alert('載入輸出失敗: ' + error.message);
    }
}

// 刷新結果
function refreshResults() {
    loadEvaluationResults();
}

// 生成圖表
function generateCharts(detail) {
    // 生成延遲分佈圖
    generateLatencyChart(detail);
    
    // 生成 BERT Score F1 分佈圖
    generateBertScoreChart(detail);
}

// 生成延遲分佈圖
function generateLatencyChart(detail) {
    const ctx = document.getElementById('latencyChart');
    if (!ctx) return;
    
    // 收集延遲數據
    const latencies = detail.details
        .map(test => test.latency)
        .filter(latency => latency !== undefined && latency !== null)
        .map(latency => parseFloat(latency));
    
    if (latencies.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-muted text-center">無延遲數據</p>';
        return;
    }
    
    // 計算分佈
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const binSize = Math.max(10, Math.ceil((maxLatency - minLatency) / 10));
    const bins = {};
    
    latencies.forEach(latency => {
        const bin = Math.floor(latency / binSize) * binSize;
        bins[bin] = (bins[bin] || 0) + 1;
    });
    
    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const data = labels.map(label => bins[label]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => `${label}-${label + binSize}ms`),
            datasets: [{
                label: 'Count',
                data: data,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Latency (ms)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Count: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// 生成 BERT Score F1 分佈圖
function generateBertScoreChart(detail) {
    const ctx = document.getElementById('bertScoreChart');
    if (!ctx) return;
    
    // 收集 BERT Score F1 數據
    const bertScores = [];
    detail.details.forEach(test => {
        if (test.assertions) {
            test.assertions.forEach(assertion => {
                if (assertion.type === 'python' && assertion.score !== undefined) {
                    // 檢查是否是 BERT Score F1
                    if (assertion.reason && assertion.reason.includes('BERTScore F1')) {
                        bertScores.push(parseFloat(assertion.score));
                    }
                }
            });
        }
    });
    
    if (bertScores.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-muted text-center">無 BERT Score F1 數據</p>';
        return;
    }
    
    // 計算分佈
    const minScore = Math.min(...bertScores);
    const maxScore = Math.max(...bertScores);
    const binSize = Math.max(0.1, Math.ceil((maxScore - minScore) / 10 * 10) / 10);
    const bins = {};
    
    bertScores.forEach(score => {
        const bin = Math.floor(score / binSize) * binSize;
        bins[bin] = (bins[bin] || 0) + 1;
    });
    
    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const data = labels.map(label => bins[label]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => `${label.toFixed(1)}-${(label + binSize).toFixed(1)}`),
            datasets: [{
                label: 'Count',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'BERT Score F1'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Count: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否在結果頁面並且結果容器可見
    const resultsContainer = document.getElementById('resultsTable');
    const resultsTab = document.getElementById('results');
    
    if (resultsContainer && resultsTab && resultsTab.style.display !== 'none') {
        loadEvaluationResults();
    }
});
