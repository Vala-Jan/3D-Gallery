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
public/models/             – .glb soubory exponátů + thumbnails/
public/spustit-galerii.bat – spouštěč pro kiosek PC (kopíruje se do dist/)
public/server.ps1          – lokální server bez závislostí (kopíruje se do dist/)
src/exhibits.json          – seznam exponátů (název, popis, cesta k modelu…)
src/main.js                – logika galerie a 3D prohlížeče (Three.js)
src/style.css              – vzhled, přizpůsobeno velké dotykové obrazovce
index.html                 – vstupní stránka
```

## Přizpůsobení

- **Doba nečinnosti do návratu na přehled** – konstanta `IDLE_RESET_MS`
  na začátku `src/main.js` (v milisekundách, `120000` = 2 minuty; `0` vypne).
- **Barvy/vzhled** – `src/style.css`.
- **Text nápovědy dole na obrazovce** – `index.html`, element `#hint`.
