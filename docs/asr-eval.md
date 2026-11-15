# Amharic ASR on demo/data/lesson.mp4

Scored against phrases.csv A01–A14 after removing punctuation and folding common homophone letters (ሀ/ሃ/ሐ/ኀ, አ/ኣ/ዐ, ሰ/ሠ, ጸ/ፀ). That normalisation is for the score only.

| Engine | Model | Licence | WER | CER | Seconds | Note |
| --- | --- | --- | --- | --- | --- | --- |
| omnilingual | omniASR_CTC_300M | Apache-2.0 | n/a | n/a | 0.0 | No module named 'omnilingual_asr' |
| whisper_am | waxal-benchmarking/whisper-tiny-waxal-amh | CC-BY-4.0 | n/a | n/a | 1.0 | faster-whisper is installed, but this checkpoint is not a local CTranslate2 model, and transformers is not installed. Cannot find an appropriate cached snapshot folder for the specified revision on the local disk and outgoing traffic has been disabled. To enable repo look-ups and downloads online, set 'HF_HUB_OFFLINE=0' as environment variable. |

## Examples

### omnilingual

No module named 'omnilingual_asr'

### whisper_am

faster-whisper is installed, but this checkpoint is not a local CTranslate2 model, and transformers is not installed. Cannot find an appropriate cached snapshot folder for the specified revision on the local disk and outgoing traffic has been disabled. To enable repo look-ups and downloads online, set 'HF_HUB_OFFLINE=0' as environment variable.

