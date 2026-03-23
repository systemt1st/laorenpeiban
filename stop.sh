#!/bin/bash
#
# 老人陪伴助手 — 停止脚本
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec "$SCRIPT_DIR/manage.sh" stop "$@"
