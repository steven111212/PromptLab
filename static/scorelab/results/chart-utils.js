// 共用的圖表工具模組
// 避免在 chart-manager.js 和 modal-charts.js 中重複相同的邏輯

class ChartUtils {
    // 創建 Assertions 圖表的通用邏輯
    static createAssertionsChart(detail, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') {
            if (ctx) {
                ctx.getContext('2d').font = '14px Arial';
                ctx.getContext('2d').fillText('Chart.js 未載入', 50, 100);
            }
            return null;
        }
        
        // 收集 assertions 數據，精確區分不同指標
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
                    
                    // 對於 g-eval 類型，根據內容進一步區分
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
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Assertions 數據', 50, 100);
            return null;
        }

        const passData = labels.map(label => assertionTypes[label].pass);
        const failData = labels.map(label => assertionTypes[label].fail);

        return new Chart(ctx, {
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

    // 創建 Latency 圖表的通用邏輯
    static createLatencyChart(detail, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') {
            if (ctx) {
                ctx.getContext('2d').font = '14px Arial';
                ctx.getContext('2d').fillText('Chart.js 未載入', 50, 100);
            }
            return null;
        }
        
        // 收集延遲數據
        const latencies = detail.details
            .filter(test => test.latency && test.latency > 0)
            .map(test => test.latency);

        if (latencies.length === 0) {
            ctx.getContext('2d').font = '14px Arial';
            ctx.getContext('2d').fillText('無 Latency 數據', 50, 100);
            return null;
        }

        // 創建延遲分佈直方圖
        const bins = canvasId.includes('modal') ? 8 : 5; // 模態框使用更多分箱
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

        return new Chart(ctx, {
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
}

// 導出到全局作用域
window.ChartUtils = ChartUtils;
