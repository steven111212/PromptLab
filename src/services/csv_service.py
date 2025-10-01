"""CSV檔案處理服務"""
import pandas as pd


class CsvService:
    """CSV檔案處理相關服務"""
    
    def upload_csv(self, file):
        """處理CSV檔案上傳並返回欄位信息"""
        try:
            if not file:
                return {'error': '沒有選擇檔案'}, 400
            
            if file.filename == '':
                return {'error': '沒有選擇檔案'}, 400
            
            if not file.filename.lower().endswith('.csv'):
                return {'error': '請上傳CSV檔案'}, 400
            
            # 讀取CSV檔案
            import io
            csv_content = file.read().decode('utf-8')
            csv_io = io.StringIO(csv_content)
            
            # 使用pandas讀取CSV
            df = pd.read_csv(csv_io)
            
            # 獲取欄位名稱
            headers = df.columns.tolist()
            
            # 返回欄位信息
            return {
                'success': True,
                'headers': headers,
                'row_count': len(df),
                'message': f'成功讀取CSV檔案，包含 {len(df)} 行數據'
            }, 200
            
        except Exception as e:
            print(f"CSV上傳錯誤: {e}")
            return {'error': f'CSV檔案處理失敗: {str(e)}'}, 500
