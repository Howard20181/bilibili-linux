#!/bin/bash

# 用于github actions构建
# 解压初步构建后的文件

# 脚本执行前提，已完成支持wine的基本构建
set -e
success() {
    echo -e "\033[42;37m 成功 \033[0m $1"
}
notice() {
    echo -e "\033[36m $1 \033[0m "
}
fail() {
    echo -e "\033[41;37m 失败 \033[0m $1"
}

rm -rf app electron
tar -zxf bilibili-*.src/bilibili-*.tar.gz -C .
