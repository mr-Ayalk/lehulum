# Models and licences

Checked before any engine is called. Commercial use is allowed only for MIT, Apache-2.0, CC-BY, or a licence of the same kind. Weights download into `DATA_DIR/models/` on first use, not at import.

## English speech — faster-whisper `small`

| | |
| --- | --- |
| Engine | `ASR_EN=faster_whisper` |
| Weights | OpenAI Whisper small, via the faster-whisper CTranslate2 build |
| Licence | MIT (OpenAI Whisper and faster-whisper) |
| Training data | The Whisper weak-supervision mix described in Radford et al. 2022. Not an Amharic fine-tune. |

## Amharic speech — Omnilingual ASR CTC 300M

| | |
| --- | --- |
| Engine | `ASR_AM=omnilingual` |
| Model card | `omniASR_CTC_300M` / [facebook/omniASR-CTC-300M](https://huggingface.co/facebook/omniASR-CTC-300M) |
| Licence | Apache-2.0 for the code and the weights |
| Training data | Meta Omnilingual ASR, 1,600+ languages. The released corpus [facebook/omnilingual-asr-corpus](https://huggingface.co/datasets/facebook/omnilingual-asr-corpus) is CC-BY-4.0. CTC models are not language-conditioned. |
| Timings | `transcribe()` returns segment text. Word times, when needed, come from alignment. |
| Audio limit | The public CTC pipeline accepts clips under 40 seconds, so longer lessons are cut into 30 second pieces. |

This is the smallest CPU CTC checkpoint in that family (about 1.3 GiB, plus torch). It was not installed on this laptop: the free disk was about 3.8 GB, and the wheels plus the checkpoint do not fit.

## Amharic speech — Whisper fine-tune

| | |
| --- | --- |
| Engine | `ASR_AM=whisper_am` |
| Model id | `waxal-benchmarking/whisper-tiny-waxal-amh` |
| Licence | CC-BY-4.0 (the model card). Commercial use is allowed with attribution. |
| Base | `openai/whisper-tiny` (MIT) |
| Training data | WAXAL Amharic conversational speech. The model card says that data is CC-BY 4.0. |
| Reported quality | WER 41.3% and CER 16.8% on the WAXAL Amharic test set (the card). |

Skipped:

- `chappM/whisper-amharic-small-v2` is OpenRAIL, which adds use restrictions. It is not MIT, Apache-2.0, or CC-BY.
- `drmeeseeks/whisper-small-amet` and `whisper-medium-v2-amet` are Apache-2.0 but their own cards report WER above 100% on FLEURS Amharic, so they are not used.

The tiny WAXAL weights are PyTorch safetensors (151 MB), not a CTranslate2 model. faster-whisper can load them only after conversion, and that conversion needs torch. The repo also stores a 302 MB optimizer file, so a full snapshot is about 750 MB. transformers can load the weights directly. Neither torch nor transformers is installed here, because the free disk after the API image was about 1.4 GB.

## Translation — MADLAD-400

| | |
| --- | --- |
| Engine | `TRANSLATE=madlad` (default `none`) |
| Model | `google/madlad400-3b-mt` |
| Licence | Apache-2.0 |
| Note | Left off. The 3B checkpoint is slow on CPU and too large for this disk. |

## Not used

MMS-TTS and NLLB stay out, as the requirements ask. The forced aligner does not load an MMS checkpoint.
