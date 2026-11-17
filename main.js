const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  screen,
  nativeImage,
  ipcMain,
  shell,
} = require('electron');
const path = require('path');
const sharp = require('sharp');
const config = require('./config');
const { createOptimizer } = require('./optimizer');
const { createHistory } = require('./history');

const PANEL_SIZE = { width: 580, height: 440 };
const ARROW_SIZE = { width: 30, height: 64 };
const MARGIN = 16;

const COLOR_ON = '#22c55e';
const COLOR_OFF = '#9ca3af';

let active = config.startActive;
let panelVisible = false;

let panelWin = null;
let arrowWin = null;
let tray = null;
let optimizer = null;
let history = null;
let trayIcons = null;

// ---------- estado ----------

const getState = () => ({ active, count: history ? history.list().length : 0 });

function broadcast() {
  for (const win of [panelWin, arrowWin]) {
    if (win && !win.isDestroyed()) win.webContents.send('state', getState());
  }
  refreshTray();
}

function sendHistory() {
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.webContents.send('history', history.list());
  }
}

async function setActive(value) {
  active = value;
  if (active) optimizer.start();
  else await optimizer.stop();
  broadcast();
}

// ---------- ícones ----------

async function buildArrowIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
    <path d="M52 32H14M30 16L14 32l16 16" fill="none" stroke="${color}"
      stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return nativeImage.createFromBuffer(png);
}

// ---------- janelas ----------

function baseWindowOptions(size) {
  return {
    ...size,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}

function currentDisplay() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function placePanel() {
  const { workArea } = currentDisplay();
  panelWin.setPosition(
    workArea.x + workArea.width - PANEL_SIZE.width - MARGIN,
    workArea.y + MARGIN
  );
}

function placeArrow() {
  const { workArea } = currentDisplay();
  arrowWin.setPosition(
    workArea.x + workArea.width - ARROW_SIZE.width,
    Math.round(workArea.y + workArea.height / 2 - ARROW_SIZE.height / 2)
  );
}

function createWindows() {
  panelWin = new BrowserWindow(baseWindowOptions(PANEL_SIZE));
  panelWin.setAlwaysOnTop(true, 'screen-saver');
  panelWin.loadFile('panel.html');

  arrowWin = new BrowserWindow(baseWindowOptions(ARROW_SIZE));
  arrowWin.setAlwaysOnTop(true, 'screen-saver');
  arrowWin.loadFile('arrow.html');
}

function showPanel() {
  placePanel();
  arrowWin.hide();
  panelWin.show();
  panelWin.focus();
  panelVisible = true;
}

function collapse() {
  panelWin.hide();
  placeArrow();
  arrowWin.showInactive();
  panelVisible = false;
}

function togglePanel() {
  if (panelVisible) collapse();
  else showPanel();
}

// ---------- bandeja do sistema ----------

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: panelVisible ? `Recolher painel (${config.hotkey})` : `Abrir painel (${config.hotkey})`,
      click: togglePanel,
    },
    {
      label: active ? 'Desativar' : 'Ativar',
      click: () => setActive(!active),
    },
    { label: 'Abrir pasta das otimizadas', click: () => shell.openPath(config.outputDir) },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ]);
}

function refreshTray() {
  if (!tray) return;
  tray.setImage(active ? trayIcons.on : trayIcons.off);
  tray.setToolTip(`Otimizador WebP — ${active ? 'ativo' : 'desativado'}`);
  tray.setContextMenu(buildTrayMenu());
}

function createTray() {
  tray = new Tray(trayIcons.on);
  tray.on('click', togglePanel);
  refreshTray();
}

// ---------- IPC ----------

function registerIpc() {
  ipcMain.handle('get-state', () => getState());
  ipcMain.handle('get-history', () => history.list());
  ipcMain.on('clear-history', () => {
    history.clear();
    sendHistory();
    broadcast();
  });
  ipcMain.on('toggle-active', () => setActive(!active));
  ipcMain.on('collapse', collapse);
  ipcMain.on('expand', showPanel);
  ipcMain.on('quit', () => app.quit());
}

// ---------- ciclo de vida ----------

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  // Uma segunda execução apenas abre o painel da instância que já está rodando.
  app.on('second-instance', () => {
    if (panelWin) showPanel();
  });

  // O app vive na bandeja: fechar/ocultar janelas não deve encerrá-lo.
  app.on('window-all-closed', () => {});

  app.whenReady().then(async () => {
    trayIcons = {
      on: await buildArrowIcon(COLOR_ON),
      off: await buildArrowIcon(COLOR_OFF),
    };

    history = createHistory(path.join(app.getPath('userData'), 'history.json'), config.historyLimit);

    optimizer = createOptimizer(config, {
      onResult: (result) => {
        // Duplicatas (arquivo já gerado antes) e erros não entram no histórico.
        if (!result.ok || result.skipped) return;

        history.add({
          at: Date.now(),
          name: result.name,
          outputName: result.outputName,
          outputPath: result.output,
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          mode: result.mode,
        });
        sendHistory();
        broadcast();
      },
    });

    registerIpc();
    createWindows();
    createTray();

    const registered = globalShortcut.register(config.hotkey, togglePanel);
    if (!registered) {
      console.error(`Não foi possível registrar o atalho ${config.hotkey} (talvez outro app o esteja usando).`);
      tray.displayBalloon({
        title: 'Otimizador WebP',
        content: `O atalho ${config.hotkey} está em uso por outro programa. Use o ícone da bandeja.`,
      });
    }

    if (active) optimizer.start();

    // Começa recolhido, mostrando só a flecha.
    arrowWin.webContents.once('did-finish-load', () => {
      collapse();
      broadcast();
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (optimizer) optimizer.stop();
    if (history) history.flushSync();
  });
}
