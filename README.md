# LE HULUM (ለሁሉም)

Ear to the deaf. Eye for the blind.

LE HULUM is a plug-in for a lesson page. One script tag gives a Deaf learner recorded Ethiopian Sign Language, a blind learner a document and a description, and a learner on a slow connection a text copy of the same lesson. A small server stores jobs, certificates, and progress. The phone does not run a model.

Team: LE HULUM. The sample lesson is “Python: your first variable”.

## The main task we tested

A learner can play the sample lesson with the keyboard, read Amharic and English captions, resize and recolour those captions, open a movable sign window, read the transcript, hear a description of what is on screen, and download a text copy. The same lesson is mounted on the Savanna concept page.

## Run it

```bash
docker compose up --build
```

Then open:

- http://localhost:8080/demo/lesson-video.html
- http://localhost:8080/demo/lesson-text.html
- http://localhost:8080/demo/jobs.html
- http://localhost:8080/demo/live.html
- http://localhost:8080/demo/verify.html
- http://localhost:8080/pages/concept-with-navigation.html
- http://localhost:8080/api/docs
- http://localhost:8080/api/v1/health

`demo/blank.html` is the same player with no lesson chrome around it.

## Install, Level 1

Savanna already contains the player inside `savanna/pages/concept-with-navigation.html`, under the banner, and the script tag before `</body>`. The same tag is on `demo/blank.html`.

```html
<script type="module" src="/module/db-player.js"></script>
<db-player src="/demo/data/lesson.mp4" lang="am"
  captions="/demo/data/lesson.am.vtt,/demo/data/lesson.en.vtt"
  sign="/demo/data/sign.json" glossary="/demo/data/glossary.json"
  describe="/demo/data/descriptions.am.vtt,/demo/data/descriptions.en.vtt"
  screen="/demo/data/screen.json" chapters="/demo/data/chapters.vtt"></db-player>
```

## Install, Level 2

The API is FastAPI under `/api/v1`. Swagger is at `/api/docs`. The written contract is `openapi.yaml`.

```bash
curl -s http://localhost:8080/api/v1/health
curl -s http://localhost:8080/api/v1/jobs
curl -s -X POST http://localhost:8080/api/v1/sign/translate -H "Content-Type: application/json" -d "{\"text\":\"ተለዋዋጭ\"}"
curl -s -X POST http://localhost:8080/api/v1/webhooks -H "Content-Type: application/json" -d "{\"url\":\"http://127.0.0.1:9/hook\"}"
curl -s -X POST http://localhost:8080/api/v1/certificates -H "Content-Type: application/json" -d "{\"lesson_id\":\"python-01\"}"
```

When a learner finishes a lesson, the server posts `lesson.completed` to each registered address.

## Install, Level 3

Each job card includes schema.org `JobPosting` JSON-LD. Finishing a lesson issues an Open Badges 3.0 credential. The proof is `eddsa-jcs-2022`: Ed25519 over the JSON canonical form, and the issuer is a `did:key`. Check it at `demo/verify.html` or `POST /api/v1/certificates/verify`. The private seed is `CERT_ED25519_SEED`. If that is empty, the server writes one into the data folder and does not put it in the browser.

LTI 1.3 is documented here and is not built, which is what the specification asks. A Moodle or Canvas course would register LE HULUM as a tool, send the launch to the same lesson page, and the page would read the launch to know the lesson id. The player itself stays the one script tag above. Building the launch handshake needs the platform’s client id, deployment id, and login URL from the school.

## Offline and slow connection

Before play, the player offers Text only, Light lesson, or Video, with the size of each. It remembers the choice. On a phone that reports the connection, a slow link pre-selects text or light. Otherwise it times a 20 KB probe. Light mode plays `lesson-audio.m4a` and changes the slide at each scene. The next slide is preloaded.

Three packs show their size before the tap. Text is one HTML file. Light is that HTML with the speech audio and the slide pictures inside it. Video is saved in 256 KB pieces so a dropped connection continues, and Background Fetch is used when the browser has it. “My downloads” lists what is stored and can delete it. Share sends the text lesson as a file, or a link if the phone will not share a file. “Save for offline” stores the lesson files in the Cache Storage bucket `lehulum-lesson` and asks the browser to keep that storage. A service worker plays those files with no network.

Progress events sit in IndexedDB with a unique id. They are sent on `online` and on the Background Sync tag `lehulum-progress`. A repeated id is stored once. The learner sees “Saved on this phone. It will send when you are online.” Finishing the lesson also issues the certificate.

Hearing controls are one panel: Clear voice (off, clear, extra clear), volume boost (100, 150, 200%), speed (1, 0.85, 0.75, pitch kept), mono, balance, caption size, colour, and position, and uncertain words. Say again replays the last line from 0.2 s before it started. A second press within 2 s steps back one more line. A long press or Shift+R plays that line at 0.75. Words the recogniser was unsure of are underlined until a person marks the line checked.

The player core that loads before a feature is opened — the player, captions, keyboard, and both language files — is 17 KB gzip (57 KB raw). The project limit is 60 KB gzip. At Chrome Slow 3G (400 kbps, 400 ms round trip) that gzip transfers in about 0.7 s after one round trip. This PC was not run through Chrome’s CPU throttle, so that figure is the transfer time, not a filmed page load. Fonts and the sign window load separately.

The full lesson video is 43 MB. The smaller copy is `demo/data/lesson-light.mp4`, 421 KB, and the audio is `demo/data/lesson-audio.m4a`, 238 KB. Four scene slides are in `demo/data/slides/`. The Docker image also includes ffmpeg, so a newly uploaded lesson gets the same small files.

## Languages

Amharic and English. Captions, descriptions, the transcript, and the job card follow the page language. “Both languages” shows the two caption tracks together. Learner-facing strings live in `module/i18n/am.json` and `module/i18n/en.json`.

## Data and privacy

Learner choices (caption size, colour, description, hearing preset) stay in `localStorage` under `db-player:prefs`. They are not sent to the server. Progress events use the fixed test id `learner-demo`. Jobs, applications, and certificates in this build are test data. No phone numbers of real employers are included.

## Cost to run

Docker runs nginx and the API. No paid model is called. Speech recognition and translation stay off unless a script is uploaded with the video (`TRANSLATE=none` by default). The phone plays recorded clips.

## Finished and not finished

Finished for the sample lesson:

- Keyboard player, transcript, caption size and colour, both languages
- Recorded Ethiopian Sign Language window, glossary, phrase clips
- Descriptions, on-screen text, chapters, braille
- Hearing panel: clarity, boost, speed, mono, balance, caption style, say again
- Text, light, and video choice before play; light slides; offline cache; chunked download; share
- Job cards, HTML document, bilingual PDF, Ethiopic and English braille
- Savanna mount, jobs API, Ed25519 Open Badges check, lesson score in the studio

Still remaining:

- Speech recognition for a new upload needs faster-whisper and torchaudio. They are not installed. The sample captions are written by hand, with one word marked uncertain so the check can be tried.
- A newly uploaded video keeps a description file and a screen file when the teacher uploads them. Picture reading needs Tesseract, which is not installed. The sample screen text is written by hand.
- Spoken description files need espeak-ng. It is not installed, so descriptions and job audio use the phone’s own voice when it has one.
- The PDF has a document language, a title, and real Amharic and English text. It is not yet a validator-clean PDF/UA file. WeasyPrint needs system libraries this machine and the slim Docker image do not have.
- Fingerspelling clips are not recorded yet. Put one clip per letter in `demo/data/fingerspell/`. Until then the sign window shows the letters of a missing line.
- There is no Kinect recogniser. Haji 2017 stays a grammar note.
- A co-designer still has to pass the lesson unaided with NVDA or TalkBack. axe-core has not been run on the new controls.
- LTI 1.3 needs the school’s client id, deployment id, and login URL. The steps are in Level 3 above.

## Libraries and their licences

The player is plain JavaScript, no framework. Fonts shipped with the module: Atkinson Hyperlegible, Noto Sans Ethiopic (OFL), JetBrains Mono. The Ethiopic braille table is liblouis `ethio-g1.ctb`, LGPL-2.1, copyright Dr. Tamru E. Belay and Mesar Hameed. The API uses FastAPI (MIT), cryptography, and PyMuPDF. Savanna’s own Bootstrap files are unchanged. This repository is MIT. See `LICENSE`.
