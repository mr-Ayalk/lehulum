# FR-SL-01, FR-IN-07, NFR-LIC-02: Optional MADLAD-400 draft. Off unless TRANSLATE=madlad.
from api.settings import model_dir, translate_engine


def draft(text, target):
    engine = translate_engine()
    if engine == "none" or not text.strip():
        return None
    if engine != "madlad":
        raise RuntimeError(f"Unknown translator '{engine}'.")
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    model_id = "google/madlad400-3b-mt"
    cache = str(model_dir())
    tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir=cache)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_id, cache_dir=cache)
    prompt = f"<2{target}> {text.strip()}"
    tokens = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=256)
    output = model.generate(**tokens, max_new_tokens=256)
    return tokenizer.batch_decode(output, skip_special_tokens=True)[0].strip()
