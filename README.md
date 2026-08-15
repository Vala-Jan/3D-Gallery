# 3D Galerie exponátů

Interaktivní webová aplikace pro dotykovou obrazovku (TV/monitor) v muzeu.
Návštěvníci si z přehledu vyberou exponát a prstem si s jeho 3D modelem
mohou volně otáčet, přibližovat a oddalovat. Aplikace **neběží přes
internet** – jde o statické soubory, které stačí jednou vytvořit a pak
je spouštět offline z lokálního PC.

Postaveno na [Three.js](https://threejs.org/) a formátu **glTF/GLB**.

## Jak to funguje

- `gallery-screen` – úvodní mřížka se všemi exponáty (dlaždice s náhledem a názvem).
- `viewer-screen` – po dotyku na dlaždici se zobrazí 3D model. Prstem se otáčí,
  dvěma prsty se přibližuje/oddaluje (funguje i myší na běžném PC).
- Tlačítka: **←** zpět na přehled, **i** informace o exponátu, **⟳** reset pohledu.
- Po `120` sekundách nečinnosti se prohlížeč modelu sám vrátí na přehled,
  aby byl kiosek připravený pro dalšího návštěvníka (dá se změnit, viz níže).

---

## 1. Jak přidat nový exponát

Přidání nového exponátu nevyžaduje žádné programování ani nový build –
`exhibits.json` se v appce načítá za běhu, takže stačí upravit soubory
**přímo ve složce `dist`** (tam, kde je `index.html`), uložit a v prohlížeči
dát znovu načíst stránku (F5, nebo zavřít a znovu spustit `spustit-galerii.bat`).

1. **Připravte 3D model ve formátu `.glb`** (binární glTF – jeden soubor,
   obsahuje geometrii, textury i materiály). Pokud máte model v jiném formátu
   (OBJ, FBX, STL, Blender…), převeďte ho zdarma a offline v
   [Blenderu](https://www.blender.org/): `File → Export → glTF 2.0 (.glb)`.
   - Doporučení: model do cca 20–50 MB, ať se na dotykovém PC rychle načítá.
   - Model nemusí být "vycentrovaný" ani v žádném konkrétním měřítku –
     kamera se na něj automaticky zaměří.

2. **Zkopírujte soubor** do složky `dist/models/`, např.:
   ```
   dist/models/vaza-antika.glb
   ```

3. *(Volitelně)* Přidejte náhledový obrázek (čtvercová fotka/render) do
   `dist/models/thumbnails/`, např. `dist/models/thumbnails/vaza-antika.jpg`.
   Pokud náhled nepřidáte, dlaždice zobrazí výchozí ikonu.

4. **Otevřete `dist/exhibits.json` v Poznámkovém bloku** (je to obyčejný
   textový seznam) a přidejte nový záznam – nezapomeňte na čárku za
   předchozí `}` uzávorkou, aby seznam zůstal platný:
   ```json
   {
     "id": "vaza-antika",
     "name": "Antická váza",
     "period": "5. století př. n. l.",
     "author": "Neznámý autor",
     "material": "Pálená hlína",
     "description": "Delší popisek exponátu, který se zobrazí v info panelu.",
     "model": "models/vaza-antika.glb",
     "thumbnail": "models/thumbnails/vaza-antika.jpg",
     "cameraDistance": 3
   }
   ```
   - `id` – jedinečný text bez diakritiky a mezer.
   - `thumbnail` – nepovinné, jinak smažte celý řádek nebo nechte `""`.
   - `cameraDistance` – nepovinné, jak daleko od modelu má start kamera
     (pokud chybí, spočítá se automaticky z velikosti modelu).
   - Uložte soubor **stejným názvem** `exhibits.json` (Poznámkový blok při
     "Uložit jako" nabízí přidat `.txt` navíc – zkontrolujte, že k tomu nedošlo).

5. Obnovte stránku v prohlížeči (F5) – nový exponát by se měl hned objevit
   v přehledu. Rebuild (krok 2 níže) je potřeba jen když měníte samotný kód
   appky (`src/`), ne při běžném přidávání/úpravě exponátů.

Dva ukázkové exponáty (kachnička, helma) slouží jen jako demo – v `exhibits.json`
je klidně smažte a nahraďte vlastními, soubory `models/*-demo.glb`
pak můžete odstranit.

> **Pozor na formát JSON:** chybějící nebo přebytečná čárka celý seznam
> "rozbije" a galerie se nenačte vůbec (zobrazí se chybová hláška). Pokud
> se po úpravě přehled nezobrazí, zkontrolujte čárky mezi `{ … }` bloky a
> že hranaté závorky `[` a `]` na začátku/konci souboru zůstaly netknuté.

---

## 2. Sestavení aplikace (na počítači s internetem)

Toto se dělá **jednou** (a pak znovu jen když přidáte/změníte exponáty),
na jakémkoli počítači s Node.js a internetem – nemusí to být ten muzejní kiosek.
Pokud nemáte Node.js ani netušíte, co to je: pošlete mi upravené soubory
(nebo popis změny) a hotovou složku `dist/` vám připravím a pošlu ke stažení.

```bash
npm install     # jen poprvé – stáhne potřebné knihovny
npm run build   # vytvoří složku dist/ se vším potřebným
```

Složka `dist/` po sestavení obsahuje kompletní, samostatně funkční aplikaci
(HTML, JS, CSS, všechny `.glb` modely a spouštěcí skripty) – nic dalšího
už není potřeba a **nepotřebuje internet**. Tuto složku zkopírujte na USB flash disk.

---

## 3. Spuštění na muzejním PC bez internetu

**Důležité:** dvojklik přímo na `index.html` nebude fungovat – prohlížeč
z bezpečnostních důvodů zablokuje načítání 3D modelů, pokud stránku otevřete
takhle napřímo (soubory musí být "servírované" přes lokální webový server,
i když jde jen o localhost bez internetu).

Proto je ve složce `dist/` přichystaný soubor **`spustit-galerii.bat`**,
který vše zařídí sám – nepotřebuje Python, Node.js ani žádnou instalaci,
jen samotný Windows.

### Postup (Windows)

1. Zkopírujte celou složku `dist/` na kiosek PC, např. do `C:\galerie\`.
2. Ve složce dvakrát klikněte na **`spustit-galerii.bat`**.
   - Otevře se malé (zmenšené) černé okno – to je lokální server, **nezavírejte
     ho**, dokud má být galerie spuštěná. Zavřením tohoto okna se appka vypne.
   - Zároveň se automaticky otevře prohlížeč (Chrome nebo Edge, cokoliv je
     na PC nainstalované) na celou obrazovku s galerií.
3. Pokud se objeví žluté/modré okno Windows s dotazem na "síťovou bránu
   firewall" u PowerShellu, klikněte na **Povolit přístup** – jde jen o
   komunikaci na `localhost` (v rámci téhož PC), nikam ven na internet.

### Automatické spuštění po zapnutí PC

1. Stiskněte `Win + R`, napište `shell:startup` a potvrďte – otevře se
   složka **Po spuštění**.
2. Vytvořte v ní zástupce (pravé tlačítko myši → Nový → Zástupce) směřující
   na `C:\galerie\spustit-galerii.bat`.
3. Po dalším zapnutí PC se galerie spustí sama.

### Doporučené nastavení Windows pro kiosek

- Vypněte spořič obrazovky a uspávání displeje (Nastavení → Systém → Napájení).
- Vypněte Windows dotyková gesta pro přepínání aplikací/tažení od okraje
  obrazovky (Nastavení → Dotyk/Bluetooth a zařízení → Dotyk), ať se návštěvník
  omylem nedostane z appky pryč.
- Volitelně nastavte automatické přihlášení uživatele (appka žádné
  internetové připojení nepotřebuje, i login účtu může být lokální).

Ukončení kiosk módu (pro personál, ne pro návštěvníky): `Alt+F4`.

### Jiný operační systém (macOS/Linux)

`spustit-galerii.bat` je jen pro Windows. Na macOS/Linuxu spusťte ve složce
`dist/` v terminálu `python3 -m http.server 8080` (Python bývá součástí
systému) a otevřete `http://localhost:8080` v prohlížeči na celou obrazovku.

---

## 4. Volitelné: samostatná .exe aplikace (Electron)

Appka jde sestavit i jako opravdová desktopová aplikace (přes
[Electron](https://www.electronjs.org/)) – po spuštění `.exe` se rovnou
otevře na celou obrazovku, bez viditelného okna prohlížeče nebo serveru,
bez PowerShellu a bez SmartScreen varování kvůli `.bat`/`.ps1` skriptům.

Toto je čistě volitelné – webová verze z kroků 1–3 funguje sama o sobě.
Sestavení potřebuje počítač s internetem (nemusí to být kiosek PC – klidně
domácí notebook, na chvíli půjčený PC apod.). Postup je jednorázový a
nevyžaduje žádné programátorské zkušenosti.

### Krok za krokem (Windows)

**1. Stáhněte zdrojové kódy appky**

- Otevřete v prohlížeči: `https://github.com/Goat04/Festival-V-dy`
- Nahoře přepněte větev z `main` na `claude/interactive-3d-model-repository-a8cyes`
  (rozbalovací nabídka s názvem větve, cca uprostřed stránky).
- Klikněte na zelené tlačítko **Code** → **Download ZIP**.
- Stažený ZIP rozbalte (pravé tlačítko → Extrahovat vše) na libovolné
  místo, např. na plochu.

**2. Nainstalujte Node.js** (pokud ho na tomto PC ještě nemáte)

- Otevřete `https://nodejs.org`.
- Stáhněte verzi označenou **LTS** a spusťte instalátor.
- Klikejte **Next** → **Next** → … → **Install** → **Finish**. Není potřeba
  nic zaškrtávat ani měnit, výchozí nastavení stačí.

**3. Otevřete příkazový řádek přímo v rozbalené složce**

- V Průzkumníkovi souborů otevřete rozbalenou složku (`Festival-V-dy-...`),
  tam kde uvnitř vidíte složky `src`, `public`, `electron` apod.
- Klikněte myší do adresního řádku nahoře (kde je cesta ke složce), smažte
  co je tam napsané, napište `cmd` a stiskněte **Enter**.
- Otevře se černé okno (Příkazový řádek) rovnou v této složce.

**4. Zadejte tyto dva příkazy** (do černého okna, každý potvrďte klávesou Enter):

```bash
npm install
```
Počkejte, až doběhne (může to trvat pár minut, stahují se potřebné součásti
– je potřeba internet). Pak:

```bash
npm run package:win
```
Tohle může trvat déle (klidně 5–10 minut) a stáhne se při tom větší balík
dat (samotný Electron/Chromium engine, cca 100+ MB) – je potřeba mít
internet po celou dobu. Na konci by mělo být napsáno něco jako
`Wrote new app to: release\3D Galerie-win32-x64`.

**5. Najděte výsledek**

V rozbalené složce projektu přibyla nová podsložka `release`, a v ní
`3D Galerie-win32-x64` – to je celá hotová aplikace (cca 300–350 MB,
Electron v sobě nese celý prohlížečový engine, proto ta velikost).

**6. Přidejte složku s exponáty**

Uvnitř `release\3D Galerie-win32-x64\` vytvořte novou složku `exponaty`,
a v ní složku `models`. Zkopírujte do nich (z původní stažené složky
projektu):
- `public\exhibits.json` → `release\3D Galerie-win32-x64\exponaty\exhibits.json`
- vše z `public\models\` → `release\3D Galerie-win32-x64\exponaty\models\`

Výsledná struktura:
```
3D Galerie-win32-x64\
  3D Galerie.exe
  exponaty\
    exhibits.json
    models\
      kachna-demo.glb
      helma-demo.glb
      ...
```

**7. Přeneste na kiosek PC**

Celou složku `3D Galerie-win32-x64` zkopírujte na USB disk (potřebuje
alespoň cca 500 MB volného místa) a na kiosek PC ji zkopírujte např. do
`C:\galerie\`. Nic se tam instalovat nemusí.

**8. Spusťte**

Dvojklik na `3D Galerie.exe` uvnitř – appka se otevře rovnou na celou
obrazovku (kiosk mód), bez viditelného okna prohlížeče či serveru.
Pokud se objeví modré okno "Windows chránil váš počítač" (SmartScreen),
klikněte na **Další informace** → **Přesto spustit** (appka nemá
placený digitální podpis, to je vše).

Ukončení (pro personál, ne pro návštěvníky): `Ctrl+Shift+Q`.

**9.** *(Volitelně)* Automatické spuštění po zapnutí PC: `Win + R` →
napište `shell:startup` → Enter → do otevřené složky vložte zástupce
(pravé tlačítko → Nový → Zástupce) směřující na `3D Galerie.exe`.

Přidávání exponátů funguje stejně jako u webové verze (úprava
`exponaty/exhibits.json` v Poznámkovém bloku + kopírování `.glb` do
`exponaty/models/`), jen appku po úpravě restartujte (zavřít a znovu
spustit `.exe`) – změny se načtou.

---

## 5. Vývoj / testování

```bash
npm install
npm run dev
```

Spustí se vývojový server (typicky `http://localhost:5000`), který se
automaticky obnovuje při každé úpravě souborů – vhodné pro ladění na
notebooku před nasazením na kiosek.

---

## Struktura projektu

```
public/models/             – .glb soubory exponátů + thumbnails/
public/exhibits.json       – seznam exponátů (kopíruje se do dist/, načítá se za běhu)
public/spustit-galerii.bat – spouštěč pro kiosek PC (kopíruje se do dist/)
public/server.ps1          – lokální server bez závislostí (kopíruje se do dist/)
src/main.js                – logika galerie a 3D prohlížeče (Three.js)
src/style.css              – vzhled, přizpůsobeno velké dotykové obrazovce
index.html                 – vstupní stránka
electron/main.cjs          – volitelný Electron obal (viz krok 4, .exe verze)
```

## Přizpůsobení

- **Doba nečinnosti do návratu na přehled** – konstanta `IDLE_RESET_MS`
  na začátku `src/main.js` (v milisekundách, `120000` = 2 minuty; `0` vypne).
- **Barvy/vzhled** – `src/style.css`.
- **Text nápovědy dole na obrazovce** – `index.html`, element `#hint`.
