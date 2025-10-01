"""靜態檔案路由"""
from flask import send_from_directory


def register_static_routes(app):
    """註冊靜態檔案路由"""
    
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """提供靜態檔案"""
        return app.send_static_file(filename)
