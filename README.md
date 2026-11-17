# Otimizador WebP

App em Electron (Node.js) que roda em segundo plano, observa a pasta **Downloads** e converte
cada imagem nova para **WebP otimizado**, salvando em `Downloads\Otimizadas` com um **hash no
início do nome**:

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

## Interface

- **Alt + X** abre/recolhe o painel (de qualquer programa).
- O painel mostra o status, o contador de imagens otimizadas e o botão **Desativar** (quando
  ativo) ou **Ativar** (quando desativado).
- Recolhido, o app fica como uma **flecha** na borda direita da tela (verde = ativo, cinza =
  desativado). Clique nela para abrir o painel.
- Ícone de flecha na bandeja do sistema, com menu: abrir/recolher, ativar/desativar, abrir a
  pasta das otimizadas e sair. Também há o link "Sair do app" no painel e a tecla Esc para recolher.

## Configuração

Tudo em `config.js`: qualidade do WebP, largura máxima, tamanho do hash, apagar ou manter o
original (`deleteOriginal`), pastas observadas e extensões aceitas.

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
