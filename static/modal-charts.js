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
        ChartUtils.createAssertionsChart(detail, 'modalAssertionsChart');
    }

    // 創建模態框中的 Latency 圖表
    static createLatencyChart(detail) {
        ChartUtils.createLatencyChart(detail, 'modalLatencyChart');
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
