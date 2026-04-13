# UMPRUM Type — Font Reference & Content Guide

## Как добавить шрифт

### 1. Файл шрифта → public/fonts/

Формат имени: `НазваниеШрифта-Начертание.woff2`

Примеры:
```
public/fonts/Ananas-Regular.woff2
public/fonts/Ananas-Italic.woff2
public/fonts/Korchma-Regular.woff2
public/fonts/Korchma-Italic.woff2
public/fonts/MarzGrotesk-Bold.woff2
public/fonts/BROT-Regular.woff2
public/fonts/Aft-Regular.woff2
public/fonts/Asystematik-Regular.woff2
public/fonts/Benzsch-Regular.woff2
public/fonts/BlockAntiqua-Medium.woff2
public/fonts/BurnoutScript-Regular.woff2
public/fonts/Centavra-Regular.woff2
public/fonts/EckenStil-Regular.woff2
public/fonts/Frot-Regular.woff2
public/fonts/Eclipse-Regular.woff2
public/fonts/EmpeSans-Regular.woff2
public/fonts/EmpeSans-Italic.woff2
public/fonts/Ciment-Regular.woff2
public/fonts/Chlebiczech-Regular.woff2
```

Если шрифт в .otf или .ttf — конвертируй в .woff2:
- Онлайн: https://cloudconvert.com/otf-to-woff2
- Или: `npm install -g woff2` → `woff2_compress Font.ttf`

### 2. Markdown файл → src/content/typefaces/

Одно имя файла = slug в URL. Имя файла = lowercase, дефисы вместо пробелов.

```
src/content/typefaces/ananas.md        → /typefaces/ananas
src/content/typefaces/marz-grotesk.md  → /typefaces/marz-grotesk
src/content/typefaces/b-rot.md         → /typefaces/b-rot
src/content/typefaces/ecken-stil.md    → /typefaces/ecken-stil
```

### 3. Frontmatter поля

Обязательные: name, author, year, description, classification, mode
Опциональные: всё остальное

mode определяет КАК показывается specimen:
- "text" → длинный текст, колонки при мелком кегле (для book/text шрифтов)
- "display" → крупный заголовок (для display/headline шрифтов)
- "mono" → код (для monospace)
- "script" → рукописный стиль, средний кегль

---

## ВСЕ ШРИФТЫ — готовые markdown файлы

Ниже полные файлы. Копируй каждый в `src/content/typefaces/`.
Specimen-тексты взяты с оригинального сайта — каждый шрифт показывает
именно тот текст на котором отточены его глифы.

---

### ananas.md

```markdown
---
name: "Ananas"
author: "Jaromír Květoň"
authorUrl: "https://www.jaromirkveton.com"
authorEmail: "hello@jaromirkveton.com"
year: 2025
description: "Ananas began as an idea to create a serif counterpart to a grotesque typeface. It reimagines sans-serif principles through the lens of classic Renaissance typefaces without aiming for historical revival. Instead, it explores their contemporary interpretation by merging traditional approaches with a constructed primitivism. Its simplified, dynamic forms are designed to be both distinctive and highly functional, offering strong readability across various sizes and long texts."
mode: "text"
classification: "serif"
scripts: ["latin", "czech"]
fonts:
  - variant: "Regular"
    file: "/fonts/Ananas-Regular.woff2"
    style: normal
    weight: 400
  - variant: "Italic"
    file: "/fonts/Ananas-Italic.woff2"
    style: italic
    weight: 400
specimens:
  cs: "Imituje žhavý pohled, vítězně, jako kdyby vynalezla nějakou novou neřest. A tamhle zastavuje vůz. Jaký nádherný landauer! Podívejme se! Manželka milionáře Kostertsche v něm sedí a holými prsty pojídá ze své pompadúrky studenou čočku. V rozpacích na ni volá dcera, která jde právě kolem: „Ale mamá, copak to jíš?!" Jenže na starou dámu to neplatí. Nu, a kdopak je tohle? — Že by se už vrátil z Vídně? — Ach, namoutě: Přijel hejtman Aaron Gedalje Hehler od 202. pěšího regimentu. — Samozřejmě z písařského oddělení. Kdo by ho neznal! Váha pětačtyřicet kilo, balmachome v lehké váze par excellence."
  en: "She imitates a fiery gaze, triumphantly, as if she had invented some new vice. And there a carriage stops. What a beautiful landau! Let's take a look! The wife of the millionaire Kostertsche is sitting in it, eating cold lentils from her pompadour with her bare fingers. Her daughter, who is just passing by, calls out to her in embarrassment: 'But Mama, what are you eating?!' But that doesn't work on the old lady. Well, who's this? — Could he be back from Vienna already? — Oh, my goodness: it's Captain Aaron Gedalje Hehler from the 202nd Infantry Regiment. — From the clerical department, of course. Who wouldn't know him! Weighing forty-five kilos, he is a lightweight par excellence."
tagline: "Nonpareille focus; 47:2–1"
tags: ["serif", "text", "renaissance"]
featured: true
order: 1
purchasable: false
---
```

### chlebiczech.md

```markdown
---
name: "Chlebiczech"
author: "Žofia Kosová"
authorInstagram: "@zofkakosova"
authorEmail: "kosovazofia@gmail.com"
year: 2025
description: ""
mode: "text"
classification: "display"
scripts: ["latin", "czech"]
fonts:
  - variant: "Regular"
    file: "/fonts/Chlebiczech-Regular.woff2"
    style: normal
    weight: 400
specimens:
  cs: "Jeho jméno jsem zapomněl, prý provádí nárazové obchody, říká se. Asi to znamená, že obchoduje se vším, na co narazí. Malá očka, tenký varhánkovitý krk a ohromný kondoří zoban — hrůza na něho pohledět; ví bůh, že by se nikdo nepodivil, kdyby zčistajasna sáhl do brašny, vytáhl hromadu střev a s chraplavým supím křikem je polykal. A teď najednou všecko povstává a přeuctivě zdraví!? Právě vystoupil důstojně vypadající pán, v knoflíkové dírce malou stužku, a blahosklonně děkuje na všechny strany. Dříve býval důstojníkem. Teď je falešným svědkem z povolání. Proto ta všeobecná oblíbenost."
tagline: "Hostina!"
tags: ["display", "czech"]
featured: false
order: 2
purchasable: false
---
```

### korchma.md

```markdown
---
name: "Korchma"
author: "Anna Sherlupenkova"
authorInstagram: "@cawcacke"
authorEmail: "sherlupenkova@gmail.com"
year: 2025
description: "Korchma was inspired by Renaissance type and designed with simplicity in mind. Since it's a book typeface where readability is key, rather than adding standout features, I focused on refining proportions, spacing, and rhythm to ensure clarity and comfort in long texts. Korchma doesn't try to stand out, it's simple, neutral and quiet, what I believe makes it stronger. It avoids distraction, letting content take the lead while still offering a quiet elegance rooted in historical forms."
mode: "text"
classification: "serif"
scripts: ["latin", "cyrillic"]
fonts:
  - variant: "Regular"
    file: "/fonts/Korchma-Regular.woff2"
    style: normal
    weight: 400
  - variant: "Italic"
    file: "/fonts/Korchma-Italic.woff2"
    style: italic
    weight: 400
specimens:
  uk: "Вона імітує запальний погляд, тріумфально, ніби винайшла якийсь новий порок. І тут зупиняється карета. Яка прекрасна ландо! Давайте подивимося! Але це не діє на стару даму. Ну, а хто це? — Може, він уже повернувся з Відня? — О, Боже мій: це капітан Аарон Гедальє Гелер із 202-го піхотного полку. — З адміністративного відділу, звичайно. Хто його не знає! Важить сорок п'ять кілограмів, він — легковаговик par excellence."
  en: "She imitates a fiery gaze, triumphantly, as if she had invented some new vice. And there a carriage stops. What a beautiful landau! Let's take a look! The wife of the millionaire Kostertsche is sitting in it, eating cold lentils from her pompadour with her bare fingers. Her daughter, who is just passing by, calls out to her in embarrassment: 'But Mama, what are you eating?!' But that doesn't work on the old lady."
tags: ["serif", "text", "book"]
featured: false
order: 3
purchasable: false
---
```

### marz-grotesk.md

```markdown
---
name: "März Grotesk"
author: "Šimon Vlasák"
authorInstagram: "@simonvlasaak"
authorEmail: "simon.vlasakk@gmail.com"
year: 2025
description: "Märzdorf graveyard left behind one hidden gem — the gravestone of Amalie Schmidt, born in 1867. The width of the characters and the proportions of letters like e and s caught my eye and inspired me to capture this wide grotesk style. What began as a headline typeface surprisingly turned out to work well even in smaller sizes and longer texts. For such a long time, I wanted wide bold grotesk of my own to use."
mode: "display"
classification: "sans"
scripts: ["latin", "czech"]
fonts:
  - variant: "Bold"
    file: "/fonts/MarzGrotesk-Bold.woff2"
    style: normal
    weight: 700
specimens:
  cs: "Ale kdo si přesto postaví hlavu, může docela dobře dojít z Železné Rudy pěšky. Božínku, vždyť ty cesty přece nejsou tak špatné. Ostatně ať se stará každý sám, když už se jednou rozhodne podívat se do Prahy."
  en: "During the Thirty Years' War, the Swedes wanted to use it to penetrate from Malá Strana into the city, but in the end they were afraid. Prague is supposedly divided into several parts, but that is just an empty promise."
tags: ["sans", "grotesk", "wide"]
featured: true
order: 4
purchasable: false
---
```

### b-rot.md

```markdown
---
name: "B-ROT"
author: "Šimon Brzobohatý"
authorInstagram: "@l8pure"
authorEmail: "latepoor@gmail.com"
year: 2025
description: "B-ROT is a monospace typeface inspired by the aesthetics of typewriters, DIY publishing culture, and digital themes from the turn of the millennium. Rooted in the history of technical fonts, it also reflects current typographic needs. Suitable for both offline and online use, B-ROT combines strong character with functionality. Designed using a skeleton-based approach, it emphasizes rhythm and legibility, offering a headline presence with potential for use in text settings."
mode: "mono"
classification: "mono"
scripts: ["latin"]
fonts:
  - variant: "Regular"
    file: "/fonts/BROT-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "She imitates a fiery gaze, triumphantly, as if she had invented some new vice. And there a carriage stops. What a beautiful landau! Let's take a look!"
tagline: "Kritická abeceda"
tags: ["monospace", "display"]
featured: false
order: 5
purchasable: false
---
```

### aft.md

```markdown
---
name: "Aft"
author: "Jaromír Květoň"
authorUrl: "https://www.jaromirkveton.com"
authorEmail: "hello@jaromirkveton.com"
year: 2024
description: "Constructed. Dynamic. Primitive. Aft draws inspiration from Tyfa Text – its refined, simplified forms that break from traditional calligraphy. Its monolinear, tapering strokes, curved arches, and minimal or absent serifs make the uppercase E nearly sans-serif. Aft combines Tyfa's design with a pursuit of primitiveness, influenced by experiments in micro-legibility by Émile Javal and Charles Dreyfuss, as well as Daniel Fisset's research on dyslexic typefaces. While these influences are primarily aesthetic, the typeface remains legible at small sizes. Rather than avoiding print errors, it embraces them as visual input. Serifs and shapes merge into solid forms, with a focus on stroke endings and letter recognition over fine detail. The distinctive lowercase g exemplifies its use of unique proportions – an approach applied across the alphabet to form a unified system of abstract strokes."
mode: "text"
classification: "serif"
scripts: ["latin", "czech", "german"]
fonts:
  - variant: "Regular"
    file: "/fonts/Aft-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "There is also sunshine on Příkopy Street. But only the commercial council Slunitschko. Mr Slunitschko likes to stand outside the Waldek & Wagner shop, which sells rubber goods and utensils, and his face often has that gleam that has always characterised great merchants: Marco Polo, Fugger, Li-hung-cang."
  cs: "Rád tam postává — je to uprostřed mezi dvěma bankami, Českou zemskou bankou a Úvěrním ústavem, a to dělá vždycky dobrý dojem. Mimoto chodí stále oblečen černě."
  de: "Sie imitiert einen heißen Blick, triumphierend, als hätte sie eine neue Lasterhaftigkeit erfunden. Und dort hält ein Wagen. Was für ein prächtiger Landauer!"
tagline: "Brief glitches"
tags: ["serif", "text", "experimental"]
featured: false
order: 6
purchasable: false
---
```

### asystematik.md

```markdown
---
name: "Asystematik"
author: "Jaroslav Lekeš"
authorInstagram: "@jaroslav_lekes"
authorEmail: "lekesjara@gmail.com"
year: 2024
description: "Asystematik draws inspiration from Oldřich Menhart's handwritten Manuskript (1943). The project focused on analyzing and defining each of his letterforms to better understand their construction. The final design reflects my interpretation, shaped by technical insight into calligraphic techniques. With its organic forms, Asystematik pairs especially well with illustrations, complementing their expressive character."
mode: "script"
classification: "script"
scripts: ["latin", "czech"]
fonts:
  - variant: "Regular"
    file: "/fonts/Asystematik-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "He makes a very bold impression, and there is nothing strange about that, because one of his ancestors bravely made his way to the late Hermann Cherusko so as not to miss out on the oak trade in the Teutoburg Forest."
tagline: "Lino & Dřevo"
tags: ["handwritten", "calligraphic"]
featured: false
order: 7
purchasable: false
---
```

### benzsch.md

```markdown
---
name: "Benzsch"
author: "Benjamin Horváth"
authorEmail: "benhor2004@gmail.com"
year: 2024
description: "Digitization of Genzsch Antiqua from a not-so-great photograph (iPhone 6, with flash) of a not particularly well-done proof of the two-cicero Genzsch Antiqua, stored in the basement of UMPRUM's letterpress workshop. The newly digitized Benzsch is special not only for its absence of other historically present cuts but also for the uneven darkness of characters and punctuation supporting only a few negligible languages."
mode: "text"
classification: "serif"
scripts: ["latin", "czech", "german"]
fonts:
  - variant: "Regular"
    file: "/fonts/Benzsch-Regular.woff2"
    style: normal
    weight: 400
specimens:
  de: "Sie imitiert einen heißen Blick, triumphierend, als hätte sie eine neue Lasterhaftigkeit erfunden. Und dort hält ein Wagen. Was für ein prächtiger Landauer! Schauen wir mal! Die Frau des Millionärs Kostertsche sitzt darin und isst mit bloßen Fingern kalte Linsen aus ihrer Pompadourhaube."
tagline: "Primal Scream"
tags: ["serif", "historical", "digitization"]
featured: false
order: 8
purchasable: false
---
```

### block-antiqua.md

```markdown
---
name: "Block Antiqua"
author: "Žofia Kosová"
authorInstagram: "@zofkakosova"
authorEmail: "kosovazofia@gmail.com"
year: 2024
description: "Block Antiqua is a new cut of the well-known Block font, which is considered in certain literature as the height of tastelessness that should rather not be shown. Yet the font was for a time quite popular to the point of overuse. The original designs have several cuts, ranging from condensed to bold cuts, I even found it in Block Fraktur."
mode: "text"
classification: "sans"
scripts: ["latin", "czech"]
fonts:
  - variant: "Medium"
    file: "/fonts/BlockAntiqua-Medium.woff2"
    style: normal
    weight: 500
specimens:
  cs: "Na Příkopech je také sluníčko. Ovšem jen komerční rada Slunitschko. Pan Slunitschko rád postává u krámu firmy Waldek & Wagner, gumové zboží a uterusilie, a na jeho tváři bývá onen odlesk, kterým se odjakživa vyznačovali velcí obchodníci: Marco Polo, Fugger, Li-hung-cang."
tagline: "Die berühmte Block familie bekommt Zuwachs!"
tags: ["sans", "display", "historical"]
featured: false
order: 9
purchasable: false
---
```

### burnout-script.md

```markdown
---
name: "Burnout Script"
author: "Žofia Fodorová"
authorInstagram: "@shrimptailtypefoundry"
authorEmail: "zofia.fodorova@gmail.com"
year: 2024
description: "Burnout Script is a typeface for anyone who can appreciate wood and is scared to burn out."
mode: "script"
classification: "script"
scripts: ["latin"]
fonts:
  - variant: "Regular"
    file: "/fonts/BurnoutScript-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "There is also sunshine on Příkopy Street. But only the commercial council Slunitschko. Mr Slunitschko likes to stand outside the Waldek & Wagner shop, which sells rubber goods and utensils, and his face often has that gleam that has always characterised great merchants."
tagline: "I Love Working Until Im Burnt Out"
tags: ["script", "display", "wood"]
featured: false
order: 10
purchasable: false
---
```

### centavra.md

```markdown
---
name: "Centavra"
author: "Victoria Naumuk"
authorInstagram: "@ndnoone"
authorEmail: "viktoria09020123@gmail.com"
year: 2024
description: "Rooted in classical forms of Centaur typeface designed by Bruce Rogers (1914), the Centavra font updates this legacy for contemporary design. Stripped of unnecessary weight, its monolinear structure represents the essential skeleton of the typeface's identity. The design emphasizes clarity and precision, with even strokes that harmonize with its classic proportions. The serifs, sharp yet graceful, remain as a tribute to the font's historical origins while adapting seamlessly to modern needs."
mode: "text"
classification: "serif"
scripts: ["latin", "cyrillic"]
fonts:
  - variant: "Regular"
    file: "/fonts/Centavra-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "He makes a very bold impression, and there is nothing strange about that, because one of his ancestors bravely made his way to the late Hermann Cherusko so as not to miss out on the oak trade in the Teutoburg Forest."
tagline: "Skeleton of the identity"
tags: ["serif", "monolinear", "classical"]
featured: false
order: 11
purchasable: false
---
```

### ecken-stil.md

```markdown
---
name: "Ecken Stil"
author: "Victoria Naumuk"
authorInstagram: "@ndnoone"
authorEmail: "viktoria09020123@gmail.com"
year: 2024
description: "Rooted in the angular structure of Fraktur and early Gothic lettering, it revives the sharp elegance of historical forms while reinterpreting them through a contemporary Cyrillic lens. The font preserves the strong geometric character of traditional inscriptions while offering a modern, legible structure for contemporary use."
mode: "display"
classification: "blackletter"
scripts: ["cyrillic", "latin"]
fonts:
  - variant: "Regular"
    file: "/fonts/EckenStil-Regular.woff2"
    style: normal
    weight: 400
specimens:
  uk: "Вона імітує запальний погляд, тріумфально, ніби винайшла якийсь новий порок. І тут зупиняється карета. Яка прекрасна ландо! Давайте подивимося! Але це не діє на стару даму. Ну, а хто це? — Може, він уже повернувся з Відня?"
tagline: "Літери з краєм"
tags: ["blackletter", "fraktur", "cyrillic"]
featured: false
order: 12
purchasable: false
---
```

### eclipse.md

```markdown
---
name: "Eclipse"
author: "Jessica Ledoux"
authorInstagram: "@madameledoux"
authorEmail: "bonjour@jessicaledoux.ca"
year: 2023
description: "This font called Eclipse explores the limits of legibility based on the concept of a solar eclipse, with geometrical shape to create cutouts in letters. The result of this experimentation is an impactful font, which reminds of the Letraset era in a modern way, that can be used for display purposes."
mode: "display"
classification: "display"
scripts: ["latin"]
fonts:
  - variant: "Regular"
    file: "/fonts/Eclipse-Regular.woff2"
    style: normal
    weight: 400
specimens:
  en: "he makes a very bold impression, and there is nothing strange about that, because one of his ancestors bravely made his way to the late hermann cherusko so as not to miss out on the oak trade in the teutoburg forest."
tagline: "total eclipse of the heart"
tags: ["display", "geometric", "experimental"]
featured: false
order: 13
purchasable: false
---
```

### empe-sans.md

```markdown
---
name: "Empe Sans"
author: "Kintija Karasa"
authorUrl: "https://www.behance.net/kintijakarasa"
authorEmail: "kintija.elina@gmail.com"
year: 2022
description: "Mechanically condensed grotesque typeface with italics that are extra slanted. Generally inspired by the 90s trend of using condensed type on various ephemera like album sleeves and magazines. The typeface name originates from Empedocles, who is best known for originating the cosmogonic theory of the four classical elements (air, fire, earth, water)."
mode: "text"
classification: "sans"
scripts: ["latin"]
fonts:
  - variant: "Regular"
    file: "/fonts/EmpeSans-Regular.woff2"
    style: normal
    weight: 400
  - variant: "Italic"
    file: "/fonts/EmpeSans-Italic.woff2"
    style: italic
    weight: 400
specimens:
  en: "He makes a very bold impression, and there is nothing strange about that, because one of his ancestors bravely made his way to the late Hermann Cherusko so as not to miss out on the oak trade in the Teutoburg Forest."
tagline: "Six Feet Over"
tags: ["sans", "condensed", "grotesk"]
featured: false
order: 14
purchasable: false
---
```

### ciment.md

```markdown
---
name: "Ciment"
author: "Žofia Fodorová"
authorInstagram: "@shrimptailtypefoundry"
authorEmail: "zofia.fodorova@gmail.com"
year: 2020
description: "Beton ripp-off."
mode: "display"
classification: "slab"
scripts: ["latin", "czech"]
fonts:
  - variant: "Regular"
    file: "/fonts/Ciment-Regular.woff2"
    style: normal
    weight: 400
specimens:
  cs: "Imituje žhavý pohled, vítězně, jako kdyby vynalezla nějakou novou neřest. A tamhle zastavuje vůz. Jaký nádherný landauer!"
tagline: "Ciment is a real staple element to your design."
tags: ["slab", "display"]
featured: false
order: 15
purchasable: false
---
```

### frot.md

```markdown
---
name: "Frot"
author: "Jaromír Květoň"
authorUrl: "https://www.jaromirkveton.com"
authorEmail: "hello@jaromirkveton.com"
year: 2024
description: "Grotesque typeface exploring constructed primitiveness."
mode: "text"
classification: "sans"
scripts: ["latin", "czech"]
fonts:
  - variant: "Regular"
    file: "/fonts/Frot-Regular.woff2"
    style: normal
    weight: 400
specimens:
  cs: "Působí nejvýš opovážlivým dojmem, a není na tom nic divného, neboť jeden z jeho předků pronikl odvážně až k nebožtíkovi Hermannu Cheruskovi, aby si nenechal ujít duběnkový obchod v Teutoburském lese."
tagline: "Eleanor Wawes Rigby"
tags: ["sans", "grotesk"]
featured: false
order: 16
purchasable: false
---
```

---

## БЫСТРАЯ КОМАНДА: создать все файлы разом

Скопируй содержимое каждого блока выше в отдельный файл.
Или через Claude Code — он может создать все 16 файлов за один промпт.

Убедись что файлы шрифтов (.woff2) лежат в public/fonts/
с точно такими именами как указано в поле "file" каждого markdown.
