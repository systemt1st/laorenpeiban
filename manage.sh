#!/bin/bash
#
# 老人陪伴助手 — 一键管理脚本
# 推荐用法:
#   ./start.sh   启动
#   ./stop.sh    停止
#   ./restart.sh 重启
# 其他:
#   ./manage.sh status
#

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_PID_FILE="$PROJECT_DIR/.server.pid"
CLIENT_PID_FILE="$PROJECT_DIR/.client.pid"
SERVER_PORT=8004
CLIENT_PORT=5173

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ========================================
# 检查依赖
# ========================================
check_deps() {
    if ! command -v node &>/dev/null; then
        log_error "未找到 Node.js，请先安装 Node.js 20+"
        exit 1
    fi
    if ! command -v npx &>/dev/null; then
        log_error "未找到 npx，请先安装 npm"
        exit 1
    fi

    # 检查是否安装了依赖
    if [ ! -d "$SERVER_DIR/node_modules" ]; then
        log_info "安装后端依赖..."
        cd "$SERVER_DIR" && npm install
    fi
    if [ ! -d "$CLIENT_DIR/node_modules" ]; then
        log_info "安装前端依赖..."
        cd "$CLIENT_DIR" && npm install
    fi

    # 确保 .env 存在
    if [ ! -f "$SERVER_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env.example" "$SERVER_DIR/.env"
        log_info "已从 .env.example 创建 server/.env"
    fi

    # 确保数据目录存在
    mkdir -p "$SERVER_DIR/data" "$SERVER_DIR/logs"
}

# ========================================
# 启动
# ========================================
start_server() {
    if [ -f "$SERVER_PID_FILE" ] && kill -0 "$(cat "$SERVER_PID_FILE")" 2>/dev/null; then
        log_warn "后端已在运行 (PID: $(cat "$SERVER_PID_FILE"))"
        return
    fi

    log_info "启动后端服务 (端口 $SERVER_PORT)..."
    cd "$SERVER_DIR"
    nohup npx ts-node src/index.ts > "$SERVER_DIR/logs/server.out" 2>&1 &
    echo $! > "$SERVER_PID_FILE"
    sleep 3

    if kill -0 "$(cat "$SERVER_PID_FILE")" 2>/dev/null; then
        log_info "后端启动成功 (PID: $(cat "$SERVER_PID_FILE"))"
    else
        log_error "后端启动失败，查看日志: $SERVER_DIR/logs/server.out"
        rm -f "$SERVER_PID_FILE"
        return 1
    fi
}

start_client() {
    if [ -f "$CLIENT_PID_FILE" ] && kill -0 "$(cat "$CLIENT_PID_FILE")" 2>/dev/null; then
        log_warn "前端已在运行 (PID: $(cat "$CLIENT_PID_FILE"))"
        return
    fi

    log_info "启动前端服务 (端口 $CLIENT_PORT)..."
    cd "$CLIENT_DIR"
    nohup npx vite --host > "$SERVER_DIR/logs/client.out" 2>&1 &
    echo $! > "$CLIENT_PID_FILE"
    sleep 3

    if kill -0 "$(cat "$CLIENT_PID_FILE")" 2>/dev/null; then
        log_info "前端启动成功 (PID: $(cat "$CLIENT_PID_FILE"))"
    else
        log_error "前端启动失败，查看日志: $SERVER_DIR/logs/client.out"
        rm -f "$CLIENT_PID_FILE"
        return 1
    fi
}

do_start() {
    check_deps
    start_server
    start_client
    echo ""
    log_info "========================================="
    log_info "  老人陪伴助手已启动"
    log_info "  前端: http://localhost:$CLIENT_PORT"
    log_info "  后端: http://localhost:$SERVER_PORT"
    log_info "  API:  http://localhost:$CLIENT_PORT/api/"
    log_info "========================================="
}

# ========================================
# 停止
# ========================================
stop_process() {
    local name=$1
    local pid_file=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            sleep 2
            # 如果还没退出，强制终止
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null
            fi
            log_info "$name 已停止 (PID: $pid)"
        else
            log_warn "$name 进程不存在 (PID: $pid)"
        fi
        rm -f "$pid_file"
    else
        log_warn "$name 未在运行"
    fi
}

do_stop() {
    stop_process "后端" "$SERVER_PID_FILE"
    stop_process "前端" "$CLIENT_PID_FILE"
    # 清理可能残留的进程
    pkill -f "ts-node src/index.ts" 2>/dev/null
    pkill -f "vite --host" 2>/dev/null
    log_info "所有服务已停止"
}

# ========================================
# 重启
# ========================================
do_restart() {
    log_info "正在重启..."
    do_stop
    sleep 2
    do_start
}

# ========================================
# 状态
# ========================================
do_status() {
    echo ""
    echo "老人陪伴助手 — 服务状态"
    echo "========================"

    # 后端状态
    if [ -f "$SERVER_PID_FILE" ] && kill -0 "$(cat "$SERVER_PID_FILE")" 2>/dev/null; then
        local health=$(curl -s http://localhost:$SERVER_PORT/api/health 2>/dev/null)
        if [ -n "$health" ]; then
            echo -e "后端: ${GREEN}运行中${NC} (PID: $(cat "$SERVER_PID_FILE"), 端口: $SERVER_PORT)"
        else
            echo -e "后端: ${YELLOW}进程存在但无响应${NC} (PID: $(cat "$SERVER_PID_FILE"))"
        fi
    else
        echo -e "后端: ${RED}未运行${NC}"
    fi

    # 前端状态
    if [ -f "$CLIENT_PID_FILE" ] && kill -0 "$(cat "$CLIENT_PID_FILE")" 2>/dev/null; then
        local resp=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$CLIENT_PORT 2>/dev/null)
        if [ "$resp" = "200" ]; then
            echo -e "前端: ${GREEN}运行中${NC} (PID: $(cat "$CLIENT_PID_FILE"), 端口: $CLIENT_PORT)"
        else
            echo -e "前端: ${YELLOW}进程存在但无响应${NC} (PID: $(cat "$CLIENT_PID_FILE"))"
        fi
    else
        echo -e "前端: ${RED}未运行${NC}"
    fi

    echo ""
}

# ========================================
# 主入口
# ========================================
case "${1:-}" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_restart
        ;;
    status)
        do_status
        ;;
    *)
        echo "推荐用法:"
        echo "  ./start.sh   — 启动前端和后端服务"
        echo "  ./stop.sh    — 停止所有服务"
        echo "  ./restart.sh — 重启所有服务"
        echo ""
        echo "其他命令:"
        echo "  $0 status — 查看服务运行状态"
        exit 1
        ;;
esac
