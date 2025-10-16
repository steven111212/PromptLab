// 主要的評估結果管理模組
// 依賴：evaluation-api.js, chart-manager.js, modal-charts.js, result-filters.js

// 載入評估結果列表
async function loadEvaluationResults() {
    const container = document.getElementById('resultsTable');
    
    // 顯示骨架屏
    container.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
        </div>
    `;
    
    try {
        const results = await EvaluationAPI.getResults();
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    目前沒有評估結果
                </div>
            `;
            // 清空儀表板和篩選器
            document.getElementById('resultsDashboard').innerHTML = '';
            return;
        }
        
        // 從本地存儲載入書籤
        loadBookmarks();
        
        // 設置結果到篩選器
        if (window.ResultFilters) {
            window.ResultFilters.setResults(results);
        }
        
        // 渲染統計儀表板
        renderDashboard(results);
        
        // 設置篩選器事件監聽
        setupFilterListeners();
        
        // 初始渲染結果
        renderResults(results);
        
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

// 自動載入結果
function autoLoadResults() {
    const resultsContainer = document.getElementById('resultsTable');
    const resultsTab = document.getElementById('results');
    
    if (resultsContainer && resultsTab && resultsTab.style.display !== 'none') {
        loadEvaluationResults();
    }
}

// 頁面載入時自動載入結果
document.addEventListener('DOMContentLoaded', autoLoadResults);

// 切換到結果頁面時自動載入
document.querySelectorAll('[data-tab="results"]').forEach(tab => {
    tab.addEventListener('click', autoLoadResults);
});

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

// ==================== Phase 3: 新增功能 ====================

// 渲染統計儀表板
function renderDashboard(results) {
    const dashboard = document.getElementById('resultsDashboard');
    if (!dashboard) return;
    
    // 計算統計數據
    const totalCount = results.length;
    const avgPassRate = totalCount > 0 
        ? (results.reduce((sum, r) => sum + (parseFloat(r.pass_rate) || 0), 0) / totalCount).toFixed(1)
        : 0;
    
    // 計算最近7天的數據
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentResults = results.filter(r => new Date(r.created) >= sevenDaysAgo);
    
    // 找到最高分
    const maxPassRate = results.length > 0
        ? Math.max(...results.map(r => parseFloat(r.pass_rate) || 0))
        : 0;
    const bestResult = results.find(r => parseFloat(r.pass_rate) === maxPassRate);
    
    dashboard.innerHTML = `
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #eff6ff; color: #3b82f6;">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="stat-card-value">${totalCount}</div>
                <div class="stat-card-label">總評測數</div>
                <div class="stat-card-change positive">
                    <i class="fas fa-arrow-up me-1"></i>本週 +${recentResults.length}
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #d1fae5; color: #10b981;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-value">${avgPassRate}%</div>
                <div class="stat-card-label">平均通過率</div>
                <div class="stat-card-change ${avgPassRate >= 80 ? 'positive' : 'negative'}">
                    <i class="fas fa-${avgPassRate >= 80 ? 'arrow-up' : 'arrow-down'} me-1"></i>${avgPassRate >= 80 ? '表現良好' : '需要改善'}
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #fef3c7; color: #f59e0b;">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="stat-card-value">${recentResults.length}</div>
                <div class="stat-card-label">最近 7 天</div>
                <div class="stat-card-change positive">
                    <i class="fas fa-clock me-1"></i>活躍測試
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card">
                <div class="stat-card-icon" style="background: #fce7f3; color: #ec4899;">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-card-value">${maxPassRate}%</div>
                <div class="stat-card-label">最高分</div>
                <div class="stat-card-change" style="color: #6b7280;">
                    <i class="fas fa-trophy me-1"></i>${bestResult ? (bestResult.description || '未命名') : '-'}
                </div>
            </div>
        </div>
    `;
}

// 設置篩選器事件監聽
function setupFilterListeners() {
    // 搜索框
    const searchInput = document.getElementById('resultSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (window.ResultFilters) {
                    window.ResultFilters.setSearch(e.target.value);
                    const filtered = window.ResultFilters.getFilteredResults();
                    renderResults(filtered);
                    updateFilterUI();
                }
            }, 300);
        });
    }
    
    // 時間範圍篩選
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function(e) {
            if (window.ResultFilters) {
                window.ResultFilters.setDateRangeFilter(e.target.value);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
                updateFilterUI();
            }
        });
    }
    
    // 通過率篩選
    const passRateFilter = document.getElementById('passRateFilter');
    if (passRateFilter) {
        passRateFilter.addEventListener('change', function(e) {
            if (window.ResultFilters) {
                window.ResultFilters.setPassRateFilter(e.target.value);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
                updateFilterUI();
            }
        });
    }
    
    // 排序
    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) {
        sortByFilter.addEventListener('change', function(e) {
            const [sortBy, sortOrder] = e.target.value.split('-');
            if (window.ResultFilters) {
                window.ResultFilters.setSort(sortBy, sortOrder);
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
            }
        });
    }
}

// 渲染結果表格
function renderResults(results) {
    const container = document.getElementById('resultsTable');
    if (!container) return;
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                沒有符合條件的評估結果
            </div>
        `;
        return;
    }
    
    const resultsHtml = `
        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-enhanced mb-0">
                    <thead>
                        <tr>
                            <th style="width: 50px;"></th>
                            <th>評估ID</th>
                            <th>創建時間</th>
                            <th>描述</th>
                            <th style="text-align: center;">測試數量</th>
                            <th style="text-align: center;">通過率</th>
                            <th style="text-align: center;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => {
                            const displayId = result.id.length > 8 ? 
                                result.id.substring(0, 8) + '...' : result.id;
                            const passRate = parseFloat(result.pass_rate) || 0;
                            const passRateClass = passRate >= 80 ? 'high' : passRate >= 60 ? 'medium' : 'low';
                            const bookmarked = isBookmarked(result.id);
                            const tags = getResultTags(result.id);
                            
                            return `
                                <tr>
                                    <td>
                                        <i class="fas fa-star bookmark-btn ${bookmarked ? 'bookmarked' : ''}" 
                                           onclick="toggleBookmark('${result.id}')"
                                           title="${bookmarked ? '取消收藏' : '收藏'}"></i>
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary" title="${result.id}">
                                            ${displayId}
                                        </span>
                                    </td>
                                    <td>${result.created}</td>
                                    <td>
                                        <div>
                                            ${result.description || '<span class="text-muted">無描述</span>'}
                                        </div>
                                        ${tags.length > 0 ? `
                                            <div class="mt-1">
                                                ${tags.map(tag => `<span class="result-tag ${tag}">${tag}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td style="text-align: center;">
                                        <span class="badge bg-info">
                                            ${result.dataset_count}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div>
                                            <span class="badge bg-${passRate >= 80 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}">
                                                ${passRate}%
                                            </span>
                                        </div>
                                        <div class="pass-rate-bar">
                                            <div class="pass-rate-fill ${passRateClass}" style="width: ${passRate}%"></div>
                                        </div>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="d-flex gap-2 justify-content-center align-items-center">
                                            <button class="btn btn-sm btn-outline-primary" 
                                                    onclick="navigateToEvaluationDetail('${result.id}')">
                                                <i class="fas fa-eye me-1"></i>查看
                                            </button>
                                            <div class="dropdown quick-actions">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                                        type="button" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li>
                                                        <a class="dropdown-item" href="#" onclick="addResultTag('${result.id}')">
                                                            <i class="fas fa-tag me-2"></i>添加標籤
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item" href="#" onclick="exportResult('${result.id}')">
                                                            <i class="fas fa-download me-2"></i>導出結果
                                                        </a>
                                                    </li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li>
                                                        <a class="dropdown-item text-danger" href="#" onclick="deleteResult('${result.id}')">
                                                            <i class="fas fa-trash me-2"></i>刪除
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = resultsHtml;
}

// 更新篩選UI
function updateFilterUI() {
    if (!window.ResultFilters) return;
    
    const stats = window.ResultFilters.getFilterStats();
    const activeFilters = stats.activeFilters;
    
    // 更新篩選統計
    const filterStats = document.getElementById('filterStats');
    if (filterStats) {
        filterStats.textContent = `顯示 ${stats.filtered} / ${stats.total} 個結果`;
    }
    
    // 更新活動篩選器標籤
    const activeFiltersContainer = document.getElementById('activeFilters');
    const activeFilterTags = document.getElementById('activeFilterTags');
    
    if (activeFiltersContainer && activeFilterTags) {
        if (activeFilters.length > 0) {
            activeFiltersContainer.style.display = 'block';
            activeFilterTags.innerHTML = activeFilters.map(filter => `
                <span class="filter-tag">
                    ${filter.label}
                    <i class="fas fa-times remove-filter" onclick="removeFilter('${filter.type}', '${filter.value}')"></i>
                </span>
            `).join('');
        } else {
            activeFiltersContainer.style.display = 'none';
        }
    }
}

// 移除篩選器
function removeFilter(type, value) {
    if (window.ResultFilters) {
        window.ResultFilters.removeFilter(type, value);
        const filtered = window.ResultFilters.getFilteredResults();
        renderResults(filtered);
        updateFilterUI();
    }
}

// 清除所有篩選器
function clearAllFilters() {
    if (window.ResultFilters) {
        window.ResultFilters.clearAllFilters();
        const filtered = window.ResultFilters.getFilteredResults();
        renderResults(filtered);
        updateFilterUI();
        
        // 重置表單
        document.getElementById('resultSearchInput').value = '';
        document.getElementById('dateRangeFilter').value = 'all';
        document.getElementById('passRateFilter').value = 'all';
        document.getElementById('sortByFilter').value = 'date-desc';
    }
}

// ==================== 書籤功能 ====================

let bookmarks = [];

// 載入書籤
function loadBookmarks() {
    const stored = localStorage.getItem('resultBookmarks');
    bookmarks = stored ? JSON.parse(stored) : [];
}

// 保存書籤
function saveBookmarks() {
    localStorage.setItem('resultBookmarks', JSON.stringify(bookmarks));
}

// 切換書籤
function toggleBookmark(resultId) {
    const index = bookmarks.indexOf(resultId);
    if (index > -1) {
        bookmarks.splice(index, 1);
        Toast.info('已取消收藏');
    } else {
        bookmarks.push(resultId);
        Toast.success('已收藏');
    }
    saveBookmarks();
    
    // 更新圖標
    const icon = document.querySelector(`.bookmark-btn[onclick="toggleBookmark('${resultId}')"]`);
    if (icon) {
        icon.classList.toggle('bookmarked');
    }
}

// 檢查是否已收藏
function isBookmarked(resultId) {
    return bookmarks.includes(resultId);
}

// ==================== 標籤功能 ====================

let resultTags = {};

// 載入標籤
function loadResultTags() {
    const stored = localStorage.getItem('resultTags');
    resultTags = stored ? JSON.parse(stored) : {};
}

// 保存標籤
function saveResultTags() {
    localStorage.setItem('resultTags', JSON.stringify(resultTags));
}

// 獲取結果的標籤
function getResultTags(resultId) {
    return resultTags[resultId] || [];
}

// 添加標籤
function addResultTag(resultId) {
    const tagName = prompt('輸入標籤名稱（例如：重要、基準線、生產環境）：');
    if (tagName && tagName.trim()) {
        const tag = tagName.trim();
        if (!resultTags[resultId]) {
            resultTags[resultId] = [];
        }
        if (!resultTags[resultId].includes(tag)) {
            resultTags[resultId].push(tag);
            saveResultTags();
            Toast.success(`已添加標籤：${tag}`);
            // 重新渲染
            if (window.ResultFilters) {
                const filtered = window.ResultFilters.getFilteredResults();
                renderResults(filtered);
            }
        }
    }
}

// 導出結果
function exportResult(resultId) {
    Toast.info('導出功能開發中...');
    // TODO: 實現導出功能
}

// 刪除結果
function deleteResult(resultId) {
    window.ConfirmDialog.confirmDelete('此評估結果', async () => {
        try {
            // TODO: 調用刪除API
            Toast.success('刪除成功！');
            await loadEvaluationResults();
        } catch (error) {
            Toast.error('刪除失敗: ' + error.message);
        }
    });
}

// 刷新結果
function refreshResults() {
    loadEvaluationResults();
}

// 載入標籤
loadResultTags();

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否在結果頁面並且結果容器可見
    const resultsContainer = document.getElementById('resultsTable');
    const resultsTab = document.getElementById('results');
    
    if (resultsContainer && resultsTab && resultsTab.style.display !== 'none') {
        loadEvaluationResults();
    }
});
