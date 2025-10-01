"""主要路由"""
from flask import render_template


def register_main_routes(app):
    """註冊主要路由"""
    
    @app.route('/')
    def overview():
        """渲染Overview主頁面"""
        return render_template('overview.html')

    @app.route('/scorelab')
    def scorelab():
        """渲染ScoreLab評分工具頁面"""
        return render_template('index.html')

    @app.route('/testrunner')
    def testrunner():
        """渲染TestRunner測試工具頁面"""
        return render_template('testrunner.html')

    @app.route('/attackgen')
    def attackgen():
        """渲染AttackGen生成工具頁面"""
        return render_template('attackgen.html')
