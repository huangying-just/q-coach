#!/bin/bash

# Q-Coach 网络问题快速修复脚本
# 解决构建时的 ETIMEDOUT 错误

echo "🔧 Q-Coach 网络问题快速修复..."

# 设置环境变量禁用遥测
export NEXT_TELEMETRY_DISABLED=1
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false
export DISABLE_OPENCOLLECTIVE=1

echo "✅ 已禁用遥测和资助信息"

# 配置npm使用国内镜像源
npm config set registry https://registry.npmmirror.com/
npm config set disturl https://npmmirror.com/dist
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set sass_binary_site https://npmmirror.com/mirrors/node-sass/
npm config set phantomjs_cdnurl https://npmmirror.com/mirrors/phantomjs/
npm config set chromedriver_cdnurl https://npmmirror.com/mirrors/chromedriver/
npm config set operadriver_cdnurl https://npmmirror.com/mirrors/operadriver/
npm config set fse_binary_host_mirror https://npmmirror.com/mirrors/fsevents/

echo "✅ 已配置npm镜像源"

# 设置代理绕过（如果在公司网络）
# npm config set proxy http://your-proxy-server:port
# npm config set https-proxy http://your-proxy-server:port

# 清除npm缓存
npm cache clean --force

echo "✅ 已清除npm缓存"

# 检查网络连接
echo "🔍 检查网络连接..."
if ping -c 1 registry.npmmirror.com > /dev/null 2>&1; then
    echo "✅ 镜像源连接正常"
else
    echo "❌ 镜像源连接失败，请检查网络"
fi

# 尝试重新安装依赖
echo "📦 重新安装依赖..."
rm -rf node_modules package-lock.json
npm install

echo "🔨 尝试构建..."
npm run build

echo "🎉 修复完成！如果仍有问题，请检查防火墙和代理设置。" 