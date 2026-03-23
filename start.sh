#!/bin/bash
#
# 老人陪伴助手 — 启动脚本
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec "$SCRIPT_DIR/manage.sh" start "$@"
