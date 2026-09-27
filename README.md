# 3D Galerie exponátů

> **Vibe Coding Project** — This project was developed using AI-assisted coding.

Desktopová appka pro dotykovou obrazovku v muzeu. Návštěvníci klepnutím
otevřou 3D model exponátu a prstem si ho otočí, přiblíží a prohlédnou ze
všech stran. Běží celá **offline** — kiosek PC nepotřebuje internet.

## Co appka umí

- **Galerie** – mřížka dlaždic, jedna pro každý exponát. Název dlaždice
  = název souboru, žádné nastavování.
- **3D prohlížeč** – prst otáčí, dva prsty přibližují/oddalují a posouvají.
- **4 režimy osvětlení** (vlevo dole) – zvýrazní různé detaily exponátu.
- **Volitelný info panel** (tlačítko **i** vpravo nahoře) – cedulka s
  popisky jako u skutečného exponátu (Název, Datace, Materiál...).
- Po chvíli nečinnosti se appka sama vrátí na přehled, připravená na
  dalšího návštěvníka.

---

## ➕ Jak přidat exponát

Žádné programování. Vše se odehrává v jedné složce `modely` vedle appky.

1. Zkopírujte do ní svůj `.glb` model. Název souboru = název dlaždice
   v galerii (např. `Antická váza.glb` → dlaždice "Antická váza").
2. *(Volitelně)* Náhledový obrázek a info panel přidáte úplně stejně —
   soubor se **stejným názvem**, jinou příponou:

   ```
   modely/
     Antická váza.glb
     Antická váza.jpg     <- náhled na dlaždici (.jpg/.jpeg/.png/.webp)
     Antická váza.json    <- info panel (viz níže)
   ```

3. Restartujte appku (nebo počkejte na návrat na přehled) — nový exponát
   se objeví automaticky. Smazání `.glb` souboru exponát zase odebere.

**Obsah `Antická váza.json`** — libovolná pole `"popisek": "hodnota"`,
appka je vypíše přesně v tomto pořadí:

```json
{
  "Název": "Antická váza",
  "Popis": "Řecká amfora, 5. století př. n. l.",
  "Datace": "5. století př. n. l.",
  "Materiál": "Pálená hlína"
}
```

Přidejte klidně vlastní pole (Autor, Původ...). Bez `.json` souboru appka
tlačítko **i** vůbec nezobrazí. Každý exponát má info ve **svém vlastním**
souboru — překlep v jednom nikdy nerozbije zbytek galerie.

> Model v jiném formátu než `.glb` (OBJ, FBX, STL...)? Zdarma a offline ho
> převedete v [Blenderu](https://www.blender.org/):
> `File → Export → glTF 2.0 (.glb)`. Doporučená velikost do 20–50 MB.

---

## 🛠️ Sestavení a nasazení na kiosek

Appku je potřeba jednou **sestavit** na počítači s internetem (nemusí to
být kiosek PC) — znovu jen když se mění kód appky, ne při běžném přidávání
exponátů.

<details>
<summary><strong>Krok za krokem (Windows) — klikněte pro rozbalení</strong></summary>

1. **Stáhněte kód** — `https://github.com/Vala-Jan/3D-Gallery` → přepněte
   větev na `claude/interactive-3d-model-repository-a8cyes` → **Code** →
   **Download ZIP** → rozbalte.
2. **Nainstalujte Node.js** (pokud ho nemáte) — `https://nodejs.org` →
   verze **LTS** → jen proklikat Next → Install → Finish.
3. **Otevřete příkazový řádek ve složce** — v Průzkumníkovi otevřete
   rozbalenou složku, klikněte do adresního řádku, napište `cmd`, Enter.
4. **Spusťte dva příkazy** (počkejte na dokončení každého, potřeba internet):
   ```bash
   npm install
   npm run package:win
   ```
   Druhý příkaz stahuje Electron/Chromium engine, může trvat 5–10 minut.
   Na konci uvidíte `Wrote new app to: release\3D Galerie-win32-x64`.
5. **Přeneste na kiosek** — celou složku `release\3D Galerie-win32-x64\`
   (~300–350 MB) zkopírujte přes USB na kiosek PC, např. do `C:\galerie\`.
   Nic se neinstaluje. Appka si při prvním spuštění sama vytvoří vedle
   `.exe` složku `modely` s ukázkovými modely.
6. **Spusťte** `3D Galerie.exe` — appka naskočí na celou obrazovku. Pokud
   se objeví SmartScreen ("Windows chránil váš počítač"), klikněte
   **Další informace → Přesto spustit** (appka nemá placený podpis).
7. *(Volitelně)* **Automatické spuštění po startu PC** — `Win+R` →
   `shell:startup` → Enter → vložte zástupce (pravé tlačítko → Nový →
   Zástupce) směřující na `3D Galerie.exe`.

**Ukončení appky** (pro personál): `Ctrl+Shift+Q`.

</details>

---

<details>
<summary><strong>🔧 Pro vývojáře</strong></summary>

### Vývoj / testování

```bash
npm install
npm run electron
```

Sestaví appku a rovnou spustí v Electronu na tomto počítači, bez balení
do `.exe` — pro rychlé ověřování změn v kódu.

### Struktura projektu

```
electron/main.cjs        – Electron proces: vestavěný server + okno appky
electron/demo-models/    – ukázkové .glb modely nasazené při prvním spuštění
public/fonts/            – lokálně nabalené fonty (appka funguje bez internetu)
src/main.js              – logika galerie a 3D prohlížeče (Three.js)
src/style.css            – vzhled appky
index.html               – vstupní stránka
```

Za běhu appka navíc pracuje se složkou `modely` vedle `.exe` (u zabalené
appky) nebo `modely-dev` v kořeni projektu (`npm run electron`) — tyto
složky NEJSOU součástí zdrojového kódu, appka si je sama vytváří.

### Přizpůsobení

- **Doba nečinnosti do návratu na přehled** – konstanta `IDLE_RESET_MS`
  na začátku `src/main.js` (ms; `120000` = 2 minuty, `0` vypne).
- **Osvětlení** (intenzity jednotlivých režimů) – `LIGHT_PRESETS` v `src/main.js`.
- **Barvy/vzhled** – `src/style.css`.
- **Text nápovědy dole na obrazovce** – `index.html`, element `#hint`.

</details>
