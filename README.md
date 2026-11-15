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

On a slow link the player shows a note. The text pack and the light pack show their size before download. The text pack is the HTML lesson. The light pack is that HTML plus the lesson audio when ffmpeg is available. “Save for offline” puts the lesson files in the Cache Storage bucket `lehulum-lesson`. Progress stays in `localStorage` under `db-player:progress` and is sent to `POST /api/v1/progress` when the network returns. A repeated `event_id` is stored once. Finishing the lesson also issues the certificate.

The full lesson video is 43 MB. The smaller copy is `demo/data/lesson-light.mp4`, 421 KB, and the audio is `demo/data/lesson-audio.m4a`, 238 KB. The Docker image also includes ffmpeg, so a newly uploaded lesson gets the same small files.

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
- Descriptions, on-screen text, chapters
- Hearing clarity presets and mono
- Text lesson, offline text download, progress queue
- Job cards with audio summary and sign, HTML document, bilingual PDF, Ethiopic and English braille
- Savanna mount, jobs API, Ed25519 Open Badges check, one webhook
- Text pack and light pack with sizes. A line with no sign shows its letters.

Still remaining:

- The PDF has a document language, a title, and real Amharic and English text. It is not yet a validator-clean PDF/UA file. WeasyPrint needs system libraries this machine and the slim Docker image do not have.
- A newly uploaded video keeps a description file and a screen file when the teacher uploads them. The server does not invent the picture.
- Fingerspelling clips are not recorded yet. Put one clip per letter in `demo/data/fingerspell/`. Until then the sign window shows the letters of a missing line.
- There is no Kinect recogniser. Haji 2017 stays a grammar note.
- A co-designer still has to pass the lesson unaided with NVDA or TalkBack. axe-core has not been run on the new controls.
- LTI 1.3 needs the school’s client id, deployment id, and login URL. The steps are in Level 3 above.

## Libraries and their licences

The player is plain JavaScript, no framework. Fonts shipped with the module: Atkinson Hyperlegible, Noto Sans Ethiopic (OFL), JetBrains Mono. The Ethiopic braille table is liblouis `ethio-g1.ctb`, LGPL-2.1, copyright Dr. Tamru E. Belay and Mesar Hameed. The API uses FastAPI (MIT), cryptography, and PyMuPDF. Savanna’s own Bootstrap files are unchanged. This repository is MIT. See `LICENSE`.
