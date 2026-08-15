# 3D Galerie exponátů

Desktopová appka pro dotykovou obrazovku (TV/monitor) v muzeu, bez připojení
k internetu. Návštěvníci si z přehledu vyberou exponát a prstem si s jeho
3D modelem mohou volně otáčet, přibližovat a oddalovat.

Appka je postavená na [Electronu](https://www.electronjs.org/) – po spuštění
`.exe` se otevře rovnou na celou obrazovku jako normální program, žádný
prohlížeč, žádný PowerShell.

Postaveno na [Three.js](https://threejs.org/) a formátu **glTF/GLB**.

## Jak to funguje

- Úvodní obrazovka je mřížka dlaždic – jedna pro každý `.glb` soubor ve
  složce `modely` vedle appky. **Název dlaždice = název souboru** (bez
  přípony) – appka žádné popisky, autory ani jiné metadata nepotřebuje.
- Klepnutím na dlaždici se otevře 3D model. Prst otáčí, dva prsty
  přibližují/oddalují (funguje i myší).
- Tlačítka v prohlížeči: **←** zpět na přehled, **⟳** reset pohledu.
- Po 2 minutách nečinnosti se appka sama vrátí na přehled, aby byla
  připravená pro dalšího návštěvníka (jde změnit, viz "Přizpůsobení").

---

## 1. Jak přidat nebo odebrat exponát

Žádné programování, žádný soubor k úpravě – jen kopírování:

1. Najděte složku `modely` – leží přímo vedle `3D Galerie.exe` (ne uvnitř
   žádné jiné podsložky).
2. Zkopírujte tam svůj `.glb` soubor. Pojmenujte ho přesně tak, jak se má
   zobrazit v galerii, např. `Antická váza.glb` → v appce se objeví dlaždice
   "Antická váza".
3. Appku zavřete a znovu spusťte (nebo počkejte na návrat na přehled) – nový
   exponát se objeví automaticky. Žádný JSON, žádný seznam.
4. Odebrání exponátu: smažte příslušný `.glb` soubor ze složky `modely`.

### Náhledový obrázek na dlaždici

Bez obrázku appka na dlaždici ukáže jednoduchou ikonku krychle. Pokud chcete
vlastní náhled (foto/render exponátu), stačí do stejné složky `modely`
přidat obrázek se **stejným názvem** jako model, jen s obrázkovou příponou:

```
modely/
  Antická váza.glb
  Antická váza.jpg      <- náhled pro tento model
```

Podporované přípony náhledu: `.jpg`, `.jpeg`, `.png`, `.webp`.

Pokud nemáte model ve formátu `.glb`, ale máte ho v jiném formátu (OBJ, FBX,
STL, Blender…), převeďte ho zdarma a offline v
[Blenderu](https://www.blender.org/): `File → Export → glTF 2.0 (.glb)`,
jako typ exportu zvolte **glTF Binary (.glb)**.

Doporučení: model do cca 20–50 MB, ať se na dotykovém PC rychle načítá.
Model nemusí být "vycentrovaný" ani v žádném konkrétním měřítku – kamera
se na něj automaticky zaměří.

Když je složka `modely` prázdná, appka na úvodní obrazovce sama napíše
přesnou cestu, kam soubory vložit.

---

## 2. Sestavení appky (na počítači s internetem)

Tohle se dělá jen jednou (znovu jen když se mění samotný kód appky, ne při
běžném přidávání exponátů – to zvládne krok 1 bez sestavování).
Potřebujete počítač s internetem (nemusí to být kiosek PC).

### Krok za krokem (Windows)

**1. Stáhněte zdrojové kódy appky**

- Otevřete `https://github.com/Goat04/Festival-V-dy`.
- Přepněte větev z `main` na `claude/interactive-3d-model-repository-a8cyes`.
- **Code** → **Download ZIP**, a stažený ZIP rozbalte.

**2. Nainstalujte Node.js** (pokud ho na tomto PC ještě nemáte)

- `https://nodejs.org` → stáhněte verzi **LTS** → spusťte instalátor →
  jen klikejte Next → Install → Finish.

**3. Otevřete příkazový řádek přímo v rozbalené složce**

- V Průzkumníkovi otevřete rozbalenou složku (vidíte v ní `src`, `public`,
  `electron`…).
- Klikněte do adresního řádku nahoře, napište `cmd`, Enter – otevře se
  černé okno rovnou v této složce.

**4. Zadejte tyto dva příkazy** (každý potvrďte Enterem):

```bash
npm install
```
Počkejte, až doběhne (pár minut, potřeba internet). Pak:

```bash
npm run package:win
```
Může trvat 5–10 minut (stahuje se Electron/Chromium engine, cca 100+ MB) –
potřeba internet po celou dobu. Na konci by mělo být
`Wrote new app to: release\3D Galerie-win32-x64`.

**5. Výsledek**

V projektu přibyla složka `release\3D Galerie-win32-x64\` – kompletní
appka (cca 300–350 MB, Electron v sobě nese celý prohlížečový engine).
Appka si při prvním spuštění sama vytvoří vedle `.exe` složku `modely` a
nasype do ní dva ukázkové modely, ať je hned vidět, že appka funguje.

**6. Přeneste na kiosek PC**

Celou složku `3D Galerie-win32-x64` zkopírujte na USB disk (~500 MB volného
místa) a na kiosek PC ji zkopírujte např. do `C:\galerie\`. Nic se
instalovat nemusí.

**7. Spusťte**

Dvojklik na `3D Galerie.exe` – appka se otevře na celou obrazovku. Pokud se
objeví modré okno "Windows chránil váš počítač" (SmartScreen), klikněte na
**Další informace** → **Přesto spustit** (appka nemá placený digitální
podpis, nic víc to neznamená).

Ukončení (pro personál, ne pro návštěvníky): `Ctrl+Shift+Q`.

**8.** *(Volitelně)* Automatické spuštění po zapnutí PC: `Win + R` →
`shell:startup` → Enter → do otevřené složky vložte zástupce (pravé
tlačítko → Nový → Zástupce) směřující na `3D Galerie.exe`.

---

## 3. Vývoj / testování appky

```bash
npm install
npm run electron
```

Sestaví appku a rovnou spustí v Electronu na tomto počítači – bez balení
do `.exe`, vhodné pro rychlé ověřování změn v kódu.

---

## Struktura projektu

```
electron/main.cjs        – Electron proces: vestavěný server + okno appky
electron/demo-models/    – ukázkové .glb modely nasazené při prvním spuštění
src/main.js              – logika galerie a 3D prohlížeče (Three.js)
src/style.css            – vzhled, přizpůsobeno velké dotykové obrazovce
index.html                – vstupní stránka
```

Za běhu appka navíc pracuje se složkou `modely` vedle `.exe` (u zabalené
appky) nebo `modely-dev` v kořeni projektu (při `npm run electron`) – to
NEJSOU součástí zdrojového kódu, appka si je sama vytváří.

## Přizpůsobení

- **Doba nečinnosti do návratu na přehled** – konstanta `IDLE_RESET_MS`
  na začátku `src/main.js` (v milisekundách, `120000` = 2 minuty; `0` vypne).
- **Barvy/vzhled** – `src/style.css`.
- **Text nápovědy dole na obrazovce** – `index.html`, element `#hint`.
