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
        """獲取所有專案"""
        result, status_code = config_service.get_configs()
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['GET'])
    def get_config(config_id):
        """獲取特定專案"""
        result, status_code = config_service.get_config(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>/check-files', methods=['GET'])
    def check_config_files(config_id):
        """檢查專案相關檔案是否存在"""
        result, status_code = config_service.check_config_files(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs', methods=['POST'])
    def save_config():
        """保存專案"""
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        result, status_code = config_service.save_config(name, content, uploaded_file)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['PUT'])
    def update_config(config_id):
        """更新專案"""
        data = request.json
        name = data.get('name', '')
        content = data.get('content', '')
        uploaded_file = data.get('uploadedFile', None)
        
        result, status_code = config_service.update_config(config_id, name, content, uploaded_file)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>', methods=['DELETE'])
    def delete_config(config_id):
        """刪除專案"""
        result, status_code = config_service.delete_config(config_id)
        return jsonify(result), status_code

    @app.route('/api/configs/<config_id>/run', methods=['POST'])
    def run_config(config_id):
        """執行專案"""
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
        """測試API設定"""
        data = request.json
        
        # 檢查是否為新的CSV資料測試格式
        if 'config' in data and 'testData' in data:
            # 新的CSV資料測試格式
            config = data.get('config', {})
            test_data = data.get('testData', {})
            
            method = config.get('method', 'POST')
            url = config.get('url', '')
            headers = config.get('headers', {})
            body = config.get('body', '')
            transform_response = config.get('transformResponse', '')
            
            # 記錄CSV資料測試
            print(f"CSV資料測試 - 使用資料: {test_data}")
            
        else:
            # 傳統的手動測試格式
            method = data.get('method', 'POST')
            url = data.get('url', '')
            headers = data.get('headers', {})
            body = data.get('body', '')
            transform_response = data.get('transformResponse', '')
        
        result, status_code = api_test_service.test_api(method, url, headers, body, transform_response)
        return jsonify(result), status_code

    @app.route('/api/validate-config', methods=['POST'])
    def validate_config():
        """驗證專案"""
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

    @app.route('/api/get-csv-headers/<config_id>', methods=['GET'])
    def get_csv_headers(config_id):
        """獲取已配置CSV檔案的headers"""
        try:
            from src.services.config_service import ConfigService
            config_service = ConfigService()
            
            # 獲取配置資訊
            config_result, status_code = config_service.get_config(config_id)
            if status_code != 200:
                return jsonify({'error': '配置不存在'}), 404
            
            config = config_result['parsed']
            
            # 檢查是否有tests配置
            if 'tests' in config and config['tests']:
                for test in config['tests']:
                    if isinstance(test, str) and test.startswith('file://'):
                        filename = test.replace('file://', '')
                        
                        # 構建檔案路徑
                        import os
                        config_dir = os.path.join('configs', config_id)
                        csv_path = os.path.join(config_dir, filename)
                        
                        if os.path.exists(csv_path):
                            # 讀取CSV檔案並返回headers
                            import pandas as pd
                            df = pd.read_csv(csv_path)
                            headers = df.columns.tolist()
                            
                            return jsonify({
                                'success': True,
                                'headers': headers,
                                'filename': filename
                            }), 200
            
            return jsonify({'error': '沒有找到CSV檔案'}), 404
            
        except Exception as e:
            print(f"獲取CSV headers錯誤: {e}")
            return jsonify({'error': f'獲取CSV headers失敗: {str(e)}'}), 500

    @app.route('/api/get-csv-content/<config_id>/<filename>', methods=['GET'])
    def get_csv_content(config_id, filename):
        """獲取已配置CSV檔案的內容"""
        try:
            from src.services.config_service import ConfigService
            config_service = ConfigService()
            
            # 獲取配置資訊
            config_result, status_code = config_service.get_config(config_id)
            if status_code != 200:
                return jsonify({'error': '配置不存在'}), 404
            
            config = config_result['parsed']
            
            # 檢查是否有tests配置
            if 'tests' in config and config['tests']:
                for test in config['tests']:
                    if isinstance(test, str) and test.startswith('file://'):
                        test_filename = test.replace('file://', '')
                        
                        # 檢查檔案名稱是否匹配
                        if test_filename == filename:
                            # 構建檔案路徑
                            import os
                            config_dir = os.path.join('configs', config_id)
                            csv_path = os.path.join(config_dir, filename)
                            
                            if os.path.exists(csv_path):
                                # 讀取CSV檔案內容
                                with open(csv_path, 'r', encoding='utf-8') as f:
                                    csv_content = f.read()
                                
                                return jsonify({
                                    'success': True,
                                    'data': csv_content,
                                    'filename': filename
                                }), 200
            
            return jsonify({'error': '沒有找到指定的CSV檔案'}), 404
            
        except Exception as e:
            print(f"獲取CSV內容錯誤: {e}")
            return jsonify({'error': f'獲取CSV內容失敗: {str(e)}'}), 500