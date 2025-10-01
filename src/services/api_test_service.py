"""API測試服務"""
import json
import requests
from src.utils.response_transform import apply_response_transform


class ApiTestService:
    """API測試相關服務"""
    
    def test_api(self, method, url, headers, body, transform_response):
        """測試API配置"""
        try:
            if not url:
                return {'success': False, 'error': 'URL不能為空'}, 400
            
            # 解析body為JSON（如果是JSON格式）
            request_data = None
            if body:
                try:
                    request_data = json.loads(body)
                except json.JSONDecodeError:
                    request_data = body
            
            print(f"測試API: {method} {url}")
            print(f"Headers: {headers}")
            print(f"Body: {body}")
            
            # 發送請求到目標API
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=request_data if isinstance(request_data, dict) else None,
                    data=request_data if isinstance(request_data, str) else None,
                    timeout=30
                )
                
                # 解析響應
                try:
                    response_json = response.json()
                except:
                    response_json = {'raw_response': response.text}
                
                # 應用transform（如果有配置）
                transformed_response = None
                if transform_response and response_json:
                    try:
                        transformed_response = apply_response_transform(response_json, transform_response)
                    except Exception as e:
                        print(f"Transform錯誤: {e}")
                        transformed_response = f"Transform錯誤: {str(e)}"
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        'response': response_json,
                        'transformedResponse': transformed_response,
                        'statusCode': response.status_code,
                        'headers': dict(response.headers)
                    }, 200
                else:
                    return {
                        'success': False,
                        'error': f'API返回錯誤狀態碼 {response.status_code}: {response.text}',
                        'response': response_json,
                        'statusCode': response.status_code
                    }, 200
                    
            except requests.exceptions.Timeout:
                return {'success': False, 'error': 'API請求超時（30秒）'}, 500
            except requests.exceptions.ConnectionError:
                return {'success': False, 'error': '無法連接到API服務器，請檢查URL和網路連接'}, 500
            except requests.exceptions.RequestException as e:
                return {'success': False, 'error': f'請求錯誤: {str(e)}'}, 500
                
        except Exception as e:
            print(f"API測試錯誤: {e}")
            return {'success': False, 'error': f'測試失敗: {str(e)}'}, 500
