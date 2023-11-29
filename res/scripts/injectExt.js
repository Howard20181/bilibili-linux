const { protocol, session } = require('electron')
const https = require('https');
const HttpGet = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    // console.log(u)
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: `${u.pathname}${u.search}`,
      method: 'GET',
      headers,
    };
    const result = []
    const req = https.request(options, res => {
      // console.log(`statusCode: ${res.statusCode}`);
      res.on('end', () => {
        resolve(Buffer.concat(result).toString())
      })
      res.on('data', d => {
        result.push(d)
      });
    });
    req.on('error', error => {
      // console.error(error);
      reject(error)
    });

    req.end();
  })
}
// HOOK
const { app, BrowserWindow } = require('electron');
const path = require("path");
const { Module } = require("module")

const originalBrowserWindow = BrowserWindow;

const hookBrowserWindow = (OriginalBrowserWindow) => {
  function HookedBrowserWindow(options) {
    // 修改或增加构造函数的选项
    try {
      if (options && options.webPreferences)
        options.webPreferences.devTools = true
      console.log('======HookedBrowserWindow:', options)
    } catch (e) {

    }
    // 使用修改后的选项调用原始构造函数
    return new OriginalBrowserWindow(options);
  }

  // 复制原始构造函数的原型链并进行替换
  HookedBrowserWindow.prototype = Object.create(OriginalBrowserWindow.prototype);
  HookedBrowserWindow.prototype.constructor = HookedBrowserWindow;
  Object.setPrototypeOf(HookedBrowserWindow, OriginalBrowserWindow);

  return HookedBrowserWindow;
};

// 使用替换的构造函数
const HookedBrowserWindow = hookBrowserWindow(originalBrowserWindow);

const ModuleLoadHook = {
  electron: (module) => {
    return {
      ...module,
      BrowserWindow: HookedBrowserWindow
    }
  },
}
const original_load = Module._load;
// console.log('Module:', Module)
Module._load = (...args) => {
  const loaded_module = original_load(...args);
  // console.log('load', args[0])
  if (ModuleLoadHook[args[0]]) {
    return ModuleLoadHook[args[0]](loaded_module)
  }
  else {
    return loaded_module;
  }
}

const originloadURL = BrowserWindow.prototype.loadURL;
BrowserWindow.prototype.loadURL = function () {
  this.setMinimumSize(300, 300);
  // 设置UA，有些番剧播放链接Windows会403
  if (process.platform)
    this.webContents.setUserAgent(`Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) bilibili_pc/${app.getVersion()} Chrome/${process.versions.chrome} Electron/${process.versions.electron} Safari/537.36`)
  console.log('=====loadURL', arguments)
  // DevTools切换
  this.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyUp") {
      this.webContents.toggleDevTools();
    }
  });
  if (arguments[0].includes('player.html') || arguments[0].includes('index.html')) {
    // this.webContents.openDevTools()
    const extPath = path.join(path.dirname(app.getAppPath()), "extensions");
    console.log('----extPath----', extPath)
    this.webContents.session.loadExtension(extPath + "/area_unlimit").then(({ id }) => {
      // ...
      console.log('-----Load Extension:', id)
    })
    // 设置PAC代理脚本
    this.webContents.on('ipc-message-sync', (event, ...args) => {
      if (args[0] === "config/roamingPAC") {
        console.log("receive config/roamingPAC: ", ...args)
        const ses = this.webContents.session
        ses.setProxy({
          mode: 'pac_script',
          pacScript: args[1]
        }).then(res => {
          console.log("====set proxy")
          ses.forceReloadProxyConfig().then(() => {
            ses.resolveProxy("akamai.net").then(res => {
              console.log("resolveProxy akamai.net --> ", res)
              event.returnValue = res.length === 0 ? 'error' : 'ok'
              if (res.length === 0)
                ses.setProxy({ mode: 'system' })
            })

          })
        }).catch(err => {
          console.error("====set error", err)
          event.returnValue = 'error'
        })
      }
    })
  }
  originloadURL.apply(this, arguments)
};

// 从文件加载页面
const _loadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (...args) {
  console.log('=====loadFile:', ...args)
  // DevTools切换
  this.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyUp") {
      this.webContents.toggleDevTools();
    }
  });
  const extPath = path.join(path.dirname(app.getAppPath()), "extensions");
  console.log('extension path:', extPath)
  this.webContents.session.loadExtension(extPath + "/area_unlimit", {
    allowFileAccess: true,
  }).then(({ id }) => {
    // ...
    console.log('-----Load Extension:', id)
  }).catch((e) => {

  })
  _loadFile.apply(this, args)
  // this.loadURL('http://www.jysafe.cn')
}
app.on('ready', () => {
  // const path = require('path');
  // const extPath = path.join(path.dirname(app.getAppPath()), "extensions");
  // 自定义协议的具体实现
  protocol.registerStringProtocol('roaming', (req, cb) => {
    // console.log('registerHttpProtocol', req)
    HttpGet(req.url.replace('roaming', 'https'), {
      cookie: req.headers['x-cookie']
    }).then(res => {
      cb(res)
    }).catch(err => {
      cb({
        statusCode: 500,
        data: JSON.stringify(err)
      })
    })
  })

  protocol.registerHttpProtocol('roaming-thpic', (req, cb) => {
    cb({
      url: req.url.replace('roaming-thpic', 'https')
    })
  })

});
