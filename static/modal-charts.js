// 彈出視窗圖表模組
// 處理詳細圖表的彈出視窗功能

class ModalCharts {
    // 顯示詳細圖表彈出視窗
    static show(evalId) {
        const detail = window.currentEvalDetail;
        if (!detail) {
            console.error('無法獲取評估詳細數據');
            return;
        }
        
        // 創建模態框
        const modalHtml = `
            <div class="modal fade" id="detailedChartsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">詳細統計圖表 - ${evalId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6 mb-4">
                                    <div class="card">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0"><i class="fas fa-check-circle me-2"></i>Assertions 統計</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="modalAssertionsChart" width="400" height="300"></canvas>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-4">
                                    <div class="card">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="fas fa-clock me-2"></i>Latency 分佈</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="modalLatencyChart" width="400" height="300"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header bg-warning text-dark">
                                            <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>分數分佈</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="modalScoreChart" width="800" height="400"></canvas>
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
        const existingModal = document.getElementById('detailedChartsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新的模態框到頁面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('detailedChartsModal'));
        modal.show();
        
        // 延遲創建圖表，確保模態框完全顯示
        setTimeout(() => {
            this.createAssertionsChart(detail);
            this.createLatencyChart(detail);
            this.createScoreChart(detail);
        }, 300);
        
        // 模態框關閉後移除DOM元素
        document.getElementById('detailedChartsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    // 創建模態框中的 Assertions 圖表
    static createAssertionsChart(detail) {
        const ctx = document.getElementById('modalAssertionsChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        // 收集 assertions 數據，更精確地區分不同指標
        const assertionTypes = {};
        detail.details.forEach(test => {
            if (test.assertions && test.assertions.length > 0) {
                test.assertions.forEach(assertion => {
                    let displayName = assertion.type || 'unknown';
                    
                    // 對於 python 類型，根據 value 區分不同指標
                    if (assertion.type === 'python' && assertion.value) {
                        if (assertion.value.includes('bert_f1')) {
                            displayName = 'BERTScore F1';
                        } else if (assertion.value.includes('bert_recall')) {
                            displayName = 'BERTScore Recall';
                        } else if (assertion.value.includes('bert_precision')) {
                            displayName = 'BERTScore Precision';
                        } else {
                            displayName = 'Python評估';
                        }
                    }
                    
                    // 對於 g-eval 類型，可以根據 value 的內容進一步區分
                    if (assertion.type === 'g-eval' && assertion.value) {
                        if (assertion.value.length > 50) {
                            if (assertion.value.includes('台電') || assertion.value.includes('服務相關')) {
                                displayName = 'G-Eval (服務相關性)';
                            } else if (assertion.value.includes('無關') || assertion.value.includes('問題')) {
                                displayName = 'G-Eval (問題相關性)';
                            } else {
                                displayName = 'G-Eval';
                            }
                        } else {
                            displayName = 'G-Eval';
                        }
                    }
                    
                    if (!assertionTypes[displayName]) {
                        assertionTypes[displayName] = { pass: 0, fail: 0 };
                    }
                    if (assertion.pass) {
                        assertionTypes[displayName].pass++;
                    } else {
                        assertionTypes[displayName].fail++;
                    }
                });
            }
        });

        const labels = Object.keys(assertionTypes);
        if (labels.length === 0) {
            ctx.getContext('2d').font = '16px Arial';
            ctx.getContext('2d').fillText('無 Assertions 數據', 50, 150);
            return;
        }

        const passData = labels.map(label => assertionTypes[label].pass);
        const failData = labels.map(label => assertionTypes[label].fail);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pass',
                        data: passData,
                        backgroundColor: '#28a745',
                        borderColor: '#1e7e34',
                        borderWidth: 1
                    },
                    {
                        label: 'Fail',
                        data: failData,
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: '數量' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Assertions 通過/失敗統計'
                    }
                }
            }
        });
    }

    // 創建模態框中的 Latency 圖表
    static createLatencyChart(detail) {
        const ctx = document.getElementById('modalLatencyChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        // 收集延遲數據
        const latencies = detail.details
            .filter(test => test.latency && test.latency > 0)
            .map(test => test.latency);

        if (latencies.length === 0) {
            ctx.getContext('2d').font = '16px Arial';
            ctx.getContext('2d').fillText('無 Latency 數據', 50, 150);
            return;
        }

        // 創建延遲分佈直方圖
        const bins = 8;
        const min = Math.min(...latencies);
        const max = Math.max(...latencies);
        const binSize = (max - min) / bins;
        
        const latencyBins = new Array(bins).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < bins; i++) {
            const start = Math.round(min + i * binSize);
            const end = Math.round(min + (i + 1) * binSize);
            binLabels.push(`${start}-${end}ms`);
        }
        
        latencies.forEach(latency => {
            const binIndex = Math.min(Math.floor((latency - min) / binSize), bins - 1);
            latencyBins[binIndex]++;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: '測試數量',
                    data: latencyBins,
                    backgroundColor: '#17a2b8',
                    borderColor: '#138496',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: '測試數量' }
                    },
                    x: {
                        title: { display: true, text: 'Latency (ms)' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Latency 分佈 (${latencies.length} 個測試)`
                    },
                    legend: { display: false }
                }
            }
        });
    }

    // 創建模態框中的分數分佈圖表
    static createScoreChart(detail) {
        const ctx = document.getElementById('modalScoreChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        const scores = detail.details.map(test => test.score || 0);
        
        // 創建分數區間
        const scoreBins = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
        const scoreLabels = ['0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'];
        
        scores.forEach(score => {
            if (score <= 0.2) scoreBins[0]++;
            else if (score <= 0.4) scoreBins[1]++;
            else if (score <= 0.6) scoreBins[2]++;
            else if (score <= 0.8) scoreBins[3]++;
            else scoreBins[4]++;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scoreLabels,
                datasets: [{
                    label: '測試數量',
                    data: scoreBins,
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'],
                    borderColor: ['#c82333', '#e8590c', '#e0a800', '#1aa179', '#1e7e34'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: '測試數量' }
                    },
                    x: {
                        title: { display: true, text: '分數區間' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `分數分佈 (${scores.length} 個測試)`
                    },
                    legend: { display: false }
                }
            }
        });
    }
}

// 導出到全局作用域
window.ModalCharts = ModalCharts;
