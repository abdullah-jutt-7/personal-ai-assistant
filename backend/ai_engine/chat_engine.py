from transformers import AutoModelForCausalLM, AutoTokenizer

# MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"   # or fine_tuned if not trained yet
# MODEL_NAME = "models/base_models/tinyllama"
MODEL_NAME = "models/finetuned/intellitext"


SYSTEM_PROMPT = "You are a helpful AI assistant. Answer only the last user question clearly and concisely."

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
model.eval()

def get_response(user_input):
    SYSTEM_PROMPT = (
        "You are Intellitext, a highly intelligent personal AI assistant. "
        "Your ONLY name is Intellitext. If anyone asks 'who are you' or 'what is your name', you MUST answer that your name is Intellitext. "
        "You help with daily life, coding, studies, decisions, and emotional support. "
        "You explain things simply. You act like a helpful friend. "
        "Answer the user's last message clearly and completely. "
        "Do NOT ask questions. Only answer fully. "
        "When the user asks for code, you MUST ALWAYS wrap your code in Markdown code blocks like ```php ... ```."
    )

    prompt = f"<|system|>\n{SYSTEM_PROMPT}</s>\n{user_input}<|assistant|>\n"

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )

    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]

    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token

    outputs = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        max_new_tokens=400,      # increased so it stops cutting off responses!
        do_sample=False,         # faster deterministic answers
        repetition_penalty=1.1,
        use_cache=True,          # Speed up generation on CPU
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id
    )

    # Only new tokens
    generated_tokens = outputs[0][input_ids.shape[1]:]
    text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    # Hard stop at User/AI and stop tokens
    stop_words = ["User:", "AI:", "Human:", "Assistant:", "###", "\nUser", "\nAI", "<|user|>", "<|system|>", "</s>"]
    for w in stop_words:
        if w in text:
            text = text.split(w)[0].strip()

    return text