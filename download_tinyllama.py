from transformers import AutoTokenizer, AutoModelForCausalLM

model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

print("Downloading TinyLlama...")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

model.save_pretrained("models/base_models/tinyllama")
tokenizer.save_pretrained("models/base_models/tinyllama")

print("✅ TinyLlama downloaded and saved locally")
