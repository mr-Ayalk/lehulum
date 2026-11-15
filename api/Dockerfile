# FR-SL-14, INT-05, NFR-SUS-03: API image with Python 3.11 and ffmpeg.
FROM python:3.11-slim

ARG WITH_ASR=0

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY api/requirements.txt /app/api/requirements.txt
COPY api/requirements-asr.txt /app/api/requirements-asr.txt
RUN pip install --no-cache-dir -r /app/api/requirements.txt \
    && if [ "$WITH_ASR" = "1" ]; then pip install --no-cache-dir -r /app/api/requirements-asr.txt; fi
COPY tools/vtt_align.py /app/tools/vtt_align.py
COPY api /app/api

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
