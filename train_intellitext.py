import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# ================= CONFIG =================
BASE_MODEL = "models/base_models/tinyllama"
DATASET_PATH = "models/datasets/intellitext_chat.jsonl"
OUTPUT_DIR = "models/finetuned/intellitext"

# ================= TOKENIZER =================
print("🔹 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
tokenizer.pad_token = tokenizer.eos_token

# ================= MODEL =================
print("🔹 Loading base model...")
model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    device_map="cpu",
    torch_dtype=torch.float32
)

model = prepare_model_for_kbit_training(model)

# ================= LoRA =================
lora_config = LoraConfig(
    r=4,
    lora_alpha=8,
    target_modules=["q_proj","v_proj"],
    lora_dropout=0.02,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)

# ================= DATA =================
print("🔹 Loading dataset...")
dataset = load_dataset("json", data_files=DATASET_PATH)

def format_data(example):
    system_prompt = (
        "You are Intellitext, a friendly, intelligent AI assistant. "
        "You help with daily life, coding, studies, decisions, and emotional support. "
        "You explain things simply. You act like a helpful friend. "
        "Answer the user's message clearly and completely. "
        "Do NOT ask questions. Only answer fully. "
        "When the user asks for code, you ALWAYS write complete working code."
    )
    text = f"<|system|>\n{system_prompt}</s>\n<|user|>\n{example['instruction']}</s>\n<|assistant|>\n{example['response']}</s>"
    tokens = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=256
    )
    tokens["labels"] = tokens["input_ids"].copy()
    return tokens

dataset = dataset.map(format_data)

# ================= TRAINING =================
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    num_train_epochs=5,   # Moderate level: not too few, not too many. CPU safe
    learning_rate=2e-4,
    logging_steps=20,
    save_steps=500,
    save_total_limit=2,
    fp16=False,
    report_to="none"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
)

# ================= START =================
print("🚀 Training started...")
trainer.train()

# ================= SAVE =================
print("💾 Saving model...")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("✅ Training complete!")
print("Model saved in:", OUTPUT_DIR)