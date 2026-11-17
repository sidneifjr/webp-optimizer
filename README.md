# Otimizador WebP

App em Electron (Node.js) que roda em segundo plano, observa a pasta **Downloads** e converte
cada imagem nova para **WebP**, salvando em `Downloads\Otimizadas` com um **hash no início do
nome**:

```
foto.png  ->  Downloads\Otimizadas\3f9a1c07b2_foto.webp
```

O hash (SHA-256, 10 caracteres) é calculado sobre o conteúdo do WebP gerado. Imagens idênticas
produzem o mesmo nome, então duplicatas são ignoradas.

## Como rodar

Requer Node.js 20+ no Windows 10.

```bash
npm install
npm start
```

## Conversão lossless

A conversão tenta **sempre primeiro o modo sem perdas** (lossless), preservando os pixels
exatamente, inclusive a transparência e o perfil de cor.

Quando o lossless ficaria **maior que o original** (o que é comum em JPEG e AVIF, que já são
formatos com perdas), o app usa o modo com perdas (qualidade 80 por padrão) para não aumentar o
arquivo. Essas imagens aparecem com a etiqueta **com perdas** no histórico.

Em `config.js`, dentro de `webp`:

- `lossless: false` desliga o lossless e usa sempre o modo com perdas;
- `allowLossyFallback: false` mantém sempre lossless, mesmo que o arquivo cresça;
- `quality` e `effort` ajustam o modo com perdas e o esforço de compressão.

Observação: `maxWidth` (redimensionar) deixa a conversão de ser lossless em relação ao original.
Fica desligado (`null`) por padrão.

## Interface

- **Alt + X** abre/recolhe o painel (de qualquer programa).
- O painel mostra o status, o botão **Desativar** (quando ativo) ou **Ativar** (quando
  desativado) e o **histórico** em tabela, com as colunas Arquivo, Original, Otimizado e
  Economia (% de espaço liberado). Os mais recentes ficam no topo.
  - Passe o mouse sobre uma linha para ver o nome final (com hash) e a data/hora.
  - Economia em verde = arquivo menor; em vermelho = arquivo maior que o original.
  - **Limpar histórico** apaga só a lista, nunca os arquivos.
- O histórico é guardado em `%APPDATA%\otimizador-webp\history.json` (até `historyLimit` itens,
  200 por padrão) e sobrevive a reinicializações.
- Recolhido, o app fica como uma **flecha** na borda direita da tela (verde = ativo, cinza =
  desativado). Clique nela para abrir o painel.
- Ícone de flecha na bandeja do sistema, com menu: abrir/recolher, ativar/desativar, abrir a
  pasta das otimizadas e sair. Também há o link "Sair do app" no painel e a tecla Esc para recolher.

## Configuração

Tudo em `config.js`: modo de conversão, largura máxima, tamanho do hash, apagar ou manter o
original (`deleteOriginal`), pastas observadas, extensões aceitas e tamanho do histórico.

Para otimizar também os prints do Windows (Win + PrintScreen), adicione a pasta
`Imagens\Screenshots` em `watchDirs`.

## Observações

- Só imagens **novas** são processadas; o que já estava na pasta é ignorado. Arquivos que
  chegarem com o app desativado também não são processados depois.
- Arquivos temporários de download (`.crdownload`, `.part`, `.tmp`) são ignorados, e o app
  espera o arquivo terminar de ser escrito antes de converter.
- O atalho Alt + X é global: se outro programa já o usa, o app avisa pela bandeja e continua
  acessível pelo ícone. Dá para trocar em `config.js` (`hotkey`).
- Só uma instância roda por vez.
