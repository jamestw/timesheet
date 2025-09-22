#!/usr/bin/env python3
"""
GitHub Webhook 自動部署腳本
放在服務器上，當 GitHub 有 push 事件時自動觸發部署
"""

from flask import Flask, request, jsonify
import subprocess
import hashlib
import hmac
import os
import logging

app = Flask(__name__)

# 設定
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'your-webhook-secret')
DEPLOY_SCRIPT = '/var/www/timesheet/deploy.sh'
ALLOWED_BRANCH = 'master'

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_signature(payload_body, secret_token, signature_header):
    """驗證 GitHub webhook 簽名"""
    if not signature_header:
        return False

    hash_object = hmac.new(
        secret_token.encode('utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    )
    expected_signature = "sha256=" + hash_object.hexdigest()

    return hmac.compare_digest(expected_signature, signature_header)

@app.route('/webhook', methods=['POST'])
def github_webhook():
    """處理 GitHub webhook"""

    # 驗證簽名
    signature = request.headers.get('X-Hub-Signature-256')
    if not verify_signature(request.data, WEBHOOK_SECRET, signature):
        logger.warning('Invalid signature')
        return jsonify({'error': 'Invalid signature'}), 401

    # 解析 payload
    payload = request.get_json()

    if not payload:
        return jsonify({'error': 'No payload'}), 400

    # 檢查是否為 push 事件
    if request.headers.get('X-GitHub-Event') != 'push':
        return jsonify({'message': 'Not a push event'}), 200

    # 檢查分支
    ref = payload.get('ref', '')
    if ref != f'refs/heads/{ALLOWED_BRANCH}':
        logger.info(f'Ignoring push to {ref}')
        return jsonify({'message': f'Ignoring push to {ref}'}), 200

    # 執行部署
    try:
        logger.info('Starting deployment...')
        result = subprocess.run(['/bin/bash', DEPLOY_SCRIPT],
                              capture_output=True, text=True, timeout=300)

        if result.returncode == 0:
            logger.info('Deployment successful')
            return jsonify({
                'message': 'Deployment successful',
                'output': result.stdout
            }), 200
        else:
            logger.error(f'Deployment failed: {result.stderr}')
            return jsonify({
                'error': 'Deployment failed',
                'output': result.stderr
            }), 500

    except subprocess.TimeoutExpired:
        logger.error('Deployment timeout')
        return jsonify({'error': 'Deployment timeout'}), 500
    except Exception as e:
        logger.error(f'Deployment error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)