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

Přidání nového exponátu nevyžaduje žádné programování.

1. **Připravte 3D model ve formátu `.glb`** (binární glTF – jeden soubor,
   obsahuje geometrii, textury i materiály). Pokud máte model v jiném formátu
   (OBJ, FBX, STL, Blender…), převeďte ho zdarma a offline v
   [Blenderu](https://www.blender.org/): `File → Export → glTF 2.0 (.glb)`.
   - Doporučení: model do cca 20–50 MB, ať se na dotykovém PC rychle načítá.
   - Model nemusí být "vycentrovaný" ani v žádném konkrétním měřítku –
     kamera se na něj automaticky zaměří.

2. **Zkopírujte soubor** do složky `public/models/`, např.:
   ```
   public/models/vaza-antika.glb
   ```

3. *(Volitelně)* Přidejte náhledový obrázek (čtvercová fotka/render) do
   `public/models/thumbnails/`, např. `public/models/thumbnails/vaza-antika.jpg`.
   Pokud náhled nepřidáte, dlaždice zobrazí výchozí ikonu.

4. **Přidejte záznam** do souboru `src/exhibits.json` (je to obyčejný textový
   seznam, dá se upravit v Poznámkovém bloku):
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
   - Nezapomeňte na čárku mezi jednotlivými exponáty ve `[ ]` seznamu.

5. Uložte a znovu **vytvořte build** (viz krok 2 níže) – nebo pokud jen
   testujete na vývojovém počítači, spusťte `npm run dev` a změny se projeví
   ihned.

Dva ukázkové exponáty (kachnička, helma) slouží jen jako demo – v `src/exhibits.json`
je klidně smažte a nahraďte vlastními, soubory z `public/models/*-demo.glb`
pak můžete odstranit.

---

## 2. Sestavení aplikace (na počítači s internetem)

Toto se dělá **jednou** (a pak znovu jen když přidáte/změníte exponáty),
na jakémkoli počítači s Node.js a internetem – nemusí to být ten muzejní kiosek.

```bash
npm install     # jen poprvé – stáhne potřebné knihovny
npm run build   # vytvoří složku dist/ se vším potřebným
```

Složka `dist/` po sestavení obsahuje kompletní, samostatně funkční aplikaci
(HTML, JS, CSS i všechny `.glb` modely) – nic dalšího už není potřeba a
**nepotřebuje internet**. Tuto složku zkopírujte na USB flash disk.

---

## 3. Spuštění na muzejním PC bez internetu

Na kiosek PC přeneste složku `dist/` (např. z USB disku). Prohlížeč (Chrome/Edge)
neumí spolehlivě načítat 3D modely přímo z `file://`, proto je potřeba je
"servírovat" přes malý lokální webový server – ten ale běží jen na tom samém
počítači a internet k tomu není potřeba.

### Nejjednodušší varianta – Python (pokud je na PC nainstalovaný)

V `dist/` složce spusťte:

```bash
python -m http.server 8080
```

a v prohlížeči otevřete `http://localhost:8080`.

### Alternativa – Node.js (pokud jste zkopírovali celý projekt i s `node_modules`)

```bash
npm run preview
```

otevře server na `http://localhost:5000`.

### Nastavení kiosku (Windows, doporučeno)

1. Vytvořte zástupce/`.bat` soubor, který nejdřív spustí lokální server
   (viz výše) a poté prohlížeč v kiosk módu:
   ```bat
   start "" python -m http.server 8080 --directory "C:\galerie\dist"
   timeout /t 2
   start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --incognito --disable-pinch --overscroll-history-navigation=0 http://localhost:8080
   ```
2. Tento `.bat` soubor přidejte do složky **Po spuštění** (Startup), aby se
   kiosek sám spustil po zapnutí PC.
3. V nastavení Windows doporučujeme:
   - Vypnout spořič obrazovky a uspávání displeje.
   - Vypnout Windows dotyková gesta pro přepínání aplikací/hran obrazovky
     (Nastavení → Dotyk → Gesta), ať se návštěvník omylem nedostane pryč z appky.
   - Volitelně nastavit automatické přihlášení uživatele bez internetového
     připojení (appka žádné síťové připojení nepotřebuje).
4. Klávesová zkratka pro ukončení kiosk módu v Chromu je `Alt+F4`
   (pro personál, ne pro návštěvníky).

---

## 4. Vývoj / testování

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
public/models/            – .glb soubory exponátů + thumbnails/
src/exhibits.json         – seznam exponátů (název, popis, cesta k modelu…)
src/main.js               – logika galerie a 3D prohlížeče (Three.js)
src/style.css             – vzhled, přizpůsobeno velké dotykové obrazovce
index.html                – vstupní stránka
```

## Přizpůsobení

- **Doba nečinnosti do návratu na přehled** – konstanta `IDLE_RESET_MS`
  na začátku `src/main.js` (v milisekundách, `120000` = 2 minuty; `0` vypne).
- **Barvy/vzhled** – `src/style.css`.
- **Text nápovědy dole na obrazovce** – `index.html`, element `#hint`.
