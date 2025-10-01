"""API路由"""
import time
from flask import jsonify, request
from src.services.evaluation_service import EvaluationService
from src.services.config_service import ConfigService
from src.services.api_test_service import ApiTestService
from src.services.validation_service import ValidationService
from src.services.csv_service import CsvService
from src.services.execution_service import ExecutionService


def register_api_routes(app):
    """註冊API路由"""
    
    # 初始化服務
    evaluation_service = EvaluationService()
    config_service = ConfigService()
    api_test_service = ApiTestService()
    validation_service = ValidationService()
    csv_service = CsvService()
    execution_service = ExecutionService()
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """健康檢查"""
        return jsonify({
            'status': 'ok', 
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'platform': 'Python Flask'
        })

    @app.route('/api/evaluation-results', methods=['GET'])
    def get_evaluation_results():
        """獲取評估結果摘要"""
        result, status_code = evaluation_service.get_evaluation_results()
        return jsonify(result), status_code

    @app.route('/api/evaluation-results/<eval_id>', methods=['GET'])
    def get_evaluation_detail(eval_id):
        """獲取特定評估的詳細結果"""
        result, status_code = evaluation_service.get_evaluation_detail(eval_id)
        return jsonify(result), status_code

    @app.route('/api/configs', methods=['GET'])
    def get_configs():
        """獲取所有配置"""
        result, status_code = config_service.get_configs()
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['GET'])
    def get_config(config_id):
        """獲取特定配置"""
        result, status_code = config_service.get_config(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>/check-files', methods=['GET'])
    def check_config_files(config_id):
        """檢查配置相關檔案是否存在"""
        result, status_code = config_service.check_config_files(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs', methods=['POST'])
    def save_config():
        """保存配置"""
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        result, status_code = config_service.save_config(name, content, uploaded_file)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['PUT'])
    def update_config(config_id):
        """更新配置"""
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        result, status_code = config_service.update_config(config_id, name, content, uploaded_file)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['DELETE'])
    def delete_config(config_id):
        """刪除配置"""
        result, status_code = config_service.delete_config(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>/run', methods=['POST'])
    def run_config(config_id):
        """執行配置"""
        result, status_code = execution_service.run_config(config_id)
        return jsonify(result), status_code

    @app.route('/api/assert-templates', methods=['GET'])
    def get_assert_templates():
        """獲取Assert指標模板"""
        templates = [
            {
                'id': 'g-eval',
                'name': 'G-Eval 評分',
                'description': '使用LLM進行評分',
                'template': {
                    'type': 'g-eval',
                    'value': [
                        '評分標準1',
                        '評分標準2'
                    ]
                }
            },
            {
                'id': 'javascript',
                'name': 'JavaScript 驗證',
                'description': '使用JavaScript表達式驗證',
                'template': {
                    'type': 'javascript',
                    'value': 'output.length >= 100'
                }
            },
            {
                'id': 'contains',
                'name': '包含檢查',
                'description': '檢查輸出是否包含特定內容',
                'template': {
                    'type': 'contains',
                    'value': 'expected text'
                }
            },
            {
                'id': 'not-contains',
                'name': '不包含檢查',
                'description': '檢查輸出不包含特定內容',
                'template': {
                    'type': 'not-contains',
                    'value': 'unwanted text'
                }
            },
            {
                'id': 'regex',
                'name': '正則表達式',
                'description': '使用正則表達式驗證',
                'template': {
                    'type': 'regex',
                    'value': '^[A-Z].*$'
                }
            },
            {
                'id': 'similar',
                'name': '相似度檢查',
                'description': '檢查與期望輸出的相似度',
                'template': {
                    'type': 'similar',
                    'value': 'expected output',
                    'threshold': 0.8
                }
            }
        ]
        return jsonify(templates)

    @app.route('/api/test-api', methods=['POST'])
    def test_api():
        """測試API配置"""
        data = request.json
        method = data.get('method', 'POST')
        url = data.get('url', '')
        headers = data.get('headers', {})
        body = data.get('body', '')
        transform_response = data.get('transformResponse', '')
        
        result, status_code = api_test_service.test_api(method, url, headers, body, transform_response)
        return jsonify(result), status_code

    @app.route('/api/validate-config', methods=['POST'])
    def validate_config():
        """驗證配置"""
        data = request.json
        content = data.get('content', '')
        
        result, status_code = validation_service.validate_config(content)
        return jsonify(result), status_code

    @app.route('/api/upload-csv', methods=['POST'])
    def upload_csv():
        """處理CSV檔案上傳並返回欄位信息"""
        if 'file' not in request.files:
            return jsonify({'error': '沒有選擇檔案'}), 400
        
        file = request.files['file']
        result, status_code = csv_service.upload_csv(file)
        return jsonify(result), status_code
